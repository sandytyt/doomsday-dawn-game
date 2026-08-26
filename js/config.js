/* ============================================
   末日黎明：喪屍浩劫 — 系統核心設定檔 (config.js)
   職責：儲存所有靜態常數、地圖字典與環境參數
   ============================================ */

// ----------------------------------------
// 1. 系統與 API 供應商設定
// ----------------------------------------
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

  // 體力與生存閾值
  INITIAL_STAMINA: 100,
  STAMINA_LOW_THRESHOLD: 45,
  STAMINA_CRITICAL_THRESHOLD: 20,

  MAX_RECENT_TURNS: 5,

  // 測試與雲端設定
  TEST_MODE_ENABLED: true,
  TEST_SCRIPT: (typeof TEST_SCRIPT !== 'undefined') ? TEST_SCRIPT : [],
  NOTION_ENABLED: false,
  NOTION_PROXY_URL: '',
  NOTION_DATABASE_ID: ''
};

// ----------------------------------------
// 2. 開局隨機角色池 (已移除姓名，配合第二人稱)
// ----------------------------------------
var RANDOM_CHAR_POOL = {
  genders: ['男', '女'],
  locations: ['市郊工業區', '舊城區公寓', '沿海漁村', '大學宿舍', '郊區農場', '市中心辦公大樓', '山區小鎮', '港口貨運站', '醫院'],
  occupations: ['護理系學生', '便利店店員', '貨車司機', '國中教師', '維修技師', '自由撰稿人', '退伍軍人', '餐廳廚師', '醫生', '上班族']
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ----------------------------------------
// 3. 智慧食物推算系統
// ----------------------------------------
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
  
  // 依據字詞自動推算食物屬性
  if (/(箱|鍋|大|家庭|全家|桶|批|堆|袋)/.test(itemName)) stats.shareType = "shared";
  
  if (/(罐頭|肉|便當|口糧|燉|烤|乾糧|飽餐)/.test(itemName)) {
    stats.recovery = 30;
  } else if (/(水|飲料|果汁|鹽水|湯|茶|酒)/.test(itemName)) { 
    stats.recovery = 5; 
    stats.stamina = 10; 
  } else if (/(糖|餅乾|巧克力|零食|薯條)/.test(itemName)) {
    stats.recovery = 10;
  }
  
  // 若為共享食物，數值自動放大
  if (stats.shareType === "shared") { 
    stats.recovery *= 3; 
    stats.stamina *= 3; 
  }
  return stats;
}

// ----------------------------------------
// 4. 世界地圖與座標系
// ----------------------------------------
var WORLD_MACRO_MAP = "世界版圖以「維爾赫姆市」為中心。向北50公里為軍事要塞「灰堡」；向東70公里為科技樞紐「深谷中繼站」；向南40公里為宗教領地「靜默聖所」；向西60公里為荒漠「荒原鎮群」。";

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
   "方舟海上堡壘": {
      name: "方舟海上堡壘 (Ark Ocean Fortress)", type: "海上鑽油平台/科技人工島", x: 0, y: 80,
      locations: [
         { name: "商會停機坪", x: 0, y: 80 }, { name: "核心拍賣所", x: 0, y: 79 },
         { name: "水培農業區", x: -1, y: 80 }, { name: "傭兵兵營", x: 1, y: 80 },
         { name: "VIP貴賓招待所", x: 0, y: 81 }, { name: "海底機房", x: 0, y: 78 }
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
