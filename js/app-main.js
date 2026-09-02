'use strict';

function cacheDom() {
  dom.setup = {
    screen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    providerSelect: document.getElementById('provider-select'),
    apiKeyInput: document.getElementById('api-key-input'),
    startBtn: document.getElementById('start-game-btn'),
    testModeBtn: document.getElementById('test-mode-btn'),
    importSaveBtn: document.getElementById('import-save-btn'),
    importSaveFile: document.getElementById('import-save-file'),
    rulesLinkBtn: document.getElementById('rules-link-btn'),
    charSetupToggle: document.getElementById('char-setup-toggle'),
    charSetupFields: document.getElementById('char-setup-fields'),
    charGenderInput: document.getElementById('char-gender-input'),
    charLocationInput: document.getElementById('char-location-input'),
    charOccupationInput: document.getElementById('char-occupation-input'),
    bgSelect: document.getElementById('char-background-type-select'),
    generalistDiv: document.getElementById('generalist-picks-container'),
    generalistPointsLeft: document.getElementById('generalist-points-left')
  };

  dom.status = {
    time: document.getElementById('status-time'),
    location: document.getElementById('status-location'),
    expandBtn: document.getElementById('status-expand-btn'),
    staminaFill: document.getElementById('stamina-bar-fill'),
    staminaValue: document.getElementById('stamina-value'),
    danger: document.getElementById('status-danger'),
    injuryTag: document.getElementById('injury-tag'),
    panelFull: document.getElementById('status-panel-full'),
    humanity: document.getElementById('stat-humanity'),
    faction: document.getElementById('stat-faction'),
    awakening: document.getElementById('stat-awakening'),
    weather: document.getElementById('stat-weather'),
    hunger: document.getElementById('stat-hunger'),
    companions: document.getElementById('stat-companions'),
    hungerFill: document.getElementById('hunger-bar-fill'),
    hungerValue: document.getElementById('hunger-value')
  };

  dom.narrative = {
    log: document.getElementById('narrative-log'),
    content: document.getElementById('narrative-content'),
    typingIndicator: document.getElementById('typing-indicator'),
    optionsCollapseToggle: document.getElementById('options-collapse-toggle'),
    optionsContainer: document.getElementById('options-container'),
    freeInputRow: document.getElementById('free-input-row'),
    freeInputText: document.getElementById('free-input-text'),
    freeInputSend: document.getElementById('free-input-send'),
    freeInputCancel: document.getElementById('free-input-cancel'),
    freeInputToggle: document.getElementById('free-input-toggle'),
    actionCollapsedBar: document.getElementById('action-collapsed-bar')
  };

  dom.infoPanelGroup = {
    toggleBtn: document.getElementById('panels-toggle-btn'),
    panel: document.getElementById('info-panel'),
    backdrop: document.getElementById('info-panel-backdrop'),
    close: document.getElementById('info-panel-close'),
    itemsSectionToggle: document.getElementById('items-section-toggle'),
    itemsSectionBody: document.getElementById('items-section-body'),
    itemsAccordion: document.getElementById('items-accordion'),
    transferModeToggle: document.getElementById('transfer-mode-toggle'),
    inventoryList: document.getElementById('inventory-list'),
    inventoryLoadTag: document.getElementById('inventory-load-tag'),
    npcSectionToggle: document.getElementById('npc-section-toggle'),
    npcSectionBody: document.getElementById('npc-section-body'),
    npcList: document.getElementById('npc-list'),
    vehicleSectionToggle: document.getElementById('vehicle-section-toggle'),
    vehicleSectionBody: document.getElementById('vehicle-section-body'),
    vehicleList: document.getElementById('vehicle-list')
  };

  dom.menu = {
    sideMenu: document.getElementById('side-menu'),
    backdrop: document.getElementById('side-menu-backdrop'),
    toggleBtn: document.getElementById('menu-toggle-btn'),
    exportBtn: document.getElementById('menu-export-btn'),
    importBtn: document.getElementById('menu-import-btn'),
    namedSaveBtn: document.getElementById('menu-named-save-btn'),
    saveManagerBtn: document.getElementById('menu-save-manager-btn'),
    restartBtn: document.getElementById('menu-restart-btn'),
    apikeyBtn: document.getElementById('menu-apikey-btn'),
    rulesBtn: document.getElementById('menu-rules-btn'),
    closeBtn: document.getElementById('menu-close-btn'),
    notionSetupToggle: document.getElementById('notion-setup-toggle'),
    notionSetupFields: document.getElementById('notion-setup-fields'),
    notionProxyInput: document.getElementById('notion-proxy-input'),
    notionDbInput: document.getElementById('notion-db-input'),
    notionSaveBtn: document.getElementById('notion-save-btn'),
    notionSyncNowBtn: document.getElementById('notion-sync-now-btn')
  };

  dom.modal = {
    event: document.getElementById('event-modal'),
    eventIcon: document.getElementById('event-modal-icon'),
    eventTitle: document.getElementById('event-modal-title'),
    eventText: document.getElementById('event-modal-text'),
    eventClose: document.getElementById('event-modal-close'),

    loadingOverlay: document.getElementById('loading-overlay'),
    deathScreen: document.getElementById('death-screen'),

    namedSave: document.getElementById('named-save-modal'),
    namedSaveList: document.getElementById('named-save-list'),
    namedSaveClose: document.getElementById('named-save-close'),
    saveTabLocal: document.getElementById('save-tab-local'),
    saveTabNotion: document.getElementById('save-tab-notion'),

    manual: document.getElementById('manual-modal'),
    manualClose: document.getElementById('manual-close-btn'),

    dailyReport: {
      root: document.getElementById('daily-report-modal'),
      content: document.getElementById('daily-report-content'),
      closeBtn: document.getElementById('daily-report-close-btn')
    },

    travel: {
      root: document.getElementById('travel-modal'),
      targetName: document.getElementById('travel-target-name'),
      costInfo: document.getElementById('travel-cost-info'),
      confirmBtn: document.getElementById('travel-confirm-btn'),
      cancelBtn: document.getElementById('travel-cancel-btn')
    },

    transfer: {
      root: document.getElementById('transfer-modal'),
      itemName: document.getElementById('transfer-item-name'),
      targetSelect: document.getElementById('transfer-target-select'),
      quantityInput: document.getElementById('transfer-qty-input'),
      confirmBtn: document.getElementById('transfer-confirm-btn'),
      cancelBtn: document.getElementById('transfer-cancel-btn')
    },

    use: {
      root: document.getElementById('use-modal'),
      itemName: document.getElementById('use-item-name'),
      targetSelect: document.getElementById('use-target-select'),
      confirmBtn: document.getElementById('use-confirm-btn'),
      cancelBtn: document.getElementById('use-cancel-btn')
    }
  };

  dom.profile = {
    toggle: document.getElementById('char-profile-toggle'),
    body: document.getElementById('char-profile-body'),
    gender: document.getElementById('profile-gender'),
    occupation: document.getElementById('profile-occupation'),
    safezoneList: document.getElementById('profile-safezone-list'),
    factionList: document.getElementById('profile-faction-list'),
    injurySection: document.getElementById('profile-injury-section'),
    injuryLevel: document.getElementById('profile-injury-level'),
    injuryDetail: document.getElementById('profile-injury-detail'),
    awakeningSection: document.getElementById('profile-awakening-section'),
    awakeningLevel: document.getElementById('profile-awakening-level'),
    awakeningAbility: document.getElementById('profile-awakening-ability'),
    awakeningExp: document.getElementById('profile-awakening-exp'),
    proficiencyAnchor: document.getElementById('profile-proficiency-anchor')
  };

  dom.app = {
    root: document.getElementById('app'),
    playerAvatarBox: document.getElementById('player-avatar-box')
  };

  dom.template = {
    safezoneCard: document.getElementById('safezone-card-template')
  };
}

function init() {
  cacheDom();

  // 所有 DOM 分組快取已完成，現在才初始化依賴快取的 UI 模組。
  if (typeof initTransferUI === 'function') initTransferUI();
  if (typeof initItemUseUI === 'function') initItemUseUI();
  if (typeof initManualSystem === 'function') initManualSystem();

  populateProviderSelect();
  bindEvents();
  loadRulesAndLore();
  loadNotionConfig();
  setupTestModeEntry();
  tryRestoreSavedGame();
}

function populateProviderSelect() {
  if (!dom.setup.providerSelect) return;

  dom.setup.providerSelect.innerHTML = '';

  for (var key in CONFIG.PROVIDERS) {
    if (Object.prototype.hasOwnProperty.call(CONFIG.PROVIDERS, key)) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = CONFIG.PROVIDERS[key].label;
      dom.setup.providerSelect.appendChild(opt);
    }
  }

  var savedProvider =
    localStorage.getItem(PROVIDER_KEY) || CONFIG.ACTIVE_PROVIDER;

  dom.setup.providerSelect.value = savedProvider;

  var savedKey = localStorage.getItem(
    APIKEY_KEY_PREFIX + savedProvider
  );

  if (savedKey && dom.setup.apiKeyInput) {
    dom.setup.apiKeyInput.value = savedKey;
  }
}

function tryRestoreSavedGame() {
  var provider =
    localStorage.getItem(PROVIDER_KEY) || CONFIG.ACTIVE_PROVIDER;

  var savedKey = localStorage.getItem(
    APIKEY_KEY_PREFIX + provider
  );

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
      // 偵測到存檔，但目前供應商缺少 API 金鑰。
      // 自動切換到存檔記錄的供應商，方便玩家直接補填。
      if (dom.setup.providerSelect) {
        dom.setup.providerSelect.value = provider;
      }

      var day =
        (savedState.time && savedState.time.day) || '未知';

      if (dom.setup.apiKeyInput) {
        dom.setup.apiKeyInput.placeholder =
          '偵測到第' +
          day +
          '天的存檔，請輸入「' +
          (
            CONFIG.PROVIDERS[provider]
              ? CONFIG.PROVIDERS[provider].label
              : provider
          ) +
          '」的 API 金鑰以繼續';
      }

      console.warn(
        '[存檔系統] 偵測到本機存檔（第' +
        day +
        '天），但供應商「' +
        provider +
        '」缺少 API 金鑰，需要玩家手動補填。'
      );
    }
  } catch (e) {
    console.error('存檔讀取失敗', e);

    alert(
      '存檔讀取失敗，資料可能已損毀。若持續發生，建議使用「匯出/匯入存檔檔案」功能作為備份。'
    );
  }
}

function setupTestModeEntry() {
  if (!dom.setup.testModeBtn) return;
  if (CONFIG.TEST_MODE_ENABLED) {
    dom.setup.testModeBtn.classList.remove('hidden');
  } else {
    dom.setup.testModeBtn.classList.add('hidden');
  }
}

function applyCharacterSetup() {
  var finalGender =
    (dom.setup.charGenderInput && dom.setup.charGenderInput.value) ||
    pickRandom(RANDOM_CHAR_POOL.genders);

  var finalName = '你';

  var bgType = dom.setup.bgSelect
    ? dom.setup.bgSelect.value
    : 'combat_survivor';

  var picks = {};

  if (bgType === 'generalist') {
    var inputs = dom.setup.generalistDiv.querySelectorAll(
      '.gen-point-input'
    );

    for (var i = 0; i < inputs.length; i++) {
      var val = parseInt(inputs[i].value, 10) || 0;

      if (val > 0) {
        picks[inputs[i].dataset.stat] = val;
      }
    }
  }

  gameState.charSetup = {
    name: finalName,
    gender: finalGender,
    location:
      (dom.setup.charLocationInput &&
        dom.setup.charLocationInput.value.trim()) ||
      pickRandom(RANDOM_CHAR_POOL.locations),

    occupation:
      (dom.setup.charOccupationInput &&
        dom.setup.charOccupationInput.value.trim()) ||
      pickRandom(RANDOM_CHAR_POOL.occupations),
    backgroundType: bgType,
    generalistPicks: picks
  };

  gameState.skillProficiency = {
    combat: 0,
    shooting: 0,
    agility: 0,
    scouting: 0,
    medical: 0,
    negotiation: 0,
    searching: 0,
    mechanics: 0
  };

  if (typeof getBackgroundBonuses === 'function') {
    var bonuses = getBackgroundBonuses(bgType, picks);

    for (var k in bonuses) {
      if (bonuses[k] === 1) {
        gameState.skillProficiency[k] = 50;
      } else if (bonuses[k] === 2) {
        gameState.skillProficiency[k] = 150;
      } else if (bonuses[k] === 3) {
        gameState.skillProficiency[k] = 300;
      }
    }
  }

  return true;
}

function handleStartGame() {
  var provider = dom.setup.providerSelect.value;
  var key = dom.setup.apiKeyInput.value.trim();

  if (!key) {
    alert('請輸入你的 API 金鑰');
    return;
  }

  if (!applyCharacterSetup()) return;

  gameState.apiKey = key;
  gameState.provider = provider;
  gameState.isTestMode = false;

  localStorage.setItem(PROVIDER_KEY, provider);
  localStorage.setItem(APIKEY_KEY_PREFIX + provider, key);

  var mapIds = Object.keys(MAP_PRESETS);

  gameState.currentMapPresetId = pickRandom(mapIds);
  gameState.discoveredRegions = [];

  showGameScreen();
  requestNextTurn('__START__');
}

function handleStartTestMode() {
  if (!applyCharacterSetup()) return;

  gameState.isTestMode = true;
  gameState.testScriptIndex = 0;
  gameState.apiKey = '';

  var mapIds = Object.keys(MAP_PRESETS);

  gameState.currentMapPresetId = pickRandom(mapIds);
  gameState.discoveredRegions = [];

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
  dom.setup.screen.classList.add('hidden');
  dom.setup.gameScreen.classList.remove('hidden');
}

function loadRulesAndLore() {
  // 1. 讀取系統規則
  fetch('knowledge/ai_system_rules.txt').then(function (res) {
    return res.text();
  }).then(function (text) {
    gameState.rulesText = text;
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

    if (dom.menu.notionProxyInput) {
      dom.menu.notionProxyInput.value = cfg.proxyUrl || '';
    }

    if (dom.menu.notionDbInput) {
      dom.menu.notionDbInput.value = cfg.dbId || '';
    }

    CONFIG.NOTION_ENABLED = !!(cfg.proxyUrl && cfg.dbId);
    CONFIG.NOTION_PROXY_URL = cfg.proxyUrl || '';
    CONFIG.NOTION_DATABASE_ID = cfg.dbId || '';
  } catch (e) {
    console.warn('[Notion 設定] 讀取本機設定失敗：', e);
  }
}

document.addEventListener('DOMContentLoaded', init);
