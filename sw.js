/* 電子野帳 PWA - Service Worker v2
 * navigation/HTML/JS はネットワーク優先 (常に最新を取得)、その他はキャッシュ優先
 */
const CACHE = 'level-survey-v4-' + '20260530b';
const PRECACHE = [
  './manifest.json',
  './icon.svg?v=20260529',
  './apple-touch-icon.png?v=20260529',
  './icon-192.png?v=20260529',
  './icon-512.png?v=20260529',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(PRECACHE.map((u) => c.add(u).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isHtmlOrJs(url) {
  return /\.(html|js)(\?|$)/.test(url) || url.endsWith('/') || /\/$/.test(url);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // HTML/JS/ナビゲーションは「ネットワーク優先」(失敗時のみキャッシュ)
  if (req.mode === 'navigate' || isHtmlOrJs(url.href)) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // それ以外 (画像・CSS・CDN等) は「キャッシュ優先 + 背景更新」
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});