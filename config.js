/* ============================================
   末日黎明：喪屍浩劫 — 個人化設定檔
   此檔案存放非機密的遊戲參數設定
   ============================================ */

const CONFIG = {

  // 使用的 Gemini 模型名稱
  // gemini-2.5-flash-lite：免費額度最充足（每日1000~1500次請求），速度最快，推薦預設使用
  // gemini-2.5-flash：品質稍佳，但免費額度較低
  MODEL_NAME: 'gemini-2.5-flash-lite',

  // 開局初始體力/疲勇度數值上限
  INITIAL_STAMINA: 100,

  // 體力低於此百分比時，畫面觸發警示效果（對應 style.css 的 .low 樣式）
  STAMINA_LOW_THRESHOLD: 45,

  // 體力低於此百分比時，畫面觸發危急閃爍效果（對應 style.css 的 .critical 樣式）
  STAMINA_CRITICAL_THRESHOLD: 20,

  // 上下文保留的最近完整回合數量（超過會自動捨棄最舊的一筆，僅保留摘要）
  MAX_RECENT_TURNS: 5,

  /* ------------------------------------------
     以下為選填：Notion 雲端同步設定
     若暫時不需要跨裝置同步存檔，保持留空即可，
     遊戲會自動僅使用瀏覽器本機儲存（localStorage）。
     若要啟用，需另外部署一個 Cloudflare Workers
     轉發層代理 Notion API 請求（因瀏覽器直接呼叫
     Notion API 會被 CORS 政策封鎖）。
     ------------------------------------------ */

  NOTION_ENABLED: false,          // 設為 true 才會啟用雲端同步邏輯
  NOTION_PROXY_URL: '',            // 你之後部署的 Cloudflare Workers 轉發網址
  NOTION_DATABASE_ID: ''           // 用於存檔同步的 Notion 資料庫 ID

};
