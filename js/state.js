/* ============================================
   末日黎明：喪屍浩劫 — 核心狀態管理 (state.js)
   職責：儲存遊戲全域狀態 (gameState)、數值計算、時間流逝與跨區移動邏輯
   ============================================ */

// --- 系統常數 ---
var STATE_KEY = 'doomsday_dawn_save_v1';
var NAMED_SAVES_KEY = 'doomsday_dawn_named_saves';
var APIKEY_KEY_PREFIX = 'doomsday_dawn_apikey_';
var PROVIDER_KEY = 'doomsday_dawn_provider';
var NOTION_KEY = 'doomsday_dawn_notion_config';
var NOTION_SYNC_INTERVAL = 10;
var NOTION_CHUNK_SIZE = 2000;

var ABILITY_LEVEL_THRESHOLDS = [0, 50, 120, 210, 320, 450, 600, 770, 960, 1170];

var VEHICLE_TIER_PRESETS = {
  light_two_wheel: { label: '輕型二輪', cargoCapacity: 5, maxDurability: 60, maxFuel: 40 },
  light_four_wheel: { label: '輕型四輪', cargoCapacity: 15, maxDurability: 80, maxFuel: 60 },
  medium: { label: '中型車輛', cargoCapacity: 30, maxDurability: 100, maxFuel: 75 },
  heavy: { label: '重型車輛', cargoCapacity: 55, maxDurability: 130, maxFuel: 100 },
  special_military: { label: '特種/軍規車輛', cargoCapacity: 45, maxDurability: 160, maxFuel: 90 }
};

// --- 遊戲全域狀態 (大腦) ---
var gameState = {
  apiKey: '',
  provider: 'gemini',
  isTestMode: false,
  testScriptIndex: 0,
  time: { day: 1, hour: 6, minute: 0 },
  location: '未知地點',
  stamina: 100,
  maxStamina: 100,
  hunger: 100,
  humanity: 100,
  factionTrust: {},
  awakeningLevel: 0,
  awakeningAbility: null,
  abilityExp: 0,
  resonanceValue: 0,
  dangerLevel: 'safe',
  lastActionRiskLevel: 'low',
  weather: '晴',
  inventory: [],
  injuryStatus: 'none',
  injuryDetail: '',
  isDead: false,
  companions: [],
  skillProficiency: { combat: 0, shooting: 0, agility: 0, scouting: 0, medical: 0, negotiation: 0, searching: 0, mechanics: 0 },
  recentTurns: [],
  worldMemory: null, // 將在開局時由 WorldMemory.createInitial() 建立
  turnCount: 0,
  lastOptions: [],
  lastPlayerAction: '',
  rulesText: '',
  loreText: '',
  skillTreesText: '',
  factionsText: '',
  charSetup: { name: '你', gender: '', location: '', occupation: '', backgroundType: null, generalistPicks: [] },
  vehicles: [],
  activeVehicleId: null,
  stashes: [],
  recentDangerLevels: [],
  npcStates: {},
  exploredLocations: [],
  currentMapPresetId: null
};

// --- 核心共用數學工具 ---
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

// --- 狀態推算與監聽邏輯 ---
function getInventoryLoadLevel(invArray) {
  var count = (invArray || []).length;
  if (count <= 5) return '輕裝';
  if (count <= 10) return '標準';
  return '超載';
}

function getAbilityExpNeeded(level) {
  if (level >= 10) return ABILITY_LEVEL_THRESHOLDS[9];
  return ABILITY_LEVEL_THRESHOLDS[level];
}

function trackDangerLevel(level) {
  gameState.recentDangerLevels.push(level);
  if (gameState.recentDangerLevels.length > 5) {
    gameState.recentDangerLevels.shift();
  }
}

function getDangerPacingHint() {
  var recent = gameState.recentDangerLevels.slice(-3);
  var criticalCount = recent.filter(function (l) { return l === 'critical'; }).length;
  if (criticalCount >= 2) {
    return '注意：最近連續處於高危狀態，本回合請提供至少一個明確的低風險或無風險選項，安排劇情緩衝。';
  }
  return '';
}

function checkEntityDeathCondition(stamina, injuryStatus) {
  return stamina <= 0 && injuryStatus === 'severe';
}

// --- 時間與核心數值流逝 ---
function advanceTime(minutes) {
  var total = gameState.time.hour * 60 + gameState.time.minute + minutes;
  var daysToAdd = Math.floor(total / 1440);
  total = total % 1440;
  gameState.time.day += daysToAdd;
  gameState.time.hour = Math.floor(total / 60);
  gameState.time.minute = total % 60;

  var hungerDecay = minutes * 0.05;
  
  // 主角飢餓衰減
  gameState.hunger = clamp(gameState.hunger - hungerDecay, 0, 100);

  // NPC飢餓衰減 (僅限當前隨行)
  if (gameState.npcStates && gameState.companions && gameState.companions.length > 0) {
    gameState.companions.forEach(function(npcName) {
      var npc = gameState.npcStates[npcName];
      if (npc && typeof npc.hunger === 'number') {
        npc.hunger = clamp(npc.hunger - hungerDecay, 0, 100);
      }
    });
  }
}

// --- 地理位置與跨區移動運算 ---
function getLocationCoords(locName) {
  for (var poolId in MAP_PRESETS) {
    var pool = MAP_PRESETS[poolId];
    if (pool.name === locName) return { x: pool.x, y: pool.y };
    for (var i = 0; i < pool.locations.length; i++) {
      if (pool.locations[i].name === locName) return { x: pool.locations[i].x, y: pool.locations[i].y };
    }
  }
  if (gameState.currentMapPresetId && MAP_PRESETS[gameState.currentMapPresetId]) {
    return { x: MAP_PRESETS[gameState.currentMapPresetId].x, y: MAP_PRESETS[gameState.currentMapPresetId].y };
  }
  return { x: 0, y: 0 };
}

function requestTravelTo(targetLocation) {
  if (typeof isWaitingForAI !== 'undefined' && isWaitingForAI) return; 
  if (gameState.isDead) return;
  if (gameState.location === targetLocation) {
    alert("📍 你已經在【" + targetLocation + "】了。"); return;
  }
  
  var currentCoords = getLocationCoords(gameState.location);
  var targetCoords = getLocationCoords(targetLocation);
  var dx = currentCoords.x - targetCoords.x;
  var dy = currentCoords.y - targetCoords.y;
  var dist = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy))); // 至少 1km
  
  var activeVehicle = gameState.vehicles.find(function(v) { return v.status === 'active'; });
  var promptText = "";
  
  if (activeVehicle) {
    var fuelNeeded = (dist / 10) * 5;
    if (activeVehicle.fuel < fuelNeeded && activeVehicle.fuel <= 0) {
      alert("📍 距離：" + dist + "公里。載具油量耗盡，無法開車前往。"); return;
    }
    activeVehicle.fuel = Math.max(0, activeVehicle.fuel - fuelNeeded);
    activeVehicle.durability = Math.max(0, activeVehicle.durability - ((dist / 10) * 2));
    advanceTime(dist * 1.5);
    promptText = "你驅車抵達了【" + targetLocation + "】（總車程 " + dist + " 公里）。";
  } else {
    var staminaNeeded = dist * 3;
    if (staminaNeeded > gameState.stamina) {
      alert("📍 距離過遠（" + dist + "公里），需要 " + staminaNeeded + " 體力。徒步前往等同自殺。請先準備載具、紮營或規劃中繼點。"); return;
    }
    gameState.stamina = Math.max(0, gameState.stamina - staminaNeeded);
    if (gameState.companions && gameState.npcStates) {
      gameState.companions.forEach(function(npc) {
        if(gameState.npcStates[npc]) gameState.npcStates[npc].stamina = Math.max(0, gameState.npcStates[npc].stamina - staminaNeeded);
      });
    }
    advanceTime(dist * 12);
    promptText = "你徒步跋涉抵達了【" + targetLocation + "】（徒步 " + dist + " 公里）。";
  }
  
  gameState.location = targetLocation;
  if (gameState.exploredLocations.indexOf(targetLocation) === -1) gameState.exploredLocations.push(targetLocation);
  
  // 呼叫 UI 與主流程 (這些函式未來會放在 main.js / ui.js 裡)
  if (typeof toggleInfoPanel === 'function') toggleInfoPanel(false);
  if (typeof dom !== 'undefined' && dom.manualModal) dom.manualModal.classList.add('hidden');
  if (typeof renderAll === 'function') renderAll();
  if (typeof requestNextTurn === 'function') requestNextTurn(promptText);
}