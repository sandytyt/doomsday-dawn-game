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
  DEV_MODE: true,   // 【新增】開發者作弊指令總開關，正式上線前請改為 false
  TEST_SCRIPT: (typeof TEST_SCRIPT !== 'undefined') ? TEST_SCRIPT : [],
  NOTION_ENABLED: true,
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
  '能量棒': { recovery: 15, stamina: 10, shareType: 'individual' },
  '軍用罐頭': { recovery: 35, stamina: 20, shareType: 'individual' },
  '蔬菜': { recovery: 15, stamina: 5, shareType: 'individual' },
  '水果': { recovery: 15, stamina: 5, shareType: 'individual' },
  '生肉': { recovery: 20, stamina: 5, shareType: 'individual' },
  '乾癟的野果': { recovery: 5, stamina: 0, shareType: 'individual' },
  '半瓶礦泉水': { recovery: 0, stamina: 15, shareType: 'individual' },
  '過濾水': { recovery: 0, stamina: 20, shareType: 'individual' },
  '乾淨的純水': { recovery: 0, stamina: 35, shareType: 'individual' }
};

function getFoodStats(itemName) {
  // 1. 優先查閱標準字典
  if (FOOD_DICTIONARY[itemName]) return FOOD_DICTIONARY[itemName];
  
  // 2. 若不在字典內，則套用動態推算邏輯
  var stats = { recovery: 25, stamina: 5, shareType: "individual" };
  if (/(箱|鍋|大|家庭|全家|桶|批|堆|袋)/.test(itemName)) stats.shareType = "shared";
  
  if (/(罐頭|肉|便當|口糧|燉|烤|乾糧|飽餐|麵)/.test(itemName)) {
    stats.recovery = 50;
    stats.stamina = 15; 
  } else if (/(水|飲料|果汁|鹽水|湯|茶|酒)/.test(itemName)) { 
    stats.recovery = 10; 
    stats.stamina = 25; 
  } else if (/(糖|餅乾|巧克力|零食|薯條|包)/.test(itemName)) {
    stats.recovery = 20;
    stats.stamina = 5;
  }
  
  if (stats.shareType === "shared") { 
    stats.recovery *= 3; 
    stats.stamina *= 3; 
  }
  return stats;
}

// ----------------------------------------
// 4. 晶核吸收效率系統
// ----------------------------------------
var CORE_EXP_CONFIG = {
  transparent: 10,     // 透明晶核
  different_attr: 15,  // 異屬性晶核
  same_attr: 20        // 同屬性晶核
};

function getCoreExpGained(coreName) {
  // 1. 透明晶核，直接回傳基礎值
  if (coreName.indexOf('透明') !== -1) {
    return CORE_EXP_CONFIG.transparent;
  }

  // 2. 判斷是否為同屬性（【修正 Bug #6】改讀 gameState.awakenedElement，
  //    這個欄位由 app-engine.js 在偵測到 awakening/multi_awakening 事件時寫入，
  //    原本讀取的 gameState.charSetup.element 從未被任何流程賦值，
  //    導致同屬性加成永遠無法觸發）
  var playerElement = gameState.awakenedElement || '';

  if (playerElement && coreName.indexOf(playerElement) !== -1) {
    return CORE_EXP_CONFIG.same_attr; // 吸收 20
  }

  // 3. 既不是透明，也不是同屬性，那就是異屬性晶核
  return CORE_EXP_CONFIG.different_attr; // 吸收 15
}

// ----------------------------------------
// 5. 世界地圖與座標系
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
  },
  "方舟海上堡壘": {
    name: "方舟海上堡壘 (Ark Ocean Fortress)", type: "科技人工島", x: 0, y: 80,
    locations: [
      { name: "商會停機坪", x: 0, y: 80 }, { name: "核心拍賣所", x: 0, y: 79 },
      { name: "水培農業區", x: -1, y: 80 }, { name: "傭兵兵營", x: 1, y: 80 },
      { name: "VIP貴賓招待所", x: 0, y: 81 }, { name: "海底機房", x: 0, y: 78 }
    ]
  }
};

// ----------------------------------------
// 5.1 AI 地點名稱解析
// ----------------------------------------
// AI 可能回傳「指揮塔樓外圍」、「灰堡外圍野戰醫療營帳」等名稱變體。
// 此函式把變體對應回 MAP_PRESETS 中最近的標準地點與所屬區域。
function resolveMapLocation(locationName) {
  var rawName = String(locationName || '').trim();

  if (!rawName || typeof MAP_PRESETS === 'undefined') {
    return null;
  }

  var bestMatch = null;
  var bestScore = -1;

  for (var regionKey in MAP_PRESETS) {
    if (!Object.prototype.hasOwnProperty.call(MAP_PRESETS, regionKey)) {
      continue;
    }

    var region = MAP_PRESETS[regionKey];

    // 區域短名：灰堡、維爾赫姆市……
    if (rawName === regionKey) {
      return {
        regionKey: regionKey,
        region: region,
        location: null,
        matchedName: regionKey,
        x: region.x,
        y: region.y,
        exact: true
      };
    }

    // 區域完整顯示名稱：灰堡 (Ash Fort)……
    if (rawName === region.name) {
      return {
        regionKey: regionKey,
        region: region,
        location: null,
        matchedName: region.name,
        x: region.x,
        y: region.y,
        exact: true
      };
    }

    var locations = Array.isArray(region.locations)
      ? region.locations
      : [];

    for (var i = 0; i < locations.length; i++) {
      var knownLocation = locations[i];
      var knownName = String(knownLocation.name || '');

      if (!knownName) {
        continue;
      }

      // 精確命中，立即回傳。
      if (rawName === knownName) {
        return {
          regionKey: regionKey,
          region: region,
          location: knownLocation,
          matchedName: knownName,
          x: knownLocation.x,
          y: knownLocation.y,
          exact: true
        };
      }

      // 變體命中：例如「灰堡外圍野戰醫療營帳」包含「野戰醫療營帳」。
      // 標準名稱越長，匹配越具體，所以使用名稱字數當分數。
      if (
        rawName.indexOf(knownName) !== -1 ||
        knownName.indexOf(rawName) !== -1
      ) {
        var score = knownName.length;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            regionKey: regionKey,
            region: region,
            location: knownLocation,
            matchedName: knownName,
            x: knownLocation.x,
            y: knownLocation.y,
            exact: false
          };
        }
      }
    }

    // 若 AI 名稱只有區域詞，例如「灰堡外圍」，沒有具體標準地點，
    // 對應到該區域錨點。
    if (rawName.indexOf(regionKey) !== -1) {
      var regionScore = regionKey.length;

      if (regionScore > bestScore) {
        bestScore = regionScore;
        bestMatch = {
          regionKey: regionKey,
          region: region,
          location: null,
          matchedName: regionKey,
          x: region.x,
          y: region.y,
          exact: false
        };
      }
    }
  }

  return bestMatch;
};

// ----------------------------------------
// 6. 五大陣營白名單與基地別名對照表
// ----------------------------------------
// 【搬遷說明】此常數原本以區域變數形式寫死在 app-engine.js 的
// applyStatusUpdate() 函式內部，外部檔案（如 app-events.js 的開發者
// 作弊指令）完全無法讀取，導致 #delfaction 指令繞過白名單直接操作
// gameState.factionTrust。現統一提升為全域共用常數。
var VALID_FACTIONS = ['鐵幕守望者', '方舟商會', '荒原拾骸者', '靜默之子', '深層獵手'];

var FACTION_ALIASES = {
    '灰堡': '鐵幕守望者',
    '方舟海上堡壘': '方舟商會',
    '荒原鎮群': '荒原拾骸者',
    '靜默聖所': '靜默之子',
    '深谷中繼站': '深層獵手'
};
