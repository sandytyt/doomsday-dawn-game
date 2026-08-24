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

var RANDOM_CHAR_POOL = {
  namesByGender: {
    '男': ['楊嘉懿', '湯成弘', '何樂軒', '趙立群', '徐凱文', '陳彥廷', '黃鴻卓', '吳承恩', '霍星宇', '周君之'],
    '女': ['陳心宜', '黃思齊', '吳凝安', '楊晨曦', '周芷若', '林詩涵', '張夏旋', '劉雨薇', '徐以晴', '謝文心']
  },
  genders: ['男', '女'],
  locations: ['市郊工業區', '舊城區公寓', '沿海漁村', '大學宿舍', '郊區農場', '市中心辦公大樓', '山區小鎮', '港口貨運站', '醫院'],
  occupations: ['護理系學生', '便利店店員', '貨車司機', '國中教師', '維修技師', '自由撰稿人', '退伍軍人', '餐廳廚師', '醫生', '上班族']
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomNameByGender(gender) {
  var pool = RANDOM_CHAR_POOL.namesByGender[gender];
  if (!pool || pool.length === 0) {
    var merged = RANDOM_CHAR_POOL.namesByGender['男'].concat(RANDOM_CHAR_POOL.namesByGender['女']);
    return pickRandom(merged);
  }
  return pickRandom(pool);
}
