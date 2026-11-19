/* Grid Club v0.9.21 · updated cache key + stats module */
const CACHE='gridclub-pwa-v0.9.21';
const APP_FILES=[
  './','./index.html',
  './puzzle.js?v=0.9.9',
  './levels.js?v=0.9.20',
  './win-messages.js?v=0.9.5',
  './daily-journey.js?v=0.9.9',
  './club-credits.js?v=0.9.11',
  './game.js?v=0.9.15',
  './pipe-shift.css?v=0.9.20',
  './pipe-engine.js?v=0.9.20',
  './pipe-shift.js?v=0.9.21',
  './stats-utils.js?v=0.7.0',
  './ranked.js?v=0.7.0',
  './backend-config.js?v=0.7.0',
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
