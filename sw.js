/* Grid Club v0.9.30 · larger Word Rescue scene and plural vocabulary */
const CACHE='gridclub-pwa-v0.9.30';
const APP_FILES=[
  './','./index.html',
  './puzzle.js?v=0.9.9',
  './levels.js?v=0.9.25',
  './win-messages.js?v=0.9.5',
  './daily-journey.js?v=0.9.25',
  './club-credits.js?v=0.9.11',
  './game.js?v=0.9.25',
  './pipe-shift.css?v=0.9.25',
  './vault-reward.css?v=0.9.25',
  './dot-daily.css?v=0.9.25',
  './home-roadmap.css?v=0.9.26',
  './word-rescue.css?v=0.9.30',
  './word-rescue-engine.js?v=0.9.30',
  './word-rescue.js?v=0.9.30',
  './vault-reward.js?v=0.9.25',
  './pipe-engine.js?v=0.9.27',
  './pipe-shift.js?v=0.9.28',
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
