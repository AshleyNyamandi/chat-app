import { expect, test } from 'vitest';
import axios from 'axios';
import api from '../axios';
function unauthorized(config) {
  return Promise.reject(new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, {status:401,data:{message:'original error'},headers:{},config}));
}
test('concurrent unauthorized requests share one refresh and retry only once',async()=>{
  let refreshed=false,refreshCalls=0;
  const calls=[];
  api.defaults.adapter=async config=>{
    calls.push(config.url);
    if(config.url==='/auth/refresh-token') {
      refreshCalls++;
      await new Promise(resolve=>setTimeout(resolve,10));
      refreshed=true;
      return {status:200,data:{},headers:{},config};
    }
    if(!refreshed) return unauthorized(config);
    return {status:200,data:{ok:true},headers:{},config};
  };
  const results=await Promise.all([api.get('/one'),api.get('/two')]);
  expect(results.map(result=>result.status)).toEqual([200,200]);
  expect(refreshCalls).toBe(1);expect(calls.filter(path=>path==='/two')).toHaveLength(2);
});
test('failed queued retries do not trigger another refresh cycle',async()=>{
  let refreshCalls=0;
  api.defaults.adapter=async config=>{
    if(config.url==='/auth/refresh-token') {
      refreshCalls++;
      await new Promise(resolve=>setTimeout(resolve,10));
      return {status:200,data:{},headers:{},config};
    }
    return unauthorized(config);
  };
  const results=await Promise.allSettled([api.get('/one'),api.get('/two')]);
  expect(results.every(result=>result.status==='rejected')).toBe(true);expect(refreshCalls).toBe(1);
});
test('login errors preserve the original failure without refreshing',async()=>{
  const calls=[];
  api.defaults.adapter=config=>{calls.push(config.url);return unauthorized(config)};
  await expect(api.post('/auth/login',{})).rejects.toMatchObject({response:{data:{message:'original error'}}});
  expect(calls).toEqual(['/auth/login']);
});
