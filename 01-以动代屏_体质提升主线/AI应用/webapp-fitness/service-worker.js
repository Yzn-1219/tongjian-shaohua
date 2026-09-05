// ===== Service Worker - 离线缓存 =====
const CACHE_VER = 'tjs-fitness-v11';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './training-parser.js',
  './fitness.js',
  './coach.js',
  './manifest.webmanifest',
  './vendor/marked.min.js',
  './vendor/jsqr.min.js',
  './vendor/qrcode.min.js',
  './assets/logo.png',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VER).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_VER).then(cache => cache.put(e.request, clone)).catch(() => {});
        return resp;
      }).catch(() => cached);
    })
  );
});
