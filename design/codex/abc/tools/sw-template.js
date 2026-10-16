'use strict';
const PREFIX='rsabc-sound-garden-';
const CACHE=PREFIX+encodeURIComponent(self.registration.scope)+'-'+VERSION;
const url=path=>new URL(path,self.registration.scope).href;
async function put(cache,path){const response=await fetch(new Request(url(path),{cache:'reload'}));if(!response.ok)throw Error('Missing cache asset: '+path);await cache.put(url(path),response);}
async function fill(){
 const cache=await caches.open(CACHE);
 // Required failures must reject installation; pending artwork must not.
 await Promise.all(FILES.required.map(path=>put(cache,path)));
 await Promise.allSettled(FILES.optional.map(path=>put(cache,path)));
}
async function status(){const cache=await caches.open(CACHE);const required=await Promise.all(FILES.required.map(p=>cache.match(url(p))));const optional=await Promise.all(FILES.optional.map(p=>cache.match(url(p))));return {type:'CACHE_STATUS',ready:required.every(Boolean),pending:optional.filter(v=>!v).length};}
self.addEventListener('install',event=>event.waitUntil(fill().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const prefix=PREFIX+encodeURIComponent(self.registration.scope)+'-';
 // Cache names are scoped below; never delete a neighboring worktree's cache.
 for(const name of await caches.keys())if(name.startsWith(prefix)&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(!['CACHE_STATUS','REFRESH_CACHE'].includes(event.data?.type))return;
 event.waitUntil((async()=>{if(event.data.type==='REFRESH_CACHE'){try{await fill();}catch{}}event.ports[0]?.postMessage(await status());})());
});
self.addEventListener('fetch',event=>{
 const request=event.request,u=new URL(request.url);
 if(request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const path=u.pathname.slice(new URL(self.registration.scope).pathname.length);
  const known=[...FILES.required,...FILES.optional].includes(path);
  const cached=await cache.match(url(path||'index.html'));
  if(cached){
   // Chromium requests byte ranges for audio. Return a valid local partial response.
   const range=request.headers.get('range');
   if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(match){const data=await cached.arrayBuffer(),size=data.byteLength;let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2])),end=match[1]?(match[2]?Math.min(size-1,Number(match[2])):size-1):size-1;if(start> end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});return new Response(data.slice(start,end+1),{status:206,headers:{'Content-Type':cached.headers.get('Content-Type')||'audio/mpeg','Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});}}
   return cached;
  }
  try{const response=await fetch(request);if(known&&response.ok&&response.status===200)await cache.put(url(path),response.clone());return response;}catch{
   if(request.mode==='navigate')return await cache.match(url('index.html'))||new Response('Garden unavailable',{status:503});
   return new Response('',{status:404});
  }
 })());
});
