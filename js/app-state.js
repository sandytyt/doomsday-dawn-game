'use strict';

// 遊戲狀態大腦 (The God Object)，全遊戲的存亡都在這裡
var gameState = {
  apiKey: '',
  provider: 'gemini',
  isTestMode: false,
  testScriptIndex: 0,
  time: { day: 1, hour: 6, minute: 0 },
  location: '未知地點',
  stamina: CONFIG.INITIAL_STAMINA,
  maxStamina: CONFIG.INITIAL_STAMINA,
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
  skillProficiency: {},
  recentTurns: [],
  worldMemory: typeof WorldMemory !== 'undefined' ? WorldMemory.createInitial() : {},
  turnCount: 0,
  lastOptions: [],
  lastPlayerAction: '',
  rulesText: '',
  loreText: '',
  charSetup: { name: '', gender: '', location: '', occupation: '', backgroundType: null, generalistPicks: [] },
  vehicles: [],
  activeVehicleId: null,
  stashes: [],
  recentDangerLevels: [],
  npcStates: {}, 
  exploredLocations: [], 
  currentMapPresetId: null 
};

// 全域鎖定狀態，控制 UI 和 API 不可重複點擊
var isWaitingForAI = false;

// 全網頁的 HTML 節點快取庫 (各種檔案都需要讀取它來改畫面)
var dom = {};