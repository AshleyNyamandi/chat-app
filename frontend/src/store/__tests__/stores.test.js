import { beforeEach, expect, test, vi } from 'vitest';
const { api, socket, connect }=vi.hoisted(()=>{
  const socket={connected:false,on:vi.fn(),off:vi.fn(),connect:vi.fn(),disconnect:vi.fn()};
  return {api:{get:vi.fn(),post:vi.fn(),patch:vi.fn()},socket,connect:vi.fn(()=>socket)};
});
vi.mock('../../lib/axios',()=>({default:api}));
vi.mock('socket.io-client',()=>({io:connect}));
vi.mock('react-hot-toast',()=>({default:{error:vi.fn(),success:vi.fn()}}));
vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});
const { useAuthStore }=await import('../useAuthStore');
const { useChatStore }=await import('../useChatStore');
const alice={_id:'alice',fullName:'Alice'},bob={_id:'bob',fullName:'Bob'};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {resolve,promise}};
beforeEach(()=>{
  vi.clearAllMocks();
  useChatStore.setState({selectedUser:alice,messages:[],chats:[],allContacts:[],activeTab:'chats',isMessagesLoading:false,isUsersLoading:false});
  useAuthStore.setState({authenticatedUser:bob,socket:null,onlineUsers:[]});
});
test('late history for a previous conversation cannot overwrite the active conversation',async()=>{
  const old=deferred();api.get.mockReturnValueOnce(old.promise).mockResolvedValueOnce({data:{data:[{_id:'bob-msg'}]}});
  const pending=useChatStore.getState().getMessagesByUserId(alice._id);
  useChatStore.getState().setSelectedUser(bob);
  await useChatStore.getState().getMessagesByUserId(bob._id);
  old.resolve({data:{data:[{_id:'alice-msg'}]}});await pending;
  expect(useChatStore.getState().messages).toEqual([{_id:'bob-msg'}]);
});
test('history response preserves a live message received while loading',async()=>{
  const old=deferred();api.get.mockReturnValueOnce(old.promise);
  const pending=useChatStore.getState().getMessagesByUserId(alice._id);
  useChatStore.setState({messages:[{_id:'live-msg'}]});
  old.resolve({data:{data:[{_id:'history-msg'}]}});await pending;
  expect(useChatStore.getState().messages.map(m=>m._id)).toEqual(['history-msg','live-msg']);
});
test('logout resets chat data and ignores history from the previous account',async()=>{
  const old=deferred();api.get.mockReturnValueOnce(old.promise);api.post.mockResolvedValueOnce({});
  const pending=useChatStore.getState().getMessagesByUserId(alice._id);
  useChatStore.setState({messages:[{_id:'private'}],chats:[alice],allContacts:[alice]});
  await useAuthStore.getState().logout();
  old.resolve({data:{data:[{_id:'private-late'}]}});await pending;
  expect(useChatStore.getState().selectedUser).toBeNull();
  expect(useChatStore.getState().messages).toEqual([]);
  expect(useChatStore.getState().chats).toEqual([]);
  expect(useChatStore.getState().allContacts).toEqual([]);
});
test('failed send reports failure and removes its optimistic message',async()=>{
  api.post.mockRejectedValueOnce(new Error('Network offline'));
  expect(await useChatStore.getState().sendMessage({text:'keep my draft'})).toBe(false);
  expect(useChatStore.getState().messages).toEqual([]);
});
test('successful first message updates the chat list',async()=>{
  api.post.mockResolvedValueOnce({data:{data:{_id:'saved'}}});
  expect(await useChatStore.getState().sendMessage({text:'hello'})).toBe(true);
  expect(useChatStore.getState().chats).toEqual([alice]);
});
test('signup network failure is handled without throwing another error',async()=>{
  api.post.mockRejectedValueOnce(new Error('Network offline'));
  await expect(useAuthStore.getState().signUp({})).resolves.toBeUndefined();
  expect(useAuthStore.getState().isSignUp).toBe(false);
});
test('socket honors the configured server URL',()=>{
  vi.stubEnv('VITE_BASE_URL','http://example.test:5001');
  useAuthStore.getState().connectSocket();
  expect(connect).toHaveBeenCalledWith('http://example.test:5001',expect.objectContaining({withCredentials:true}));
  vi.unstubAllEnvs();
});
test('disconnect tears down a pending socket and clears presence',()=>{
  useAuthStore.setState({socket,onlineUsers:['alice']});
  useAuthStore.getState().disconnectSocket();
  expect(socket.disconnect).toHaveBeenCalled();expect(useAuthStore.getState().socket).toBeNull();expect(useAuthStore.getState().onlineUsers).toEqual([]);
});
test('a profile response cannot restore an account after logout',async()=>{
  const pending=deferred();api.patch.mockReturnValueOnce(pending.promise);api.post.mockResolvedValueOnce({});
  const upload=useAuthStore.getState().updateProfile(new FormData());
  await useAuthStore.getState().logout();
  pending.resolve({data:{data:{...bob,profilePic:'updated.png'}}});await upload;
  expect(useAuthStore.getState().authenticatedUser).toBeNull();
});
test('pending contact and chat lists cannot repopulate a logged-out session',async()=>{
  const contacts=deferred(),chats=deferred();api.get.mockReturnValueOnce(contacts.promise).mockReturnValueOnce(chats.promise);api.post.mockResolvedValueOnce({});
  const requests=[useChatStore.getState().getAllContacts(),useChatStore.getState().getMyChatPartners()];
  await useAuthStore.getState().logout();
  contacts.resolve({data:{data:[alice]}});chats.resolve({data:{data:[alice]}});await Promise.all(requests);
  expect(useChatStore.getState().allContacts).toEqual([]);expect(useChatStore.getState().chats).toEqual([]);
});
