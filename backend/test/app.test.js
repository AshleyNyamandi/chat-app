import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { io } from 'socket.io-client';

let mongo, server, base, alice, bob, outsider;
const secret = randomBytes(32).toString('hex');
const sockets = [];
const password = 'test-password-123';

function client() {
  const cookies = new Map();
  return {
    cookies,
    async request(path, { method='GET', body, headers={} }={}) {
      const response = await fetch(`${base}${path}`, {
        method, headers: { Cookie: [...cookies].map(([k,v])=>`${k}=${v}`).join('; '), ...(body && !(body instanceof FormData) ? {'Content-Type':'application/json'} : {}), ...headers },
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });
      for (const cookie of response.headers.getSetCookie()) {
        const [key,value] = cookie.split(';')[0].split('=');
        if (value) cookies.set(key,value); else cookies.delete(key);
      }
      return { status: response.status, body: await response.json(), headers: response.headers };
    },
  };
}
async function register(name) {
  const user = client();
  const result = await user.request('/auth/sign-up',{method:'POST',body:{fullName:name,email:`${name.toLowerCase()}@example.test`,password}});
  assert.equal(result.status,201);
  user.id = result.body.data._id;
  return user;
}
async function connect(user) {
  const socket = io(base.replace('/api/v1',''),{transports:['websocket'],reconnection:false,autoConnect:false,extraHeaders:{Cookie:[...user.cookies].map(([k,v])=>`${k}=${v}`).join('; ')}});
  sockets.push(socket);
  const ready = new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject)});
  socket.connect();
  await ready;
  return socket;
}
async function send(from,to,text) {return from.request(`/messages/send/${to.id}`,{method:'POST',body:{text}})}

before(async()=>{
  mongo=await MongoMemoryServer.create();
  const { createServer } = await import('node:net');
  const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
  const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  base=`http://127.0.0.1:${port}/api/v1`;
  server=spawn(process.execPath,['src/server.js'],{env:{...process.env,PORT:String(port),MONGO_URI:mongo.getUri(),ACCESS_TOKEN_SECRET:secret,REFRESH_TOKEN_SECRET:randomBytes(32).toString('hex'),RESEND_API_KEY:'re_local_tests',RESEND_BASE_URL:'http://127.0.0.1:1',SUPABASE_URL:'http://127.0.0.1:1',SUPABASE_SERVICE_ROLE:'synthetic-test-only',CLIENT_URL:'http://localhost',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
  let logs='';server.stdout.on('data',data=>logs+=data);server.stderr.on('data',data=>logs+=data);
  for(let i=0;i<100;i++){
    if(server.exitCode!==null) throw new Error(logs);
    try {if((await fetch(`${base}/health`)).ok) break;} catch {}
    await new Promise(resolve=>setTimeout(resolve,50));
    if(i===99) throw new Error(`Server did not start: ${logs}`);
  }
  await mongoose.connect(mongo.getUri());
  alice=await register('Alice');bob=await register('Bob');outsider=await register('Outsider');
}, {timeout:30000});
after(async()=>{
  sockets.forEach(socket=>socket.disconnect());
  if(server && server.exitCode===null){server.kill();await once(server,'exit')}
  await mongoose.disconnect();await mongo?.stop();
});

test('health, missing routes, and protected endpoints return proper statuses',async()=>{
  const anon=client();assert.equal((await anon.request('/health')).status,200);
  assert.equal((await anon.request('/missing')).status,404);
  for(const path of ['/auth/get-me','/messages/contacts','/messages/chats',`/messages/${bob.id}`]) assert.equal((await anon.request(path)).status,401);
});
test('signup excludes passwords, sets both cookies, and persists auth',async()=>{
  const me=await alice.request('/auth/get-me');assert.equal(me.status,200);assert.equal(me.body.data.password,undefined);
  assert.ok(alice.cookies.has('accessToken'));assert.ok(alice.cookies.has('refreshToken'));
  assert.equal((await alice.request('/auth/sign-up',{method:'POST',body:{fullName:'Duplicate',email:'alice@example.test',password}})).status,400);
});
test('signup rejects missing fields, malformed email, and short passwords',async()=>{
  for(const body of [{},{fullName:'Short',email:'short@example.test',password:'x'},{fullName:'Email',email:'not-an-email',password}]) {
    assert.equal((await client().request('/auth/sign-up',{method:'POST',body})).status,400,JSON.stringify(body));
  }
});
test('login normalizes email and rejects wrong credentials',async()=>{
  assert.equal((await client().request('/auth/login',{method:'POST',body:{email:'alice@example.test',password:'wrong'}})).status,400);
  assert.equal((await client().request('/auth/login',{method:'POST',body:{email:' ALICE@example.test ',password}})).status,200);
});
test('refresh replaces expired access and logout clears cookies',async()=>{
  const user=client();await user.request('/auth/login',{method:'POST',body:{email:'alice@example.test',password}});
  user.cookies.set('accessToken',jwt.sign({userId:alice.id},secret,{expiresIn:-1}));
  assert.equal((await user.request('/auth/get-me')).status,401);
  assert.equal((await user.request('/auth/refresh-token',{method:'POST'})).status,200);
  assert.equal((await user.request('/auth/get-me')).status,200);
  await user.request('/auth/logout',{method:'POST'});assert.equal(user.cookies.size,0);
  assert.equal((await user.request('/auth/refresh-token',{method:'POST'})).status,401);
});
test('contacts exclude current user and passwords',async()=>{
  const contacts=(await alice.request('/messages/contacts')).body.data;
  assert.ok(contacts.some(user=>user._id===bob.id));assert.ok(!contacts.some(user=>user._id===alice.id));assert.ok(contacts.every(user=>!user.password));
});
test('messages persist, history contains both directions and excludes unrelated users',async()=>{
  assert.equal((await send(alice,bob,'hello Bob')).status,201);
  assert.equal((await send(bob,alice,'hello Alice')).status,201);
  await send(outsider,bob,'private outsider message');
  for(const [from,to] of [[alice,bob],[bob,alice]]){
    const result=await from.request(`/messages/${to.id}`);assert.equal(result.status,200);
    assert.deepEqual(result.body.data.map(msg=>msg.text),['hello Bob','hello Alice']);
  }
});
test('chat partners include recipients and senders but exclude self',async()=>{
  await send(alice,bob,'chat list message');
  const chats=(await alice.request('/messages/chats')).body.data;
  assert.deepEqual(chats.map(user=>user._id),[bob.id]);
});
test('invalid input produces client errors rather than 404 or 500',async()=>{
  assert.equal((await send(alice,bob,'   ')).status,400);
  assert.equal((await send(alice,bob,'x'.repeat(2001))).status,400);
  const invalid=await alice.request('/messages/not-an-id');
  assert.equal(invalid.status,404);assert.match(invalid.body.message,/Resource not found/);
  assert.equal((await alice.request('/messages/send/000000000000000000000000',{method:'POST',body:{text:'hello'}})).status,404);
  const form=new FormData();assert.equal((await alice.request('/auth/update-profile',{method:'PATCH',body:form})).status,400);
});
test('image uploads reject non-images before contacting storage',async()=>{
  for(const path of ['/auth/update-profile',`/messages/send/${bob.id}`]){
    const form=new FormData();form.append('file',new Blob(['text'],{type:'text/plain'}),'document.txt');
    assert.equal((await alice.request(path,{method:path.includes('profile')?'PATCH':'POST',body:form})).status,400);
  }
});
test('socket authenticates login cookies and delivers a message once',async()=>{
  const socket=await connect(bob);
  const incoming=new Promise(resolve=>socket.once('newMessage',resolve));
  assert.equal((await send(alice,bob,'live message')).status,201);
  const received=await Promise.race([incoming,new Promise((_,reject)=>setTimeout(()=>reject(new Error('No live message received')),2000))]);
  assert.equal(received.text,'live message');socket.disconnect();
});
test('presence stays online while another tab is connected, and both tabs receive messages',async()=>{
  const observer=await connect(alice),first=await connect(bob),second=await connect(bob);
  let online=[];observer.on('getOnlineUsers',users=>{online=users});
  const one=new Promise(resolve=>first.once('newMessage',resolve));const two=new Promise(resolve=>second.once('newMessage',resolve));
  await send(alice,bob,'all tabs');
  await Promise.race([Promise.all([one,two]),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Message missing in a tab')),2000))]);
  first.disconnect();await new Promise(resolve=>setTimeout(resolve,100));
  assert.ok(online.includes(bob.id));second.disconnect();await new Promise(resolve=>setTimeout(resolve,100));
  assert.ok(!online.includes(bob.id));observer.disconnect();
});

test('requests without bodies and non-string message text return 400',async()=>{
  for (const path of ['/auth/sign-up','/auth/login']) {
    assert.equal((await client().request(path,{method:'POST'})).status,400);
  }
  assert.equal((await alice.request(`/messages/send/${bob.id}`,{method:'POST',body:{text:42}})).status,400);
});
test('storage failure returns an error without persisting a message',async()=>{
  const before=(await alice.request(`/messages/${bob.id}`)).body.data.length;
  const form=new FormData();form.append('file',new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'}),'image.png');
  assert.equal((await alice.request(`/messages/send/${bob.id}`,{method:'POST',body:form})).status,500);
  assert.equal((await alice.request(`/messages/${bob.id}`)).body.data.length,before);
});
