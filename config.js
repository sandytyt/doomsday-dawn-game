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

// 【新增】世界宏觀座標與距離設定 (供 AI 參考)
var WORLD_MACRO_MAP = "世界版圖以「維爾赫姆市」為中心。向北50公里為軍事要塞「灰堡」；向東70公里為科技樞紐「深谷中繼站」；向南40公里為宗教領地「靜默聖所」；向西60公里為荒漠「荒原鎮群」。";

// 【新增】智慧食物字典與推算系統
var FOOD_DICTIONARY = {
  "能量棒": { recovery: 20, stamina: 5, shareType: "individual" },
  "食用生理鹽水": { recovery: 5, stamina: 15, shareType: "individual" },
  "軍用口糧": { recovery: 40, stamina: 10, shareType: "individual" },
  "一箱軍用罐頭": { recovery: 120, stamina: 20, shareType: "shared" },
  "大鍋變異獸肉湯": { recovery: 80, stamina: 15, shareType: "shared" }
};

function getFoodStats(itemName) {
  if (FOOD_DICTIONARY[itemName]) return FOOD_DICTIONARY[itemName];
  var stats = { recovery: 15, stamina: 0, shareType: "individual" };
  if (/(箱|鍋|大|家庭|全家|桶|批|堆|袋)/.test(itemName)) stats.shareType = "shared";
  if (/(罐頭|肉|便當|口糧|燉|烤)/.test(itemName)) stats.recovery = 30;
  else if (/(水|飲料|果汁|鹽水|湯|茶|酒)/.test(itemName)) { stats.recovery = 5; stats.stamina = 10; }
  else if (/(糖|餅乾|巧克力|零食|薯條)/.test(itemName)) stats.recovery = 10;
  if (stats.shareType === "shared") { stats.recovery *= 3; stats.stamina *= 3; }
  return stats;
}

// 【替換】全面升級為 XY 坐標系的地圖池
var MAP_PRESETS = {
  "維爾赫姆市": {
    name: "維爾赫姆市 (Wilhelm City)", type: "都市廢墟", x: 0, y: 0,
    locations: [
      { name: "市政中心廣場", x: 0, y: 0 }, { name: "廢棄仁愛醫院", x: 0, y: 2 },
      { name: "封鎖的商業圈", x: 3, y: 0 }, { name: "軍方警戒隔離區", x: 0, y: -5 },
      { name: "倖存者貧民窟", x: -4, y: 0 }, { name: "崩塌的地鐵站", x: 1, y: 1 },
      { name: "雙子星摩天樓頂層", x: -1, y: 1 }, { name: "跨河斷橋", x: 6, y: 5 }
    ]
  },
  "灰堡": {
    name: "灰堡 (Ash Fort)", type: "軍事要塞", x: 0, y: 50,
    locations: [
      { name: "指揮塔樓", x: 0, y: 50 }, { name: "地下彈藥庫", x: 0, y: 49 },
      { name: "野戰醫療營帳", x: 1, y: 50 }, { name: "戰俘拘留所", x: 0, y: 48 },
      { name: "裝甲車庫", x: -1.5, y: 50 }, { name: "新兵訓練操場", x: 0, y: 51 }
    ]
  },
  "荒原鎮群": {
    name: "荒原鎮群 (Wasteland Settlements)", type: "荒漠聚落", x: -60, y: 0,
    locations: [
      { name: "鎮長酒館", x: -60, y: 0 }, { name: "舊時代加油站", x: -55, y: 0 },
      { name: "拾荒者黑市", x: -60, y: -3 }, { name: "變異屠宰農場", x: -68, y: 0 },
      { name: "廢棄礦坑", x: -62, y: -2 }, { name: "汽車解體廠", x: -72, y: 5 }
    ]
  },
  "靜默聖所": {
    name: "靜默聖所 (Silent Sanctuary)", type: "宗教領地", x: 0, y: -40,
    locations: [
      { name: "聖光大教堂", x: 0, y: -40 }, { name: "懺悔地牢", x: 0, y: -42 },
      { name: "淨化火刑廣場", x: 0, y: -39.5 }, { name: "狂信徒兵營", x: 1, y: -40 },
      { name: "殉道者墓地", x: -3, y: -40 }, { name: "祭司觀星高塔", x: -1, y: -39 }
    ]
  },
  "深谷中繼站": {
    name: "深谷中繼站 (Deep Valley Relay)", type: "科技樞紐", x: 70, y: 0,
    locations: [
      { name: "通訊雷達塔", x: 70, y: 0 }, { name: "地熱發電廠", x: 70, y: -3 },
      { name: "研究員宿舍", x: 71, y: 0 }, { name: "生態溫室區", x: 70, y: -1.5 },
      { name: "廢棄安檢站", x: 65, y: 0 }, { name: "谷底核心物資庫", x: 72, y: -4 }
    ]
  }
};
