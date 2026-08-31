/* ============================================
末日黎明：喪屍浩劫 — Service Worker
負責：離線快取靜態資源，讓遊戲介面在斷網時仍能開啟
注意：AI 供應商 API 呼叫需要網路，斷網時無法生成新劇情，
但已載入過的介面、已讀取的規則書與已存檔的進度可以正常顯示。

【版本更新記錄】
v2：修正快取清單與實際專案目錄結構不符的問題（原清單引用了不存在的
   ./app.js、./config.js，且 knowledge/ 下 4 份規則文件僅快取 1 份，
   導致離線模式下 15 個 js/ 模組與規則書大多讀取失敗）。
v3：補上 app-manual.js、app-base-sim.js 兩個先前未被 index.html 載入、
   現已修復連結的模組，快取清單同步更新以保持一致。
============================================ */

const CACHE_NAME = 'doomsday-dawn-cache-v3';

// 需要離線快取的核心檔案清單（已對齊 index.html 實際引用路徑）
const CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',

  // --- JS 模組（依 index.html 內 <script> 標籤實際載入順序）---
  './js/config.js',
  './js/app-schema.js',
  './js/world_memory.js',
  './js/test_script.js',
  './js/app-state.js',
  './js/app-utils.js',
  './js/app-proficiency.js',
  './js/app-inventory.js',
  './js/app-base-sim.js',
  './js/app-transfer.js',
  './js/app-save.js',
  './js/app-npc.js',
  './js/app-api.js',
  './js/app-engine.js',
  './js/app-ui.js',
  './js/app-events.js',
  './js/app-manual.js',
  './js/app-main.js',

  // --- 遊戲規則書／知識庫（由 app-main.js loadRulesAndLore() 以 fetch() 動態讀取）---
  './knowledge/ai_system_rules.txt',
  './knowledge/virus_lore.txt',
  './knowledge/skill_trees.txt',
  './knowledge/factions.txt',

  // --- PWA 圖示 ---
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

  // AI 供應商 API 請求：一律直接連網，絕不快取（劇情必須即時生成）
  // 涵蓋 Gemini、DeepSeek、Qwen、豆包等 config.js 中列出的所有供應商端點
  const AI_API_HOSTNAMES = [
    'generativelanguage.googleapis.com',
    'api.deepseek.com',
    'dashscope.aliyuncs.com',
    'ark.cn-beijing.volces.com'
  ];
  if (AI_API_HOSTNAMES.some((host) => url.hostname.includes(host))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 其他非同源請求（例如 CDN 字型等）：直接放行，不做快取處理
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
