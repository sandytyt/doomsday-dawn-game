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

var FOOD_HUNGER_RECOVERY = {
  '零食': 12, '乾糧': 12, '口糧': 25, '罐頭': 25, '乾肉': 25,
  '餅乾': 12, '軍糧': 25, '烹煮': 42, '野味': 42, '熱食': 42,
  '飽餐': 60, '聚餐': 60, '大餐': 60
};
var DEFAULT_FOOD_RECOVERY = 20;

var WATER_ONLY_KEYWORDS = ['水', '飲用水', '礦泉水', '生理食鹽水'];

function isWaterOnly(name) {
  var hasWaterWord = WATER_ONLY_KEYWORDS.some(function (w) { return name.indexOf(w) !== -1; });
  if (!hasWaterWord) return false;
  var foodExclusion = ['湯', '粥', '茶飲', '果汁'];
  var isActuallyFood = foodExclusion.some(function (w) { return name.indexOf(w) !== -1; });
  return !isActuallyFood;
}

// 【階段0新增】食物分配類型分流
var FOOD_SHARE_TYPES = {
  '零食': 'individual',
  '乾糧': 'individual',
  '口糧': 'individual',
  '罐頭': 'individual',
  '乾肉': 'individual',
  '餅乾': 'individual',
  '軍糧': 'individual',
  '烹煮': 'shared',
  '野味': 'shared',
  '熱食': 'shared',
  '飽餐': 'shared',
  '聚餐': 'shared',
  '大餐': 'shared'
};

// 【階段0新增】地圖池對應關係（依據世界觀密檔設定）
var MAP_PRESETS = {
  wilhelm_city: {
    name: '維爾赫姆市',
    locations: ['廢棄回聲實驗室', '靜默層核心地帶', '淪陷的市區街道', '特化變異體巢穴', '崩塌的地鐵網']
  },
  greywall: {
    name: '灰堡',
    locations: ['軍事檢查哨', '鐵幕指揮中心', '地下兵工廠', '平民配給區', '宵禁隔離帶']
  },
  ashfield: {
    name: '荒原鎮群',
    locations: ['拾骸者市集', '廢棄車輛墳場', '外圍警戒哨塔', '臨時農地', '無政府聚落']
  },
  sanctum_of_silence: {
    name: '靜默聖所',
    locations: ['異常地質坑', '靜默祭壇', '信徒冥想區', '地下教壇', '迷幻孢子區']
  },
  hollowreach_relay: {
    name: '深谷中繼站',
    locations: ['廢棄通訊基地', '深層獵手前哨', '地下資料庫', '狙擊手陣地', '封鎖銷毀區']
  }
};
