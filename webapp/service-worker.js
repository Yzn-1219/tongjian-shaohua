const CACHE = 'tjs-v11';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/assess.js',
  'js/screentime.js',
  'vendor/marked.min.js',
  'vendor/jsqr.min.js',
  'vendor/qrcode.min.js',
  'assets/logo.png',
  'assets/douyin.jpg',
  'assets/school_badge.png',
  'assets/dept_badge.png',
  'icon.svg',
  'manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return; // AI 调用是 POST，交给网络
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 代理/API 跨域，交给网络
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('index.html'));
    })
  );
});
