const CACHE_VER = 'tjs-ai-check-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './assets/logo.png',
  './vendor/marked.min.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_VER).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp=>{
      if(resp && resp.status===200 && e.request.method==='GET'){
        const clone = resp.clone();
        caches.open(CACHE_VER).then(c=>c.put(e.request, clone));
      }
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
