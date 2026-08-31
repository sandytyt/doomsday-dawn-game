/* ============================================
末日黎明：喪屍浩劫 — Service Worker
負責：離線快取靜態資源，讓遊戲介面在斷網時仍能開啟
注意：AI 供應商 API 呼叫需要網路，斷網時無法生成新劇情，
但已載入過的介面、已讀取的規則書與已存檔的進度可以正常顯示。

【版本更新記錄】
v2：修正快取清單與實際專案目錄結構不符的問題。
v3：補上 app-manual.js、app-base-sim.js 兩個先前未被載入的模組。
v4：因應 app-schema.js 新增與 app-api.js 拆分為 app-prompt.js／
   app-api.js／app-response-handler.js 三個檔案，同步更新快取清單。
v5：新增 app-devtools.js（作弊指令集中管理檔案），快取清單同步更新。
============================================ */

const CACHE_NAME = 'doomsday-dawn-cache-v5';

// 需要離線快取的核心檔案清單（已對齊 index.html 實際引用路徑與載入順序）
const CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',

  // --- 1. 遊戲設定檔與世界記憶 ---
  './js/config.js',
  './js/app-schema.js',
  './js/world_memory.js',
  './js/test_script.js',

  // --- 2. 全域狀態與基礎工具 ---
  './js/app-state.js',
  './js/app-utils.js',

  // --- 3. 次系統 ---
  './js/app-proficiency.js',
  './js/app-inventory.js',
  './js/app-base-sim.js',
  './js/app-transfer.js',
  './js/app-save.js',
  './js/app-npc.js',

  // --- 4. 遊戲核心大腦 ---
  './js/app-engine.js',

  // --- 5. 畫面渲染與玩家互動 ---
  './js/app-ui.js',
  './js/app-manual.js',
  './js/app-prompt.js',
  './js/app-api.js',
  './js/app-response-handler.js',
  './js/app-devtools.js',
  './js/app-events.js',

  // --- 6. 主程式進入點 ---
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

  if (url.origin !== location.origin) {
    return;
  }

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
