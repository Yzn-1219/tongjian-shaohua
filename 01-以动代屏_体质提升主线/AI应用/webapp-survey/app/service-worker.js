/* ==========================================================================
   童健韶华 · AI 智能健康应用系统 —— Service Worker
   缓存策略（v3 起，缓存名带版本号）：
     1) 页面文档（HTML）：**网络优先**，断网才用缓存。
        —— 以前是缓存优先，导致改完页面老用户永远看不到新内容。
     2) 静态资源（css/js/图片）：先用缓存，同时后台悄悄更新（stale-while-revalidate）。
     3) 跨域请求（通义千问 API、云数据库）：完全不拦，直接放行。
     4) 新版本接管时，已打开的页面自动刷新一次，避免继续停留在旧页面上。
   ========================================================================== */

/* 构建版本：由 bump_version.py 与根目录 version.js 同步写入，别手改 */
const BUILD = 'v1.4.2';
const CACHE_VER = 'tjs-health-' + BUILD;
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './default-api.js',
  './api.js',
  './training-parser.js',
  './fitness.js',
  './coach.js',
  './assess.js',
  './manifest.webmanifest',
  '../version.js',
  '../ai-notice.js',
  './vendor/marked.min.js',
  './vendor/jsqr.min.js',
  './vendor/qrcode.min.js',
  './assets/logo.png',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VER)
      .then(cache => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        // 只刷新一次：地址里已经带当前版本号的不再刷，避免死循环
        clients.forEach(c => {
          try {
            if (c.url && c.url.indexOf('swv=' + BUILD) === -1 && c.navigate) {
              c.navigate(c.url.split('#')[0] + (c.url.indexOf('?') >= 0 ? '&' : '?') + 'swv=' + BUILD);
            }
          } catch (err) {}
        });
      })
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  // 跨域（AI 接口、云数据库等）一律交给浏览器，不缓存不拦截
  if (url.origin !== self.location.origin) return;

  // 页面文档：网络优先
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (isDoc) {
    e.respondWith(
      fetch(req)
        .then(resp => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_VER).then(c => c.put(req, clone)).catch(() => {});
          }
          return resp;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：先用缓存，后台顺带更新
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_VER).then(c => c.put(req, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
