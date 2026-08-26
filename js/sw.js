/* ============================================
   末日黎明：喪屍浩劫 — Service Worker
   負責：離線快取靜態資源，讓遊戲介面在斷網時仍能開啟
   注意：Gemini API 呼叫需要網路，斷網時無法生成新劇情，
   但已載入過的介面與已存檔的進度可以正常顯示。
   ============================================ */

const CACHE_NAME = 'doomsday-dawn-cache-v1';

// 需要離線快取的核心檔案清單
const CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './config.js',
  './manifest.json',
  './knowledge/virus_lore.txt',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* ---------- 安裝階段：預先快取核心檔案 ---------- */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          CACHE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`快取失敗，略過: ${url}`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

/* ---------- 啟用階段：清除舊版本快取 ---------- */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

/* ---------- 請求攔截策略 ---------- */

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Gemini API 請求：一律直接連網，絕不快取（劇情必須即時生成）
  if (url.hostname.includes('generativelanguage.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 其他請求（非同源，例如CDN字型等）：直接放行，不做快取處理
  if (url.origin !== location.origin) {
    return;
  }

  // 靜態資源：採用「快取優先，背景更新」策略
  // 先回應快取內容確保開啟速度，同時嘗試向網路要求最新版本更新快取
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
