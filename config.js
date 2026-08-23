/* ============================================
   末日黎明：喪屍浩劫 — 個人化設定檔
   ============================================ */

var CONFIG = {

  PROVIDERS: {
    gemini: {
      label: 'Google Gemini',
      defaultModel: 'gemini-3.5-flash-lite',
      format: 'gemini'
    },
    deepseek: {
      label: 'DeepSeek',
      defaultModel: 'deepseek-chat',
      format: 'openai',
      endpoint: 'https://api.deepseek.com/chat/completions'
    },
    qwen: {
      label: 'Qwen（通義千問）',
      defaultModel: 'qwen-plus',
      format: 'openai',
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
    },
    doubao: {
      label: '豆包',
      defaultModel: 'doubao-pro-32k',
      format: 'openai',
      endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
    }
  },

  ACTIVE_PROVIDER: 'gemini',
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
