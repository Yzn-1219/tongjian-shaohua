// ===== Service Worker - 离线缓存 =====
const CACHE_VER = 'tjs-aid-v7';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './aid.js',
  './manifest.webmanifest',
  './vendor/marked.min.js',
  './vendor/jsqr.min.js',
  './vendor/qrcode.min.js',
  './assets/team-logo.jpg',
  './assets/team-logo.png',
  './assets/zheye1.png',
  './assets/zheye2.png',
  './assets/gallery/g1.jpg', './assets/gallery/g2.jpg', './assets/gallery/g3.jpg',
  './assets/gallery/g4.jpg', './assets/gallery/g5.jpg', './assets/gallery/g6.jpg',
  './assets/gallery/g7.jpg', './assets/gallery/g8.jpg', './assets/gallery/g9.jpg',
  './assets/gallery/g10.jpg', './assets/gallery/g11.jpg', './assets/gallery/g12.jpg',
  './assets/gallery/g13.jpg', './assets/gallery/g14.jpg', './assets/gallery/g15.jpg',
  './assets/notice/n01.png', './assets/notice/n02.png', './assets/notice/n03.png',
  './assets/notice/n04.png', './assets/notice/n05.png', './assets/notice/n06.png',
  './assets/notice/n07.png', './assets/notice/n08.png', './assets/notice/n09.png',
  './assets/notice/n10.png',
  './assets/policies/sd_zzzx_01.pdf', './assets/policies/sd_zzzx_02.pdf',
  './assets/policies/sd_zzzx_03.pdf', './assets/policies/sd_zzzx_04.pdf',
  './assets/policies/sd_zzzx_05.pdf',
  './assets/policies/school_mianxue.pdf', './assets/policies/school_green.pdf',
  './assets/policies/school_qingong.pdf', './assets/policies/school_linshi.pdf',
  './assets/policies/school_rending.pdf',
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
