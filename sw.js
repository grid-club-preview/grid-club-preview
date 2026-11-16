/* Grid Club v0.4b.2 · updated cache key + stats module */
const CACHE='gridclub-pwa-v0.4b.2';
const APP_FILES=[
  './','./index.html',
  './puzzle.js?v=0.4b.2',
  './game.js?v=0.4b.2',
  './stats-utils.js?v=0.4b.2',
  './ranked.js?v=0.4b.2',
  './backend-config.js?v=0.4b.2',
  './manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE).map(n=>caches.delete(n))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const u=new URL(event.request.url);
  if(u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(event.request);
      if(response.ok)cache.put(event.request,response.clone());
      return response;
    }catch(_){return (await cache.match(event.request))||Response.error();}
  })());
});
