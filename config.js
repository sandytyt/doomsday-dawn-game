/* ============================================
   末日黎明：喪屍浩劫 — 個人化設定檔
   此檔案存放非機密的遊戲參數設定
   測試劇本已獨立至 test_script.js
   ============================================ */

var CONFIG = {

  MODEL_NAME: 'gemini-3.5-flash-lite',

  INITIAL_STAMINA: 100,
  STAMINA_LOW_THRESHOLD: 45,
  STAMINA_CRITICAL_THRESHOLD: 20,

  MAX_RECENT_TURNS: 5,

  TEST_MODE_ENABLED: true,
  TEST_SCRIPT: (typeof TEST_SCRIPT !== 'undefined') ? TEST_SCRIPT : [],

  NOTION_ENABLED: false,
  NOTION_PROXY_URL: '',
  NOTION_DATABASE_ID: ''

};
