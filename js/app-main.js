'use strict';

function cacheDom() {
  // ---------- 開局設定畫面 ----------
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
  dom.bgSelect = document.getElementById('char-background-type-select');
  dom.generalistDiv = document.getElementById('generalist-picks-container');

  // ---------- 頂部狀態列 ----------
  dom.statusTime = document.getElementById('status-time');
  dom.statusLocation = document.getElementById('status-location');
  dom.statusExpandBtn = document.getElementById('status-expand-btn');
  dom.staminaFill = document.getElementById('stamina-bar-fill');
  dom.staminaValue = document.getElementById('stamina-value');
  dom.statusDanger = document.getElementById('status-danger');
  dom.injuryTag = document.getElementById('injury-tag');
  dom.statusPanelFull = document.getElementById('status-panel-full');
  dom.statHumanity = document.getElementById('stat-humanity');
  dom.statFaction = document.getElementById('stat-faction');
  dom.statAwakening = document.getElementById('stat-awakening');
  dom.statWeather = document.getElementById('stat-weather');
  dom.statHunger = document.getElementById('stat-hunger');
  dom.statCompanions = document.getElementById('stat-companions');
  dom.hungerFill = document.getElementById('hunger-bar-fill');
  dom.hungerValue = document.getElementById('hunger-value');

  // ---------- 敘事區與行動列 ----------
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

  // ---------- 終端機／資訊面板（物品、NPC、載具） ----------
  dom.panelsToggleBtn = document.getElementById('panels-toggle-btn');
  dom.infoPanel = document.getElementById('info-panel');
  dom.infoPanelBackdrop = document.getElementById('info-panel-backdrop');
  dom.infoPanelClose = document.getElementById('info-panel-close');
  dom.itemsSectionToggle = document.getElementById('items-section-toggle');
  dom.itemsSectionBody = document.getElementById('items-section-body');
  dom.itemsAccordion = document.getElementById('items-accordion');
  dom.transferModeToggle = document.getElementById('transfer-mode-toggle');
  dom.inventoryList = document.getElementById('inventory-list');
  dom.inventoryLoadTag = document.getElementById('inventory-load-tag');
  dom.npcSectionToggle = document.getElementById('npc-section-toggle');
  dom.npcSectionBody = document.getElementById('npc-section-body');
  dom.npcList = document.getElementById('npc-list');
  dom.vehicleSectionToggle = document.getElementById('vehicle-section-toggle');
  dom.vehicleSectionBody = document.getElementById('vehicle-section-body');
  dom.vehicleList = document.getElementById('vehicle-list');

  // ---------- 側邊選單 ----------
  dom.sideMenu = document.getElementById('side-menu');
  dom.sideMenuBackdrop = document.getElementById('side-menu-backdrop');
  dom.menuToggleBtn = document.getElementById('menu-toggle-btn');
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

  // ---------- 各種彈窗 ----------
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
  dom.manualModal = document.getElementById('manual-modal');
  dom.manualCloseBtn = document.getElementById('manual-close-btn');
  dom.transferModal = document.getElementById('transfer-modal');
  dom.transferItemName = document.getElementById('transfer-item-name');
  dom.transferTargetSelect = document.getElementById('transfer-target-select');
  dom.transferQuantityInput = document.getElementById('transfer-qty-input');
  dom.transferConfirmBtn = document.getElementById('transfer-confirm-btn');
  dom.transferCancelBtn = document.getElementById('transfer-cancel-btn');


  // ---------- 角色檔案面板 ----------
  dom.charProfileToggle = document.getElementById('char-profile-toggle');
  dom.charProfileBody = document.getElementById('char-profile-body');
  // 【已刪除】dom.profileName（HTML 已無 profile-name 欄位，主角不顯示姓名）
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

  // ============================================================
  // 【語意分組別名】指向與上方扁平版本完全相同的 DOM 元素，
  // 現有程式碼可繼續使用扁平屬性，新程式碼可改用以下語意化路徑。
  // ============================================================

  dom.setup = {
    screen: dom.setupScreen,
    gameScreen: dom.gameScreen,
    providerSelect: dom.providerSelect,
    apiKeyInput: dom.apiKeyInput,
    startBtn: dom.startBtn,
    testModeBtn: dom.testModeBtn,
    importSaveBtn: dom.importSaveBtn,
    importSaveFile: dom.importSaveFile,
    rulesLinkBtn: dom.rulesLinkBtn,
    charSetupToggle: dom.charSetupToggle,
    charSetupFields: dom.charSetupFields,
    charGenderInput: dom.charGenderInput,
    charLocationInput: dom.charLocationInput,
    charOccupationInput: dom.charOccupationInput,
    bgSelect: dom.bgSelect,
    generalistDiv: dom.generalistDiv
  };

  dom.status = {
    time: dom.statusTime,
    location: dom.statusLocation,
    expandBtn: dom.statusExpandBtn,
    staminaFill: dom.staminaFill,
    staminaValue: dom.staminaValue,
    danger: dom.statusDanger,
    injuryTag: dom.injuryTag,
    panelFull: dom.statusPanelFull,
    humanity: dom.statHumanity,
    faction: dom.statFaction,
    awakening: dom.statAwakening,
    weather: dom.statWeather,
    hunger: dom.statHunger,
    companions: dom.statCompanions,
    hungerFill: dom.hungerFill,
    hungerValue: dom.hungerValue
  };

  dom.narrative = {
    log: dom.narrativeLog,
    content: dom.narrativeContent,
    typingIndicator: dom.typingIndicator,
    optionsCollapseToggle: dom.optionsCollapseToggle,
    optionsContainer: dom.optionsContainer,
    freeInputRow: dom.freeInputRow,
    freeInputText: dom.freeInputText,
    freeInputSend: dom.freeInputSend,
    freeInputCancel: dom.freeInputCancel,
    freeInputToggle: dom.freeInputToggle,
    actionCollapsedBar: dom.actionCollapsedBar
  };

  // 【備註】dom.infoPanel（面板容器本身）維持原扁平屬性不變，
  // 分組別名另外命名為 dom.infoPanelGroup 避免與其衝突。
  dom.infoPanelGroup = {
    toggleBtn: dom.panelsToggleBtn,
    panel: dom.infoPanel,
    backdrop: dom.infoPanelBackdrop,
    close: dom.infoPanelClose,
    itemsSectionToggle: dom.itemsSectionToggle,
    itemsSectionBody: dom.itemsSectionBody,
    itemsAccordion: dom.itemsAccordion,
    transferModeToggle: dom.transferModeToggle,
    inventoryList: dom.inventoryList,
    inventoryLoadTag: dom.inventoryLoadTag,
    npcSectionToggle: dom.npcSectionToggle,
    npcSectionBody: dom.npcSectionBody,
    npcList: dom.npcList,
    vehicleSectionToggle: dom.vehicleSectionToggle,
    vehicleSectionBody: dom.vehicleSectionBody,
    vehicleList: dom.vehicleList
  };

  dom.menu = {
    sideMenu: dom.sideMenu,
    backdrop: dom.sideMenuBackdrop,
    toggleBtn: dom.menuToggleBtn,
    exportBtn: dom.menuExportBtn,
    importBtn: dom.menuImportBtn,
    namedSaveBtn: dom.menuNamedSaveBtn,
    saveManagerBtn: dom.menuSaveManagerBtn,
    restartBtn: dom.menuRestartBtn,
    apikeyBtn: dom.menuApikeyBtn,
    rulesBtn: dom.menuRulesBtn,
    closeBtn: dom.menuCloseBtn,
    notionSetupToggle: dom.notionSetupToggle,
    notionSetupFields: dom.notionSetupFields,
    notionProxyInput: dom.notionProxyInput,
    notionDbInput: dom.notionDbInput,
    notionSaveBtn: dom.notionSaveBtn,
    notionSyncNowBtn: dom.notionSyncNowBtn
  };

  dom.modal = {
    event: dom.eventModal,
    eventIcon: dom.eventModalIcon,
    eventTitle: dom.eventModalTitle,
    eventText: dom.eventModalText,
    eventClose: dom.eventModalClose,
    loadingOverlay: dom.loadingOverlay,
    deathScreen: dom.deathScreen,
    namedSave: dom.namedSaveModal,
    namedSaveList: dom.namedSaveList,
    namedSaveClose: dom.namedSaveClose,
    saveTabLocal: dom.saveTabLocal,
    saveTabNotion: dom.saveTabNotion,
    manual: dom.manualModal,
    manualClose: dom.manualCloseBtn,
    transfer: {
      root: dom.transferModal,
      itemName: dom.transferItemName,
      targetSelect: dom.transferTargetSelect,
      quantityInput: dom.transferQuantityInput,
      confirmBtn: dom.transferConfirmBtn,
      cancelBtn: dom.transferCancelBtn
    }
  };

  // 【已移除 name 欄位】依使用者指示，dom.profileName 已刪除
  dom.profile = {
    toggle: dom.charProfileToggle,
    body: dom.charProfileBody,
    gender: dom.profileGender,
    location: dom.profileLocation,
    occupation: dom.profileOccupation,
    safezoneList: dom.profileSafezoneList,
    factionList: dom.profileFactionList,
    injurySection: dom.profileInjurySection,
    injuryLevel: dom.profileInjuryLevel,
    injuryDetail: dom.profileInjuryDetail,
    awakeningSection: dom.profileAwakeningSection,
    awakeningLevel: dom.profileAwakeningLevel,
    awakeningAbility: dom.profileAwakeningAbility,
    awakeningExp: dom.profileAwakeningExp
  };
}

function init() {
  if (typeof initTransferUI === 'function') initTransferUI();
  
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
    } else {
      // 【修正 Bug #8】偵測到存檔，但目前供應商缺少金鑰：
      // 不靜默放棄，改為在開局畫面提示玩家，並自動切換下拉選單
      // 到存檔記錄的供應商，方便玩家直接補填金鑰。
      if (dom.providerSelect) dom.providerSelect.value = provider;
      var day = (savedState.time && savedState.time.day) || '未知';
      if (dom.apiKeyInput) {
        dom.apiKeyInput.placeholder = '偵測到第' + day + '天的存檔，請輸入「' + (CONFIG.PROVIDERS[provider] ? CONFIG.PROVIDERS[provider].label : provider) + '」的 API 金鑰以繼續';
      }
      console.warn('[存檔系統] 偵測到本機存檔（第' + day + '天），但供應商「' + provider + '」缺少 API 金鑰，需要玩家手動補填。');
    }
  } catch (e) {
    console.error('存檔讀取失敗', e);
    alert('存檔讀取失敗，資料可能已損毀。若持續發生，建議使用「匯出/匯入存檔檔案」功能作為備份。');
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

document.addEventListener('DOMContentLoaded', init);
