'use strict';

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
  worldMemory: WorldMemory.createInitial(),
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
  npcStates: {}, // 預留給 NPC 獨立生存數值
  exploredLocations: [], // 記錄已探索地點
  currentMapPresetId: null, // 記錄當前地圖池ID
  skillProficiency: {} // 八分類熟練度（取代舊的空殼）
};

var isWaitingForAI = false;
var statusExpanded = false;
var optionsMiniMode = false;
var inventoryExpanded = false;
var npcExpanded = false;
var vehicleExpanded = false;
var stashExpanded = false;
var currentSaveTab = 'local';
var notionSavesCache = [];
var pendingMilestoneModals = [];
var dom = {};

function cacheDom() {
  dom.setupScreen = document.getElementById('setup-screen');
  dom.gameScreen = document.getElementById('game-screen');
  dom.providerSelect = document.getElementById('provider-select');
  dom.apiKeyInput = document.getElementById('api-key-input');
  dom.startBtn = document.getElementById('start-game-btn');
  dom.testModeBtn = document.getElementById('test-mode-btn');
  dom.importSaveBtn = document.getElementById('import-save-btn');
  dom.importSaveFile = document.getElementById('import-save-file');
  dom.rulesLinkBtn = document.getElementById('rules-link-btn');
  dom.charSetupToggle = document.getElementById('char-setup-toggle');
  dom.charSetupFields = document.getElementById('char-setup-fields');
  dom.charGenderInput = document.getElementById('char-gender-input');
  dom.charLocationInput = document.getElementById('char-location-input');
  dom.charOccupationInput = document.getElementById('char-occupation-input');
  dom.statusTime = document.getElementById('status-time');
  dom.statusLocation = document.getElementById('status-location');
  dom.statusExpandBtn = document.getElementById('status-expand-btn');
  dom.staminaFill = document.getElementById('stamina-bar-fill');
  dom.staminaValue = document.getElementById('stamina-value');
  dom.statusDanger = document.getElementById('status-danger');
  dom.injuryTag = document.getElementById('injury-tag');
  dom.menuToggleBtn = document.getElementById('menu-toggle-btn');
  dom.statusPanelFull = document.getElementById('status-panel-full');
  dom.statHumanity = document.getElementById('stat-humanity');
  dom.statFaction = document.getElementById('stat-faction');
  dom.statAwakening = document.getElementById('stat-awakening');
  dom.statWeather = document.getElementById('stat-weather');
  dom.statHunger = document.getElementById('stat-hunger');
  dom.statCompanions = document.getElementById('stat-companions');
  dom.narrativeLog = document.getElementById('narrative-log');
  dom.narrativeContent = document.getElementById('narrative-content');
  dom.typingIndicator = document.getElementById('typing-indicator');
  dom.optionsCollapseToggle = document.getElementById('options-collapse-toggle');
  dom.optionsContainer = document.getElementById('options-container');
  dom.freeInputRow = document.getElementById('free-input-row');
  dom.freeInputText = document.getElementById('free-input-text');
  dom.freeInputSend = document.getElementById('free-input-send');
  dom.freeInputCancel = document.getElementById('free-input-cancel');
  dom.freeInputToggle = document.getElementById('free-input-toggle');
  dom.actionCollapsedBar = document.getElementById('action-collapsed-bar');
  dom.inventoryList = document.getElementById('inventory-list');
  dom.inventoryLoadTag = document.getElementById('inventory-load-tag');
  dom.npcList = document.getElementById('npc-list');
  dom.vehicleList = document.getElementById('vehicle-list');
  dom.panelsToggleBtn = document.getElementById('panels-toggle-btn');
  dom.infoPanel = document.getElementById('info-panel');
  dom.infoPanelBackdrop = document.getElementById('info-panel-backdrop');
  dom.infoPanelClose = document.getElementById('info-panel-close');
  dom.itemsSectionToggle = document.getElementById('items-section-toggle');
  dom.itemsSectionBody = document.getElementById('items-section-body');
  dom.itemsAccordion = document.getElementById('items-accordion');
  dom.npcSectionToggle = document.getElementById('npc-section-toggle');
  dom.npcSectionBody = document.getElementById('npc-section-body');
  dom.vehicleSectionToggle = document.getElementById('vehicle-section-toggle');
  dom.vehicleSectionBody = document.getElementById('vehicle-section-body');
  dom.sideMenu = document.getElementById('side-menu');
  dom.sideMenuBackdrop = document.getElementById('side-menu-backdrop');
  dom.menuExportBtn = document.getElementById('menu-export-btn');
  dom.menuImportBtn = document.getElementById('menu-import-btn');
  dom.menuNamedSaveBtn = document.getElementById('menu-named-save-btn');
  dom.menuSaveManagerBtn = document.getElementById('menu-save-manager-btn');
  dom.menuRestartBtn = document.getElementById('menu-restart-btn');
  dom.menuApikeyBtn = document.getElementById('menu-apikey-btn');
  dom.menuRulesBtn = document.getElementById('menu-rules-btn');
  dom.menuCloseBtn = document.getElementById('menu-close-btn');
  dom.notionSetupToggle = document.getElementById('notion-setup-toggle');
  dom.notionSetupFields = document.getElementById('notion-setup-fields');
  dom.notionProxyInput = document.getElementById('notion-proxy-input');
  dom.notionDbInput = document.getElementById('notion-db-input');
  dom.notionSaveBtn = document.getElementById('notion-save-btn');
  dom.notionSyncNowBtn = document.getElementById('notion-sync-now-btn');
  dom.eventModal = document.getElementById('event-modal');
  dom.eventModalIcon = document.getElementById('event-modal-icon');
  dom.eventModalTitle = document.getElementById('event-modal-title');
  dom.eventModalText = document.getElementById('event-modal-text');
  dom.eventModalClose = document.getElementById('event-modal-close');
  dom.loadingOverlay = document.getElementById('loading-overlay');
  dom.deathScreen = document.getElementById('death-screen');
  dom.namedSaveModal = document.getElementById('named-save-modal');
  dom.namedSaveList = document.getElementById('named-save-list');
  dom.namedSaveClose = document.getElementById('named-save-close');
  dom.saveTabLocal = document.getElementById('save-tab-local');
  dom.saveTabNotion = document.getElementById('save-tab-notion');
  dom.hungerFill = document.getElementById('hunger-bar-fill');
  dom.hungerValue = document.getElementById('hunger-value');
  dom.charProfileToggle = document.getElementById('char-profile-toggle');
  dom.charProfileBody = document.getElementById('char-profile-body');
  dom.profileName = document.getElementById('profile-name');
  dom.profileGender = document.getElementById('profile-gender');
  dom.profileLocation = document.getElementById('profile-location');
  dom.profileOccupation = document.getElementById('profile-occupation');
  dom.profileSafezoneList = document.getElementById('profile-safezone-list');
  dom.profileFactionList = document.getElementById('profile-faction-list');
  dom.profileInjurySection = document.getElementById('profile-injury-section');
  dom.profileInjuryLevel = document.getElementById('profile-injury-level');
  dom.profileInjuryDetail = document.getElementById('profile-injury-detail');
  dom.profileAwakeningSection = document.getElementById('profile-awakening-section');
  dom.profileAwakeningLevel = document.getElementById('profile-awakening-level');
  dom.profileAwakeningAbility = document.getElementById('profile-awakening-ability');
  dom.profileAwakeningExp = document.getElementById('profile-awakening-exp');
  dom.bgSelect = document.getElementById('char-background-type-select');
  dom.generalistDiv = document.getElementById('generalist-picks-container');
    // 【遊戲手冊快取】
  dom.manualModal = document.getElementById('manual-modal');
  dom.manualCloseBtn = document.getElementById('manual-close-btn');
}

function init() {
  cacheDom();
  populateProviderSelect();
  bindEvents();
  setupManualTabs(); // 【獨立呼叫：綁定遊戲手冊分頁】
  loadRulesAndLore();
  loadNotionConfig();
  setupTestModeEntry();
  tryRestoreSavedGame();
}

function populateProviderSelect() {
  if (!dom.providerSelect) return;
  dom.providerSelect.innerHTML = '';
  for (var key in CONFIG.PROVIDERS) {
    if (Object.prototype.hasOwnProperty.call(CONFIG.PROVIDERS, key)) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = CONFIG.PROVIDERS[key].label;
      dom.providerSelect.appendChild(opt);
    }
  }
  var savedProvider = localStorage.getItem(PROVIDER_KEY) || CONFIG.ACTIVE_PROVIDER;
  dom.providerSelect.value = savedProvider;
  var savedKey = localStorage.getItem(APIKEY_KEY_PREFIX + savedProvider);
  if (savedKey) dom.apiKeyInput.value = savedKey;
}

function tryRestoreSavedGame() {
  var provider = localStorage.getItem(PROVIDER_KEY) || CONFIG.ACTIVE_PROVIDER;
  var savedKey = localStorage.getItem(APIKEY_KEY_PREFIX + provider);
  var savedStateRaw = localStorage.getItem(STATE_KEY);
  if (!savedStateRaw) return;

  try {
    var savedState = JSON.parse(savedStateRaw);
    if (savedState.isTestMode || savedKey) {
      gameState.apiKey = savedKey || '';
      gameState.provider = provider;
      restoreState(savedState);
      showGameScreen();
      rebuildNarrativeFromHistory();
      renderOptions(gameState.lastOptions);
      renderAll();
    }
  } catch (e) {
    console.error('存檔讀取失敗', e);
  }
}

function setupTestModeEntry() {
  if (!dom.testModeBtn) return;
  if (CONFIG.TEST_MODE_ENABLED) {
    dom.testModeBtn.classList.remove('hidden');
  } else {
    dom.testModeBtn.classList.add('hidden');
  }
}

function simpleMarkdownToHtml(text) {
  var lines = text.split('\n');
  var html = '';
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf('## ') === 0) {
      html += '<h3>' + escapeHtml(line.slice(3)) + '</h3>';
    } else if (line.indexOf('# ') === 0) {
      html += '<h2>' + escapeHtml(line.slice(2)) + '</h2>';
    } else if (line.indexOf('- ') === 0) {
      html += '<p class="rules-li">• ' + escapeHtml(line.slice(2)) + '</p>';
    } else if (line.trim() === '') {
      html += '';
    } else {
      html += '<p>' + escapeHtml(line) + '</p>';
    }
  }
  return html;
}

function loadRulesAndLore() {
  // 1. 讀取系統規則
  fetch('knowledge/ai_system_rules.txt').then(function (res) {
    return res.text();
  }).then(function (text) {
    gameState.rulesText = text;
    if (dom.rulesModalContent) dom.rulesModalContent.innerHTML = simpleMarkdownToHtml(text);
  }).catch(function () {
    gameState.rulesText = '';
  });

  // 2. 讀取病毒與主線真相
  fetch('knowledge/virus_lore.txt').then(function (res) {
    return res.text();
  }).then(function (text) {
    gameState.loreText = text;
  }).catch(function () {
    gameState.loreText = '';
  });

  // 3. 【新增】讀取體格與異能技能樹
  fetch('knowledge/skill_trees.txt').then(function (res) {
    return res.text();
  }).then(function (text) {
    gameState.skillTreesText = text;
  }).catch(function () {
    gameState.skillTreesText = '';
  });

  // 4. 【新增】讀取五大勢力與地緣政治
  fetch('knowledge/factions.txt').then(function (res) {
    return res.text();
  }).then(function (text) {
    gameState.factionsText = text;
  }).catch(function () {
    gameState.factionsText = '';
  });
}

function loadNotionConfig() {
  var saved = localStorage.getItem(NOTION_KEY);
  if (!saved) return;
  try {
    var cfg = JSON.parse(saved);
    if (dom.notionProxyInput) dom.notionProxyInput.value = cfg.proxyUrl || '';
    if (dom.notionDbInput) dom.notionDbInput.value = cfg.dbId || '';
    CONFIG.NOTION_ENABLED = !!(cfg.proxyUrl && cfg.dbId);
    CONFIG.NOTION_PROXY_URL = cfg.proxyUrl || '';
    CONFIG.NOTION_DATABASE_ID = cfg.dbId || '';
  } catch (e) {}
}

function bindEvents() {
  dom.providerSelect.addEventListener('change', handleProviderChange);
  dom.startBtn.addEventListener('click', handleStartGame);
  if (dom.testModeBtn) dom.testModeBtn.addEventListener('click', handleStartTestMode);
  dom.importSaveBtn.addEventListener('click', function () { dom.importSaveFile.click(); });
  dom.importSaveFile.addEventListener('change', handleImportFile);
  dom.charSetupToggle.addEventListener('click', function () { toggleCollapse(dom.charSetupToggle, dom.charSetupFields); });
  dom.statusExpandBtn.addEventListener('click', handleStatusExpandClick);
  dom.menuToggleBtn.addEventListener('click', handleMenuToggleClick);
  dom.sideMenuBackdrop.addEventListener('click', function () { toggleSideMenu(false); });
  dom.menuCloseBtn.addEventListener('click', function () { toggleSideMenu(false); });
  dom.menuExportBtn.addEventListener('click', handleExportSave);
  dom.menuImportBtn.addEventListener('click', handleMenuImportClick);
  dom.menuNamedSaveBtn.addEventListener('click', handleOpenNamedSave);
  dom.menuSaveManagerBtn.addEventListener('click', handleOpenSaveManager);
  dom.namedSaveClose.addEventListener('click', function () { dom.namedSaveModal.classList.add('hidden'); });
  dom.saveTabLocal.addEventListener('click', function () { switchSaveTab('local'); });
  dom.saveTabNotion.addEventListener('click', function () { switchSaveTab('notion'); });
  dom.menuRestartBtn.addEventListener('click', handleRestart);
  dom.menuApikeyBtn.addEventListener('click', handleChangeApiKey);
  
  // 【綁定開啟手冊】
  if (dom.rulesLinkBtn) dom.rulesLinkBtn.addEventListener('click', function () { toggleManualModal(true); });
  if (dom.menuRulesBtn) dom.menuRulesBtn.addEventListener('click', function () { toggleSideMenu(false); setTimeout(function () { toggleManualModal(true); }, 200); });
  if (dom.manualCloseBtn) dom.manualCloseBtn.addEventListener('click', function () { toggleManualModal(false); });
  
  dom.notionSetupToggle.addEventListener('click', function () { toggleCollapse(dom.notionSetupToggle, dom.notionSetupFields); });
  dom.notionSaveBtn.addEventListener('click', handleSaveNotionConfig);
  dom.notionSyncNowBtn.addEventListener('click', handleNotionSyncNow);
  dom.optionsCollapseToggle.addEventListener('click', handleOptionsCollapseClick);
  dom.actionCollapsedBar.addEventListener('click', handleOptionsCollapseClick);
  dom.freeInputToggle.addEventListener('click', handleFreeInputToggleClick);
  dom.freeInputCancel.addEventListener('click', handleFreeInputCancelClick);
  dom.freeInputSend.addEventListener('click', handleFreeInputSend);
  dom.freeInputText.addEventListener('keypress', handleFreeInputKeypress);
  dom.eventModalClose.addEventListener('click', handleEventModalClose);
  if (dom.panelsToggleBtn) dom.panelsToggleBtn.addEventListener('click', function () { toggleInfoPanel(true); });
  if (dom.infoPanelBackdrop) dom.infoPanelBackdrop.addEventListener('click', function () { toggleInfoPanel(false); });
  if (dom.infoPanelClose) dom.infoPanelClose.addEventListener('click', function () { toggleInfoPanel(false); });
  if (dom.itemsSectionToggle) dom.itemsSectionToggle.addEventListener('click', function () { toggleCollapse(dom.itemsSectionToggle, dom.itemsSectionBody); });
  if (dom.npcSectionToggle) dom.npcSectionToggle.addEventListener('click', function () { toggleCollapse(dom.npcSectionToggle, dom.npcSectionBody); renderNpcPanel(); });
  if (dom.charProfileToggle) dom.charProfileToggle.addEventListener('click', function () { toggleCollapse(dom.charProfileToggle, dom.charProfileBody); renderCharProfile(); });
  if (dom.vehicleSectionToggle) dom.vehicleSectionToggle.addEventListener('click', function () { toggleCollapse(dom.vehicleSectionToggle, dom.vehicleSectionBody); });

  // 【階段5新增】
  if (dom.bgSelect) dom.bgSelect.addEventListener('change', handleBackgroundTypeChange);
  if (dom.generalistDiv) {
    var pointInputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
    for (var j = 0; j < pointInputs.length; j++) {
      pointInputs[j].addEventListener('input', handleGeneralistPointChange);
    }
  }
}

function handleProviderChange() {
  var provider = dom.providerSelect.value;
  localStorage.setItem(PROVIDER_KEY, provider);
  var savedKey = localStorage.getItem(APIKEY_KEY_PREFIX + provider);
  dom.apiKeyInput.value = savedKey || '';
}

// 【新增】獨立的遊戲手冊分頁綁定函式
function setupManualTabs() {
  var tabBtns = document.querySelectorAll('.manual-tab-btn');
  if (tabBtns.length === 0) return;
  
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      // 移除所有按鈕的 active 狀態
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      // 隱藏所有分頁內容
      document.querySelectorAll('.manual-pane').forEach(function(pane) { pane.classList.add('hidden'); });
      
      // 顯示被點擊的內容
      this.classList.add('active');
      var targetId = this.getAttribute('data-target');
      var targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.remove('hidden');
    });
  });
}

// 【新增】防呆設計的切換手冊邏輯
function toggleManualModal(show) {
  // 動態抓取確保不報錯
  if (!dom.manualModal) {
    dom.manualModal = document.getElementById('manual-modal');
    dom.manualCloseBtn = document.getElementById('manual-close-btn');
    if (dom.manualCloseBtn) dom.manualCloseBtn.addEventListener('click', function () { toggleManualModal(false); });
  }

  // 真的抓不到就報錯警告
  if (!dom.manualModal) {
    console.error("找不到手冊 UI！請確認 index.html 中是否有 id='manual-modal'");
    return;
  }
  
  dom.manualModal.classList.toggle('hidden', !show);
}

// 【新增】獨立封裝的遊戲手冊分頁切換邏輯
function setupManualTabs() {
  var tabBtns = document.querySelectorAll('.manual-tab-btn');
  if (tabBtns.length === 0) return;
  
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.manual-pane').forEach(function(pane) { pane.classList.add('hidden'); });
      
      this.classList.add('active');
      var targetId = this.getAttribute('data-target');
      var targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.remove('hidden');
    });
  });
}

function handleStatusExpandClick() {
  statusExpanded = !statusExpanded;
  dom.statusPanelFull.classList.toggle('hidden', !statusExpanded);
  dom.statusExpandBtn.classList.toggle('expanded', statusExpanded);
}

function handleMenuToggleClick(e) {
  e.stopPropagation();
  toggleSideMenu(true);
}

function handleMenuImportClick() {
  toggleSideMenu(false);
  setTimeout(function () { dom.importSaveFile.click(); }, 200);
}

function handleOptionsCollapseClick() {
  optionsMiniMode = !optionsMiniMode;
  applyOptionsDisplayMode();
}

function handleFreeInputToggleClick() {
  dom.freeInputRow.classList.remove('hidden');
  dom.freeInputToggle.classList.add('hidden');
  dom.freeInputText.focus();
}

function handleFreeInputCancelClick() {
  dom.freeInputRow.classList.add('hidden');
  dom.freeInputToggle.classList.remove('hidden');
  dom.freeInputText.value = '';
}

function handleFreeInputKeypress(e) {
  if (e.key === 'Enter') handleFreeInputSend();
}

function toggleCollapse(btn, body) {
  var isHidden = body.classList.contains('hidden');
  if (isHidden) {
    body.classList.remove('hidden');
    btn.classList.add('expanded');
  } else {
    body.classList.add('hidden');
    btn.classList.remove('expanded');
  }
}

function toggleInfoPanel(show) {
  if (!dom.infoPanel) return;
  dom.infoPanel.classList.toggle('hidden', !show);
  if (show) {
    renderCharProfile();
    renderItemsAccordion();
    renderNpcPanel();
    renderVehiclePanel();
  }
}

// 【階段5新增】處理背景類型切換
function handleBackgroundTypeChange() {
  if (dom.bgSelect.value === 'generalist') {
    dom.generalistDiv.classList.remove('hidden');
  } else {
    dom.generalistDiv.classList.add('hidden');
  }
}

// 【階段5修改】處理一般背景的自由配點限制
function handleGeneralistPointChange(e) {
  var inputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
  var total = 0;
  for (var i = 0; i < inputs.length; i++) {
    total += parseInt(inputs[i].value, 10) || 0;
  }
  
  if (total > 3) {
    e.target.value = parseInt(e.target.value, 10) - (total - 3);
    total = 3;
    alert('點數上限為 3 點'); // 提示用語精簡
  }
  
  var leftSpan = document.getElementById('generalist-points-left');
  if (leftSpan) leftSpan.textContent = (3 - total);
}

// 【階段5新增】共用的角色初始設定邏輯
function applyCharacterSetup() {
  var finalGender = dom.charGenderInput.value || pickRandom(RANDOM_CHAR_POOL.genders);
  var finalName = "你"; // 強制使用第二人稱

  var bgType = dom.bgSelect ? dom.bgSelect.value : 'combat_survivor';
  var picks = {};
  
  if (bgType === 'generalist') {
    var inputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
    for (var i = 0; i < inputs.length; i++) {
      var val = parseInt(inputs[i].value, 10) || 0;
      if (val > 0) {
        picks[inputs[i].dataset.stat] = val;
      }
    }
    // 已移除強制分配 3 點的限制，玩家可以不點或只點 1 點
  }

  gameState.charSetup = {
    name: finalName,
    gender: finalGender,
    location: dom.charLocationInput.value.trim() || pickRandom(RANDOM_CHAR_POOL.locations),
    occupation: dom.charOccupationInput.value.trim() || pickRandom(RANDOM_CHAR_POOL.occupations),
    backgroundType: bgType,
    generalistPicks: picks
  };

  gameState.skillProficiency = { combat: 0, shooting: 0, agility: 0, scouting: 0, medical: 0, negotiation: 0, searching: 0, mechanics: 0 };
  
  if (typeof getBackgroundBonuses === 'function') {
    var bonuses = getBackgroundBonuses(bgType, picks);
    for (var k in bonuses) {
      if (bonuses[k] === 1) gameState.skillProficiency[k] = 50;
      else if (bonuses[k] === 2) gameState.skillProficiency[k] = 150;
      else if (bonuses[k] === 3) gameState.skillProficiency[k] = 300;
    }
  }
  return true; 
}

function handleStartGame() {
  var provider = dom.providerSelect.value;
  var key = dom.apiKeyInput.value.trim();
  
  if (!key) {
    alert('請輸入你的 API 金鑰');
    return;
  }
  
  // 統一交給共用函式處理角色數值 (包含讀取配點、設定 charSetup 與 skillProficiency)
  if (!applyCharacterSetup()) return;
  
  gameState.apiKey = key;
  gameState.provider = provider;
  gameState.isTestMode = false;
  localStorage.setItem(PROVIDER_KEY, provider);
  localStorage.setItem(APIKEY_KEY_PREFIX + provider, key);

  // 初始化地圖與探索紀錄
  var mapIds = Object.keys(MAP_PRESETS);
  gameState.currentMapPresetId = pickRandom(mapIds);
  gameState.exploredLocations = []; 

  showGameScreen();
  requestNextTurn('__START__');
}

function handleStartTestMode() {
  // 測試模式同樣呼叫共用開局邏輯
  if (!applyCharacterSetup()) return;

  gameState.isTestMode = true;
  gameState.testScriptIndex = 0;
  gameState.apiKey = '';
  
  // 初始化地圖與探索紀錄
  var mapIds = Object.keys(MAP_PRESETS);
  gameState.currentMapPresetId = pickRandom(mapIds);
  gameState.exploredLocations = []; 
  
  showGameScreen();
  playNextTestScript('__START__');
}

function playNextTestScript(playerAction) {
  if (playerAction !== '__START__') {
    appendPlayerAction(playerAction);
    gameState.lastPlayerAction = playerAction;
  }
  showTyping(true);
  setTimeout(function () {
    var script = CONFIG.TEST_SCRIPT;
    if (!script || script.length === 0) {
      appendGMText('測試劇本尚未載入（test_script.js 可能未成功部署），暫時無法繼續測試模式。');
      renderOptions([{ id: 'RETRY', label: '重新嘗試', risk_hint: '' }]);
      showTyping(false);
      return;
    }
    var step = script[gameState.testScriptIndex % script.length];
    gameState.testScriptIndex += 1;
    handleAIResponse(step);
    showTyping(false);
  }, 600);
}

function showGameScreen() {
  dom.setupScreen.classList.add('hidden');
  dom.gameScreen.classList.remove('hidden');
}

function requestNextTurn(playerAction) {
  if (gameState.isDead) return;
  if (gameState.isTestMode) {
    playNextTestScript(playerAction);
    return;
  }
  if (isWaitingForAI) return;
  isWaitingForAI = true;
  showTyping(true);
  if (playerAction !== '__START__') {
    appendPlayerAction(playerAction, gameState.lastActionRiskLevel);
    gameState.lastPlayerAction = playerAction;
  }
  var contextPayload = buildContextPayload(playerAction);
  callAIProvider(contextPayload).then(function (response) {
    handleAIResponse(response);
    isWaitingForAI = false;
    showTyping(false);
  }).catch(function (err) {
    appendGMText('連線異常： ' + err.message + ' 請檢查API金鑰是否正確，或稍後再試一次。');
    renderOptions([{ id: 'RETRY', label: '重新嘗試', risk_hint: '' }]);
    isWaitingForAI = false;
    showTyping(false);
  });
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

// 【階段1修改】通用版負重判定
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

function buildContextPayload(playerAction) {
    var userText = '';
  if (playerAction === '__START__') {
    var c = gameState.charSetup;
    userText = '請開始遊戲，生成開局場景。玩家設定為：性別' + c.gender + '，初始地點' + c.location + '，末世前職業' + c.occupation + '。請自然融入敘事。絕對不可為玩家命名，必須全程使用第二人稱「你」來稱呼玩家。';
  } else {
    userText = '你的行動：' + playerAction;
  }

  var triggerBackgroundEvolution = WorldMemory.shouldTriggerBackgroundEvolution(gameState.worldMemory, gameState.turnCount);
  if (triggerBackgroundEvolution) {
    userText += ' 請檢查背景演化。';
  }

  var inventoryList = gameState.inventory.map(function (it) {
    return it.name + 'x' + it.quantity;
  }).join('、');

  var companionList = gameState.companions.join('、');

  var statusSnapshot = '當前狀態：第' + gameState.time.day + '天 ' + pad2(gameState.time.hour) + ':' + pad2(gameState.time.minute) +
    '，地點：' + gameState.location + '，體力：' + Math.round(gameState.stamina) + '/' + gameState.maxStamina +
    '，飽食度：' + Math.round(gameState.hunger) + '，人性值：' + Math.round(gameState.humanity) +
    '，共鳴值：' + Math.round(gameState.resonanceValue) + '，覺醒等級：' + gameState.awakeningLevel +
    '，能力熟練度：' + gameState.abilityExp + '/' + getAbilityExpNeeded(gameState.awakeningLevel) +
    '，危險等級：' + gameState.dangerLevel + '，傷勢：' + gameState.injuryStatus +
    '，背包負重：' + getInventoryLoadLevel(gameState.inventory) + '，持有物品：' + (inventoryList || '無') +
    '，隨行隊員：' + (companionList || '無') +
    '，回合數：' + gameState.turnCount;

  var recentParts = [];
  for (var i = 0; i < gameState.recentTurns.length; i++) {
    var t = gameState.recentTurns[i];
    recentParts.push('第' + t.turn + '回合劇情：' + t.narrative + ' 玩家行動：' + t.action);
  }
  var recentContext = recentParts.join(' ');
  var worldMemoryContext = WorldMemory.buildWorldMemoryPrompt(gameState.worldMemory, gameState.time.day);
  var pacingHint = getDangerPacingHint();
  if (pacingHint) {
    userText += ' ' + pacingHint;
  }
  
  // 【階段6新增】偵測死亡條件，動態插入強制提示
  var deathHint = '';
  if (typeof checkEntityDeathCondition === 'function') {
    // 檢查主角
    if (checkEntityDeathCondition(gameState.stamina, gameState.injuryStatus)) {
      deathHint += '【系統強制指令】主角的體力已歸零且處於重度受傷狀態，本回合必須觸發死亡判定，請依規則安排主角死亡或被救援的劇情，並於 special_event 回報 death 或 rescued。';
    }
    // 檢查 NPC
    if (gameState.companions && gameState.npcStates) {
      gameState.companions.forEach(function(npcName) {
        var npc = gameState.npcStates[npcName];
        if (npc && checkEntityDeathCondition(npc.stamina, npc.injuryStatus)) {
          deathHint += '【系統強制指令】隨行隊員「' + npcName + '」的體力已歸零且處於重度受傷狀態，本回合必須安排該NPC死亡或絕命掩護的劇情，並於 companion_changes 回報 die。';
        }
      });
    }
  }

  // 將死亡提示附加到玩家輸入的最後面，確保 AI 強烈關注
  if (deathHint !== '') {
    userText += '\n\n' + deathHint;
  }
  
  var dayHint = gameState.time.day <= 15 
    ? "【時間線限制】目前為末日初期，所有變異體皆為普通物理變異，腦內僅有透明晶核，不可出現屬性喪屍。" 
    : "【時間線演進】變異體已開始與靜默頻率深度共鳴，屍群中出現具備【金/木/水/火/土/電/狂化】屬性變異體的機率大幅提高。";
    
  var worldMemoryContext = WorldMemory.buildWorldMemoryPrompt(gameState.worldMemory, gameState.time.day);
  worldMemoryContext += '\n【世界地理位置】' + (typeof WORLD_MACRO_MAP !== 'undefined' ? WORLD_MACRO_MAP : '');
  worldMemoryContext += '\n' + dayHint;
  
  return {
    userText: userText,
    statusSnapshot: statusSnapshot,
    recentContext: recentContext,
    worldMemoryContext: worldMemoryContext,
    triggerBackgroundEvolution: triggerBackgroundEvolution
  };
}

function callAIProvider(payload) {
  var providerConf = CONFIG.PROVIDERS[gameState.provider] || CONFIG.PROVIDERS.gemini;
  if (providerConf.format === 'gemini') {
    return callGeminiAPI(payload, providerConf);
  }
  return callOpenAICompatibleAPI(payload, providerConf);
}

function buildFullPrompt(payload) {
  return payload.statusSnapshot + ' ' + (payload.worldMemoryContext || '') + ' 近期回合記錄： ' + (payload.recentContext || '尚無歷史這是開局') + ' 本回合玩家輸入： ' + payload.userText;
}

function callGeminiAPI(payload, providerConf) {
  var model = providerConf.defaultModel;
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + gameState.apiKey;
  var fullPrompt = buildFullPrompt(payload);

  var requestBody = {
      system_instruction: {
        parts: [
          { text: gameState.rulesText || '' }, // AI 核心規則與 JSON 格式要求
          { text: '\n\n【世界觀與主線真相】\n' + (gameState.loreText || '') },
          { text: '\n\n【技能樹與判定鐵律】\n' + (gameState.skillTreesText || '') },
          { text: '\n\n【勢力與地緣政治】\n' + (gameState.factionsText || '') }
        ]
      },
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 1.0, responseMimeType: 'application/json' }
    };

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  }).then(function (res) {
    if (!res.ok) {
      return res.json().catch(function () { return {}; }).then(function (errData) {
        var msg = (errData.error && errData.error.message) || ('HTTP ' + res.status);
        throw new Error(msg);
      });
    }
    return res.json();
  }).then(function (data) {
    var rawText = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!rawText) throw new Error('AI 未回傳有效內容');
    return JSON.parse(rawText);
  });
}

function callOpenAICompatibleAPI(payload, providerConf) {
  var fullPrompt = buildFullPrompt(payload);
  var systemText = gameState.rulesText + '\n\n世界觀密檔參考資料：\n' + gameState.loreText;

  var requestBody = {
    model: providerConf.defaultModel,
    messages: [
      { role: 'system', content: systemText },
      { role: 'user', content: fullPrompt }
    ],
    temperature: 1.0,
    response_format: { type: 'json_object' }
  };

  return fetch(providerConf.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + gameState.apiKey
    },
    body: JSON.stringify(requestBody)
  }).then(function (res) {
    if (!res.ok) {
      return res.json().catch(function () { return {}; }).then(function (errData) {
        var msg = (errData.error && errData.error.message) || ('HTTP ' + res.status);
        throw new Error(msg);
      });
    }
    return res.json();
  }).then(function (data) {
    var rawText = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!rawText) throw new Error('AI 未回傳有效內容');
    return JSON.parse(rawText);
  });
}

function handleAIResponse(response) {
  var narrative = response.narrative;
  var status_update = response.status_update;
  var options = response.options;

  appendGMText(narrative);
  applyStatusUpdate(status_update);

  gameState.turnCount += 1;
  gameState.recentTurns.push({ turn: gameState.turnCount, narrative: narrative, action: gameState.lastPlayerAction || '(開局)' });
  if (gameState.recentTurns.length > CONFIG.MAX_RECENT_TURNS) {
    gameState.recentTurns.shift();
  }

  pendingMilestoneModals = [];

  if (response.world_memory_update) {
    gameState.worldMemory = WorldMemory.applyWorldMemoryUpdate(gameState.worldMemory, response.world_memory_update, gameState.turnCount);
  }
  if (response.background_evolution) {
    gameState.worldMemory = WorldMemory.applyBackgroundEvolution(gameState.worldMemory, response.background_evolution, gameState.turnCount);
  }
  if (response.aspiration_update) {
    var aspResult = WorldMemory.applyAspirationUpdate(gameState.worldMemory, response.aspiration_update, gameState.time.day);
    gameState.worldMemory = aspResult.worldMemory;
    aspResult.milestones.forEach(function (m) {
      pendingMilestoneModals.push({ icon: '🎯', title: m.aspirationLabel + '志向進展', text: m.text });
    });
  }
  if (response.relationship_update) {
    gameState.worldMemory = WorldMemory.applyRelationshipUpdate(gameState.worldMemory, response.relationship_update, gameState.time.day);
  }

  if (status_update.special_event === 'death') {
    gameState.isDead = true;
    showDeathScreen(status_update.special_event_text || '你的旅程在此結束。');
    saveStateToLocal();
    maybeSyncToNotion();
    return;
  } else if (status_update.special_event === 'rescued') {
    pendingMilestoneModals.unshift({ icon: '🩹', title: '瀕死獲救', text: status_update.special_event_text || '有人在最後一刻拉住了你。' });
  } else if (status_update.special_event === 'awakening') {
    pendingMilestoneModals.unshift({ icon: '⚡', title: '異能覺醒', text: status_update.special_event_text || '你感覺到體內有某種力量正在覺醒' });
  } else if (status_update.special_event === 'multi_awakening') {
    pendingMilestoneModals.unshift({ icon: '⚡⚡', title: '多重覺醒', text: status_update.special_event_text || '不只一種力量在你體內同時甦醒' });
  } else if (status_update.special_event === 'level_up') {
    pendingMilestoneModals.unshift({ icon: '🔺', title: '能力進化', text: status_update.special_event_text || '你的能力形態出現了變化' });
  } else if (status_update.special_event && status_update.special_event !== 'none') {
    pendingMilestoneModals.unshift({ icon: '❗', title: '重要事件', text: status_update.special_event_text || '發生了重要的事情' });
  }

  // 【階段2新增】處理 NPC 覺醒狀態寫入
  if (response.world_memory_update && response.world_memory_update.npc_major_event) {
    var ne = response.world_memory_update.npc_major_event;
    if (ne.ability && gameState.npcStates && gameState.npcStates[ne.name]) {
       gameState.npcStates[ne.name].awakeningLevel = Math.max(gameState.npcStates[ne.name].awakeningLevel, 1);
    }
  }
  if (response.background_evolution && Array.isArray(response.background_evolution.npc_updates)) {
    response.background_evolution.npc_updates.forEach(function(nu) {
      if (nu.ability && gameState.npcStates && gameState.npcStates[nu.name]) {
        gameState.npcStates[nu.name].awakeningLevel = Math.max(gameState.npcStates[nu.name].awakeningLevel, 1);
      }
    });
  }

  // 【階段2新增】觸發 NPC 微行動 (例如：自動進食)
  if (typeof processNpcMicroActions === 'function') {
    processNpcMicroActions();
  }
  
  renderOptions(options);
  renderAll();
  saveStateToLocal();
  maybeSyncToNotion();

  showNextPendingModal();
}

function showNextPendingModal() {
  if (pendingMilestoneModals.length === 0) return;
  var next = pendingMilestoneModals.shift();
  showEventModal(next.icon, next.title, next.text);
}

function handleEventModalClose() {
  dom.eventModal.classList.add('hidden');
  showNextPendingModal();
}

function applyStatusUpdate(update) {
  if (!update) return;
  if (update.time_advance_minutes) advanceTime(update.time_advance_minutes);
  if (typeof update.stamina_change === 'number') {
    gameState.stamina = clamp(gameState.stamina + update.stamina_change, 0, gameState.maxStamina);
  }
  if (typeof update.hunger_change === 'number') {
    gameState.hunger = clamp(gameState.hunger + update.hunger_change, 0, 100);
  }
  if (update.current_location) {
    gameState.location = update.current_location;
    // 【階段2新增】記錄已探索地點（排除「未知地點」且不重複記錄）
    if (update.current_location !== '未知地點' && gameState.exploredLocations.indexOf(update.current_location) === -1) {
      gameState.exploredLocations.push(update.current_location);
    }
  }
  if (update.danger_level) {gameState.dangerLevel = update.danger_level;trackDangerLevel(update.danger_level);
  }
  if (update.weather) gameState.weather = update.weather;
  if (typeof update.humanity_change === 'number') {
    gameState.humanity = clamp(gameState.humanity + update.humanity_change, 0, 100);
  }
  if (typeof update.resonance_change === 'number') {
    gameState.resonanceValue = clamp(gameState.resonanceValue + update.resonance_change, 0, 999);
  }
  if (typeof update.ability_exp_change === 'number' && update.ability_exp_change !== 0) {
    applyAbilityExpChange(update.ability_exp_change);
  }
  if (update.injury_status) {
    gameState.injuryStatus = update.injury_status;
    if (update.injury_status === 'none') {
      gameState.injuryDetail = '';
    } else if (update.injury_detail) {
      gameState.injuryDetail = update.injury_detail;
    }
  }
  if (update.inventory_changes && update.inventory_changes.length) {
    var autoRecovery = applyInventoryChanges(update.inventory_changes);
    if (autoRecovery > 0) {
      gameState.hunger = clamp(gameState.hunger + autoRecovery, 0, 100);
    }
  }

  if (update.companion_changes && update.companion_changes.length) {
    applyCompanionChanges(update.companion_changes);
  }
  
// 【新增/升級】接收 NPC 的獨立狀態變化（含背包與體格）
  if (update.npc_status_updates && Array.isArray(update.npc_status_updates)) {
    update.npc_status_updates.forEach(function(npcUpdate) {
      if (npcUpdate.name && gameState.npcStates && gameState.npcStates[npcUpdate.name]) {
        var npc = gameState.npcStates[npcUpdate.name];
        
        if (typeof npcUpdate.stamina_change === 'number') {
          npc.stamina = clamp(npc.stamina + npcUpdate.stamina_change, 0, 100);
        }
        if (typeof npcUpdate.hunger_change === 'number') {
          npc.hunger = clamp(npc.hunger + npcUpdate.hunger_change, 0, 100);
        }
        if (npcUpdate.injury_status) {
          npc.injuryStatus = npcUpdate.injury_status;
        }
        if (npcUpdate.injury_status === 'none') {
          npc.injuryDetail = '';
        } else if (npcUpdate.injury_detail) {
          npc.injuryDetail = npcUpdate.injury_detail;
        }
        
        // 處理 NPC 獨立背包的增減
        if (npcUpdate.inventory_changes && Array.isArray(npcUpdate.inventory_changes)) {
          npc.inventory = npc.inventory || [];
          npcUpdate.inventory_changes.forEach(function(invChg) {
            var existing = null;
            for (var i = 0; i < npc.inventory.length; i++) {
              if (npc.inventory[i].name === invChg.name) { existing = npc.inventory[i]; break; }
            }
            if (invChg.action === 'add') {
              if (existing) existing.quantity += invChg.quantity;
              else npc.inventory.push({ name: invChg.name, quantity: invChg.quantity });
            } else if (invChg.action === 'remove' && existing) {
              existing.quantity -= invChg.quantity;
              if (existing.quantity <= 0) {
                npc.inventory = npc.inventory.filter(function(item) { return item.name !== invChg.name; });
              }
            }
          });
        }
        
        // 處理 NPC 的體格成長
        if (npcUpdate.proficiency_triggered && Array.isArray(npcUpdate.proficiency_triggered)) {
          npc.proficiency = npc.proficiency || { combat: 0, shooting: 0, agility: 0, scouting: 0, medical: 0, negotiation: 0, searching: 0, mechanics: 0 };
          npcUpdate.proficiency_triggered.forEach(function(prof) {
            if (typeof npc.proficiency[prof] !== 'undefined') {
              npc.proficiency[prof] += 15; // 每次觸發固定給 15 點經驗，由前端統一控制
            }
          });
        }
      }
    });
  }

  // 【階段5新增】處理 AI 回報的熟練度增加
  if (update.proficiency_triggered && Array.isArray(update.proficiency_triggered)) {
    applyProficiencyGrowth(gameState.skillProficiency, update.proficiency_triggered);
    // (如果未來需要，也可以讓 AI 回報 NPC 的觸發，目前先以主角為主)
  }
  if (update.vehicle_update && update.vehicle_update.action) {
    applyVehicleUpdate(update.vehicle_update);
  }
  if (update.stash_update && update.stash_update.action) {
    applyStashUpdate(update.stash_update);
  }
  if (update.faction_trust_update) {
    for (var faction in update.faction_trust_update) {
      if (Object.prototype.hasOwnProperty.call(update.faction_trust_update, faction)) {
        var delta = update.faction_trust_update[faction];
        gameState.factionTrust[faction] = (gameState.factionTrust[faction] || 0) + delta;
      }
    }
  }
  if (update.special_event === 'awakening') gameState.awakeningLevel = Math.max(gameState.awakeningLevel, 1);
  if (update.special_event === 'multi_awakening') gameState.awakeningLevel = Math.max(gameState.awakeningLevel, 1);
}

function applyCompanionChanges(changes) {
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    if (change.action === 'join') {
      if (gameState.companions.indexOf(change.name) === -1 && gameState.companions.length < 2) {
        gameState.companions.push(change.name);
      }
      // 【階段2新增】初始化 NPC 與復隊校正
      createNpcStateSkeleton(change.name);
      correctNpcStateOnRejoin(change.name, gameState.turnCount);
    } else if (change.action === 'leave') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
      // 【階段2新增】記錄離隊回合
      if (gameState.npcStates && gameState.npcStates[change.name]) {
        gameState.npcStates[change.name].lastLeftTurn = gameState.turnCount;
      }
    } else if (change.action === 'die') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
      // 【階段2新增】死亡清除
      clearNpcStateOnDeath(change.name);
    }
  }
}

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

  // 【修正】只有「當前隨行」的 NPC 才會隨時間自然消耗飢餓度，不在身邊的完全凍結
  if (gameState.npcStates && gameState.companions && gameState.companions.length > 0) {
    gameState.companions.forEach(function(npcName) {
      var npc = gameState.npcStates[npcName];
      if (npc && typeof npc.hunger === 'number') {
        npc.hunger = clamp(npc.hunger - hungerDecay, 0, 100);
      }
    });
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// 【階段1新增】通用死亡判定邏輯（體力歸零且未處理重度受傷）
function checkEntityDeathCondition(stamina, injuryStatus) {
  return stamina <= 0 && injuryStatus === 'severe';
}

function renderAll() {
  var testTag = gameState.isTestMode ? '🧪 ' : '';
  dom.statusTime.textContent = testTag + '⏱ 第' + gameState.time.day + '天 ' + pad2(gameState.time.hour) + ':' + pad2(gameState.time.minute);
  dom.statusLocation.textContent = '📍 ' + gameState.location;

  var staminaPct = (gameState.stamina / gameState.maxStamina) * 100;
  dom.staminaFill.style.width = staminaPct + '%';
  dom.staminaValue.textContent = gameState.stamina;
  dom.staminaFill.classList.remove('low', 'critical');
  if (staminaPct <= CONFIG.STAMINA_CRITICAL_THRESHOLD) dom.staminaFill.classList.add('critical');
  else if (staminaPct <= CONFIG.STAMINA_LOW_THRESHOLD) dom.staminaFill.classList.add('low');

  var hungerPct = gameState.hunger;
  dom.hungerFill.style.width = hungerPct + '%';
  dom.hungerValue.textContent = gameState.hunger;
  dom.hungerFill.classList.remove('low', 'critical');
  if (hungerPct <= CONFIG.STAMINA_CRITICAL_THRESHOLD) dom.hungerFill.classList.add('critical');
  else if (hungerPct <= CONFIG.STAMINA_LOW_THRESHOLD) dom.hungerFill.classList.add('low');

  var dangerMap = { safe: '安全', warning: '警戒', critical: '危險' };
  dom.statusDanger.textContent = dangerMap[gameState.dangerLevel] || '安全';
  dom.statusDanger.className = 'danger-tag ' + gameState.dangerLevel;

  var injuryMap = { none: '', minor: '輕傷', severe: '重傷' };
  var injuryText = injuryMap[gameState.injuryStatus] || '';
  if (injuryText) {
    dom.injuryTag.textContent = injuryText;
    dom.injuryTag.className = 'injury-tag ' + gameState.injuryStatus;
    dom.injuryTag.classList.remove('hidden');
  } else {
    dom.injuryTag.classList.add('hidden');
  }

  dom.statHumanity.textContent = gameState.humanity;

  if (dom.statAwakening) {
    dom.statAwakening.textContent = gameState.awakeningLevel > 0
      ? ('Lv.' + gameState.awakeningLevel + ' ' + (gameState.awakeningAbility || '') + '（' + gameState.abilityExp + '/' + getAbilityExpNeeded(gameState.awakeningLevel) + '）')
      : '未覺醒';
  }

  dom.statWeather.textContent = gameState.weather;
  if (dom.statCompanions) dom.statCompanions.textContent = gameState.companions.length ? gameState.companions.join('、') : '無';

  var factionEntries = [];
  for (var k in gameState.factionTrust) {
    if (Object.prototype.hasOwnProperty.call(gameState.factionTrust, k)) {
      factionEntries.push(k + ':' + gameState.factionTrust[k]);
    }
  }

  if (dom.statFaction) {
    dom.statFaction.textContent = factionEntries.length ? factionEntries.join(' / ') : '無接觸';
  }

  if (dom.panelItemAwakening) {
    dom.panelItemAwakening.classList.toggle('hidden', gameState.awakeningLevel <= 0);
  }
  if (dom.panelItemFaction) {
    var hasFactionContact = Object.keys(gameState.factionTrust).length > 0;
    dom.panelItemFaction.classList.toggle('hidden', !hasFactionContact);
  }

  if (dom.npcSectionToggle) {
    var wmForVisibility = WorldMemory.ensureShape(gameState.worldMemory);
    var npcCount = Object.keys(wmForVisibility.relationships).length;
    var npcSpan = dom.npcSectionToggle.querySelector('span');
    if (npcSpan) npcSpan.textContent = '📇 人物檔案（' + npcCount + '）';
  }

  if (dom.vehicleSectionToggle) {
    var hasVehicle = gameState.vehicles.some(function (v) { return v.status !== 'lost'; });
    var vehicleCount = gameState.vehicles.filter(function (v) { return v.status !== 'lost'; }).length;
    var vSpan = dom.vehicleSectionToggle.querySelector('span');
    if (vSpan) vSpan.textContent = '🚗 載具（' + vehicleCount + '）';
  }

  renderCharProfile();
  renderItemsAccordion();
  renderNpcPanel();
  renderVehiclePanel();

  if (typeof updateDynamicVisuals === 'function') updateDynamicVisuals();
}

function appendGMText(text) {
  var el = document.createElement('div');
  el.className = 'narrative-entry gm-text';
  el.textContent = text;
  dom.narrativeContent.appendChild(el);
  scrollToBottom();
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

function appendPlayerAction(text, riskLevel) {
  var el = document.createElement('div');
  el.className = 'narrative-entry player-action risk-' + (riskLevel || 'low');
  el.textContent = '▸ ' + text;
  dom.narrativeContent.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(function () {
    dom.narrativeLog.scrollTop = dom.narrativeLog.scrollHeight;
  });
}

function showTyping(show) {
  dom.typingIndicator.classList.toggle('hidden', !show);
  if (show) scrollToBottom();
}

function getRiskLevel(riskHint) {
  if (!riskHint) return 'low';
  var text = riskHint.toLowerCase();
  var highKeywords = ['死', '喪屍', '危險', '致命', '重傷', '衝突', '挑釁', '暴露', '追擊', '槍聲', 'high risk', 'extreme', 'lethal', 'critical'];
  var mediumKeywords = ['可能', '風險', '難以', '警戒', '驚動', '盤查', 'moderate', 'medium risk'];
  for (var i = 0; i < highKeywords.length; i++) {
    if (text.indexOf(highKeywords[i].toLowerCase()) !== -1) return 'high';
  }
  for (var j = 0; j < mediumKeywords.length; j++) {
    if (text.indexOf(mediumKeywords[j].toLowerCase()) !== -1) return 'medium';
  }
  return 'low';
}

function renderOptions(options) {
  gameState.lastOptions = options || [];
  dom.optionsContainer.innerHTML = '';
  var list = options || [];
  for (var i = 0; i < list.length; i++) {
    var opt = list[i];
    var validLevels = ['low', 'medium', 'high'];
    var riskLevel = (validLevels.indexOf(opt.risk_level) !== -1)
      ? opt.risk_level
      : getRiskLevel(opt.risk_hint);
    var btn = document.createElement('button');
    btn.className = 'option-btn risk-' + riskLevel;
    btn.type = 'button';
    var riskHtml = opt.risk_hint ? ('<span class="option-risk">' + escapeHtml(opt.risk_hint) + '</span>') : '';
    btn.innerHTML = '<span class="option-id">' + opt.id + '.</span>' + escapeHtml(opt.label) + riskHtml;
    btn.addEventListener('click', makeOptionClickHandler(opt, riskLevel));
    dom.optionsContainer.appendChild(btn);
  }
  dom.optionsCollapseToggle.classList.toggle('hidden', list.length === 0);
  applyOptionsDisplayMode();
}

function makeOptionClickHandler(opt, riskLevel) {
  return function () {
    if (opt.id === 'RETRY') {
      requestNextTurn(gameState.lastPlayerAction || '__START__');
    } else {
      gameState.lastActionRiskLevel = riskLevel;
      requestNextTurn(opt.label);
    }
  };
}

function applyOptionsDisplayMode() {
  dom.optionsContainer.classList.toggle('hidden', optionsMiniMode);
  dom.freeInputToggle.classList.toggle('hidden', optionsMiniMode);
  dom.freeInputRow.classList.add('hidden');
  dom.optionsCollapseToggle.classList.toggle('hidden', optionsMiniMode);
  dom.optionsCollapseToggle.classList.toggle('expanded', !optionsMiniMode);
  dom.actionCollapsedBar.classList.toggle('hidden', !optionsMiniMode);
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showEventModal(icon, title, text) {
  dom.eventModalIcon.textContent = icon;
  dom.eventModalTitle.textContent = title;
  dom.eventModalText.textContent = text;
  dom.eventModal.classList.remove('hidden');
}

function showDeathScreen(text) {
  dom.eventModal.classList.add('hidden');
  dom.optionsContainer.innerHTML = '';
  dom.optionsCollapseToggle.classList.add('hidden');
  dom.freeInputToggle.classList.add('hidden');
  dom.freeInputRow.classList.add('hidden');
  dom.deathScreen.querySelector('.death-text').textContent = text;
  dom.deathScreen.classList.remove('hidden');
}

function handleFreeInputSend() {
  var text = dom.freeInputText.value.trim();
  if (!text) return;
  dom.freeInputText.value = '';
  dom.freeInputRow.classList.add('hidden');
  dom.freeInputToggle.classList.remove('hidden');
  requestNextTurn(text);
}

function toggleSideMenu(show) {
  dom.sideMenu.classList.toggle('hidden', !show);
}

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
  return { x: 0, y: 0 }; // 找不到就當作原點
}

function requestTravelTo(targetLocation) {
  if (isWaitingForAI || gameState.isDead) return;
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
    advanceTime(dist * 1.5); // 開車時間
    promptText = "你驅車抵達了【" + targetLocation + "】（總車程 " + dist + " 公里）。";
  } else {
    var staminaNeeded = dist * 3;
    if (staminaNeeded > gameState.stamina) {
      alert("📍 距離過遠（" + dist + "公里），需要 " + staminaNeeded + " 體力。徒步前往等同自殺。請先準備載具、紮營或規劃中繼點。"); return;
    }
    // JS 直接扣除主角與NPC體力
    gameState.stamina = Math.max(0, gameState.stamina - staminaNeeded);
    if (gameState.companions && gameState.npcStates) {
      gameState.companions.forEach(function(npc) {
        if(gameState.npcStates[npc]) gameState.npcStates[npc].stamina = Math.max(0, gameState.npcStates[npc].stamina - staminaNeeded);
      });
    }
    advanceTime(dist * 12); // 徒步時間
    promptText = "你徒步跋涉抵達了【" + targetLocation + "】（徒步 " + dist + " 公里）。";
  }
  
  // 更新位置並關閉UI，通知AI生成新地點敘事
  gameState.location = targetLocation;
  if (gameState.exploredLocations.indexOf(targetLocation) === -1) gameState.exploredLocations.push(targetLocation);
  
  toggleInfoPanel(false);
  if (dom.manualModal) dom.manualModal.classList.add('hidden');
  renderAll();
  requestNextTurn(promptText);
}


document.addEventListener('DOMContentLoaded', init);

// ==========================================
// 動態視覺引擎 (背景與立繪切換)
// ==========================================
function updateDynamicVisuals() {
  var appContainer = document.getElementById('app');
  var currentLoc = gameState.location;
  var currentZone = "未知";
  
  // 1. 反推目前所在地屬於哪個大區域
  for (var poolId in MAP_PRESETS) {
    var pool = MAP_PRESETS[poolId];
    if (pool.name === currentLoc || pool.locations.some(function(l) { return l.name === currentLoc; })) {
      currentZone = poolId;
      break;
    }
  }
  if (currentZone === "未知" && gameState.currentMapPresetId) {
     currentZone = gameState.currentMapPresetId;
  }

  // 2. 圖片檔名對應字典 (大區域背景)
  var zoneBgMap = {
    "維爾赫姆市": "wilhelm_city.jpg",
    "灰堡": "greywall.jpg",
    "荒原鎮群": "ashfield.jpg",
    "靜默聖所": "sanctum.jpg",
    "深谷中繼站": "hollowreach.jpg",
    "方舟海上堡壘": "ark_fortress.jpg"
  };

  // 3. 圖片檔名對應字典 (具體小地點 - 可隨時擴充)
  var specificLocationBgMap = {
    // 開局常見地點
    "荒廢鐵路": "railway.jpg",
    "荒廢公路": "highway.jpg",
    "市郊工業區": "industrial.jpg",
    "舊城區公寓": "apartment.jpg",
    "沿海漁村": "fishing_village.jpg",
    "大學宿舍": "dormitory.jpg",
    "郊區農場": "farm.jpg",
    "市中心辦公大樓": "office.jpg",
    "山區小鎮": "mountain_town.jpg",
    "港口貨運站": "port.jpg",
    "廢棄地鐵隧道": "subway.jpg",
    "大型購物中心廢墟": "mall.jpg",
    "警局軍械庫": "armory.jpg",
    "體育館避難所": "stadium.jpg",
    "自來水處理廠": "water_plant.jpg",
    "荒野廣播電台": "radio_tower.jpg",
    
    // 大勢力標誌性地標 (舉例幾個，你未來可以補完)
    "廢棄仁愛醫院": "hospital.jpg",
    "地下彈藥庫": "ammo_bunker.jpg",
    "拾荒者黑市": "black_market.jpg",
    "懺悔地牢": "dungeon.jpg",
    "通訊雷達塔": "radar_dish.jpg",
    "核心拍賣所": "auction_hall.jpg"
  };
  
  // 決定最終背景：先找「具體地點」，找不到找「大區背景」，再沒有就「預設背景」
  var finalBgFileName = specificLocationBgMap[currentLoc] || zoneBgMap[currentZone] || "default.jpg";
  
  if (appContainer) {
    appContainer.style.backgroundImage = "url('images/bg/" + finalBgFileName + "')";
  }

  // 4. 處理主角頭像切換與覺醒發光特效
  var avatarBox = document.getElementById('player-avatar-box');
  if (avatarBox && gameState.charSetup) {
    var gender = (gameState.charSetup.gender === '女性') ? 'female' : 'male';
    var bgType = gameState.charSetup.backgroundType || 'combat_survivor';
    
    var avatarFileName = gender + '_' + bgType + '.jpg';
    avatarBox.style.backgroundImage = "url('images/chars/" + avatarFileName + "')";
    
    if (gameState.awakeningLevel > 0) {
       avatarBox.classList.add('awakened');
    } else {
       avatarBox.classList.remove('awakened');
    }
  }
}
