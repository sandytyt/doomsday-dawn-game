'use strict';

var STATE_KEY = 'doomsday_dawn_save_v1';
var NAMED_SAVES_KEY = 'doomsday_dawn_named_saves';
var APIKEY_KEY_PREFIX = 'doomsday_dawn_apikey_';
var PROVIDER_KEY = 'doomsday_dawn_provider';
var NOTION_KEY = 'doomsday_dawn_notion_config';
var NOTION_SYNC_INTERVAL = 10;

var ABILITY_LEVEL_THRESHOLDS = [0, 50, 120, 210, 320, 450, 600, 770, 960, 1170];

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
  weather: '晴',
  inventory: [],
  injuryStatus: 'none',
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
  charSetup: { name: '', background: '', notes: '' }
};

var isWaitingForAI = false;
var statusExpanded = false;
var optionsMiniMode = false;
var inventoryExpanded = false;
var currentSaveTab = 'local';
var notionSavesCache = [];
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
  dom.charNameInput = document.getElementById('char-name-input');
  dom.charBackgroundInput = document.getElementById('char-background-input');
  dom.charNotesInput = document.getElementById('char-notes-input');
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
  dom.inventoryToggleBtn = document.getElementById('inventory-toggle-btn');
  dom.inventoryPanel = document.getElementById('inventory-panel');
  dom.inventoryList = document.getElementById('inventory-list');
  dom.inventoryLoadTag = document.getElementById('inventory-load-tag');
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
  dom.rulesModal = document.getElementById('rules-modal');
  dom.rulesModalContent = document.getElementById('rules-modal-content');
  dom.rulesModalClose = document.getElementById('rules-modal-close');
  dom.deathScreen = document.getElementById('death-screen');
  dom.namedSaveModal = document.getElementById('named-save-modal');
  dom.namedSaveList = document.getElementById('named-save-list');
  dom.namedSaveClose = document.getElementById('named-save-close');
  dom.saveTabLocal = document.getElementById('save-tab-local');
  dom.saveTabNotion = document.getElementById('save-tab-notion');
}

var SYSTEM_LINES = [];
SYSTEM_LINES.push('你是《末日黎明：喪屍浩劫》的game master，壓抑寫實心理驚悚調性，禁止幽默或吐槽語氣。');
SYSTEM_LINES.push('嚴格遵守下方遊戲規則文檔的所有數值、機率與判定邏輯，該文檔已完整提供，不需要重複解釋規則本身，直接依規則生成敘事與數值變化。');
SYSTEM_LINES.push('NPC具備獨立人性，包含自保、背叛、恐懼下的過度反應，同時也可能有無償犧牲、隱瞞真相保護他人等正向行為，依規則文檔的NPC判定邏輯執行，不套用單一固定模式。');
SYSTEM_LINES.push('NPC與喪屍的覺醒或進化狀態於背景設定階段獨立判定，不依賴玩家是否目擊或介入。已登記的NPC與安全區即使主角長期不在場，仍會依世界記憶段落的既有狀態持續發展，不會停滯等待主角出現才變化，你可透過傳聞、路人轉述、環境線索等方式，將背景已發生的變化間接告知主角。');
SYSTEM_LINES.push('若玩家有隨行NPC加入隊伍，須依規則文檔管理隨行人數上限、資源分攤與隨行NPC死亡判定。');
SYSTEM_LINES.push('每回合須依規則文檔管理玩家背包物品增減、負重狀態、武器耐久或彈藥、傷勢等級、死亡判定，以及晶核掉落與能力熟練度變化。');
SYSTEM_LINES.push('禁止重複使用相同場景開場句式或選項措辭，選項必須基於當前具體情境動態生成。');
SYSTEM_LINES.push('提示詞中可能包含「長期世界記憶」段落，記載已知安全區、關鍵NPC、勢力歷史與世界重大事件，你必須將其視為已確立的事實持續納入敘事考量，不可忽略、不可與其矛盾。');
SYSTEM_LINES.push('world_memory_update欄位僅在本回合敘事確實發生下列四類事件之一時才填寫對應子欄位，其餘情況全部留空物件：new_safe_zone（玩家新建立安全區，含name、location、population、facilities陣列）、safe_zone_update（既有安全區的人口或設施異動，含name、population、facilities_add陣列、facilities_remove陣列、faction_relation_note）、npc_major_event（NPC加入、死亡、覺醒、能力習得或關係質變，含name、ability、note、status僅可為alive或dead或missing或unknown）、faction_shift（勢力關係質變如轉為敵對或同盟，非小幅信任度波動，含faction、eventText）、world_landmark（地圖級重大變化如城市淪陷路線打通，含eventText）。');
SYSTEM_LINES.push('若使用者輸入中出現「請檢查背景演化」的指示，你必須額外填寫background_evolution欄位，基於提示詞中已提供的長期世界記憶段落，獨立推演已登記的NPC、安全區、勢力在主角不在場期間可能發生的變化，結構為npc_updates陣列每項含name與note與可選status與可選ability、safe_zone_updates陣列每項含name與note、faction_updates陣列每項含faction與eventText；若沒有明確要求則此欄位留空物件。');
SYSTEM_LINES.push('只回傳合法JSON物件，不包含JSON以外文字或Markdown符號。JSON結構：...；options陣列包含2到4個元素，每個元素含id、label、risk_hint，其中id欄位只能是大寫字母A、B、C、D，依陣列順序遞增，不可使用其他任何格式如opt_1或數字。');
SYSTEM_LINES.push('一般對話或安全區域描寫150至200字，戰鬥探索重大事件描寫350至450字。');

var SYSTEM_INSTRUCTION = SYSTEM_LINES.join(' ');

function init() {
  cacheDom();
  populateProviderSelect();
  bindEvents();
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
  fetch('game_rules.txt').then(function (res) {
    return res.text();
  }).then(function (text) {
    gameState.rulesText = text;
    if (dom.rulesModalContent) dom.rulesModalContent.innerHTML = simpleMarkdownToHtml(text);
  }).catch(function () {
    gameState.rulesText = '';
  });

  fetch('knowledge/virus_lore.txt').then(function (res) {
    return res.text();
  }).then(function (text) {
    gameState.loreText = text;
  }).catch(function () {
    gameState.loreText = '';
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
  if (dom.rulesLinkBtn) dom.rulesLinkBtn.addEventListener('click', function () { toggleRulesModal(true); });
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
  if (dom.menuRulesBtn) dom.menuRulesBtn.addEventListener('click', function () { toggleSideMenu(false); setTimeout(function () { toggleRulesModal(true); }, 200); });
  if (dom.rulesModalClose) dom.rulesModalClose.addEventListener('click', function () { toggleRulesModal(false); });
  dom.notionSetupToggle.addEventListener('click', function () { toggleCollapse(dom.notionSetupToggle, dom.notionSetupFields); });
  dom.notionSaveBtn.addEventListener('click', handleSaveNotionConfig);
  dom.notionSyncNowBtn.addEventListener('click', handleNotionSyncNow);
  dom.optionsCollapseToggle.addEventListener('click', handleOptionsCollapseClick);
  dom.actionCollapsedBar.addEventListener('click', handleOptionsCollapseClick);
  dom.inventoryToggleBtn.addEventListener('click', handleInventoryToggleClick);
  dom.freeInputToggle.addEventListener('click', handleFreeInputToggleClick);
  dom.freeInputCancel.addEventListener('click', handleFreeInputCancelClick);
  dom.freeInputSend.addEventListener('click', handleFreeInputSend);
  dom.freeInputText.addEventListener('keypress', handleFreeInputKeypress);
  dom.eventModalClose.addEventListener('click', function () { dom.eventModal.classList.add('hidden'); });
}

function handleProviderChange() {
  var provider = dom.providerSelect.value;
  localStorage.setItem(PROVIDER_KEY, provider);
  var savedKey = localStorage.getItem(APIKEY_KEY_PREFIX + provider);
  dom.apiKeyInput.value = savedKey || '';
}

function toggleRulesModal(show) {
  if (!dom.rulesModal) return;
  dom.rulesModal.classList.toggle('hidden', !show);
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

function handleInventoryToggleClick() {
  inventoryExpanded = !inventoryExpanded;
  dom.inventoryPanel.classList.toggle('hidden', !inventoryExpanded);
  dom.inventoryToggleBtn.classList.toggle('expanded', inventoryExpanded);
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

function handleStartGame() {
  var provider = dom.providerSelect.value;
  var key = dom.apiKeyInput.value.trim();
  if (!key) {
    alert('請輸入你的 API 金鑰');
    return;
  }
  gameState.apiKey = key;
  gameState.provider = provider;
  gameState.isTestMode = false;
  localStorage.setItem(PROVIDER_KEY, provider);
  localStorage.setItem(APIKEY_KEY_PREFIX + provider, key);
  gameState.charSetup = {
    name: dom.charNameInput.value.trim(),
    background: dom.charBackgroundInput.value.trim(),
    notes: dom.charNotesInput.value.trim()
  };
  showGameScreen();
  requestNextTurn('__START__');
}

function handleStartTestMode() {
  gameState.isTestMode = true;
  gameState.testScriptIndex = 0;
  gameState.apiKey = '';
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
    appendPlayerAction(playerAction);
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

function getInventoryLoadLevel() {
  var count = gameState.inventory.length;
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
    var hasCustom = c.name || c.background || c.notes;
    if (hasCustom) {
      userText = '請開始遊戲，生成開局場景。玩家提供角色參考設定，請自然融入敘事不要生硬照搬。姓名：' + (c.name || '未指定') + '。背景：' + (c.background || '未指定') + '。其他細節：' + (c.notes || '無') + '。不要詢問玩家姓名或性別。';
    } else {
      userText = '請開始遊戲。生成開局場景，不要詢問玩家姓名或性別，直接讓玩家以第一人稱進入末日情境。';
    }
  } else {
    userText = '玩家選擇的行動：' + playerAction;
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
    '，地點：' + gameState.location + '，體力：' + gameState.stamina + '/' + gameState.maxStamina +
    '，飢餓：' + gameState.hunger + '，人性值：' + gameState.humanity +
    '，共鳴值：' + gameState.resonanceValue + '，覺醒等級：' + gameState.awakeningLevel +
    '，能力熟練度：' + gameState.abilityExp + '/' + getAbilityExpNeeded(gameState.awakeningLevel) +
    '，危險等級：' + gameState.dangerLevel + '，傷勢：' + gameState.injuryStatus +
    '，背包負重：' + getInventoryLoadLevel() + '，持有物品：' + (inventoryList || '無') +
    '，隨行隊員：' + (companionList || '無') +
    '，回合數：' + gameState.turnCount;

  var recentParts = [];
  for (var i = 0; i < gameState.recentTurns.length; i++) {
    var t = gameState.recentTurns[i];
    recentParts.push('第' + t.turn + '回合劇情：' + t.narrative + ' 玩家行動：' + t.action);
  }
  var recentContext = recentParts.join(' ');
  var worldMemoryContext = WorldMemory.buildWorldMemoryPrompt(gameState.worldMemory);

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
        { text: SYSTEM_INSTRUCTION },
        { text: '遊戲規則文檔： ' + gameState.rulesText },
        { text: '世界觀密檔參考資料： ' + gameState.loreText }
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
  var systemText = SYSTEM_INSTRUCTION + ' 遊戲規則文檔： ' + gameState.rulesText + ' 世界觀密檔參考資料： ' + gameState.loreText;

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

  if (response.world_memory_update) {
    gameState.worldMemory = WorldMemory.applyWorldMemoryUpdate(gameState.worldMemory, response.world_memory_update, gameState.turnCount);
  }
  if (response.background_evolution) {
    gameState.worldMemory = WorldMemory.applyBackgroundEvolution(gameState.worldMemory, response.background_evolution, gameState.turnCount);
  }

  if (status_update.special_event === 'death') {
    gameState.isDead = true;
    showDeathScreen(status_update.special_event_text || '你的旅程在此結束。');
    saveStateToLocal();
    maybeSyncToNotion();
    return;
  } else if (status_update.special_event === 'rescued') {
    showEventModal('🩹', '瀕死獲救', status_update.special_event_text || '有人在最後一刻拉住了你。');
  } else if (status_update.special_event === 'awakening') {
    showEventModal('⚡', '異能覺醒', status_update.special_event_text || '你感覺到體內有某種力量正在覺醒');
  } else if (status_update.special_event === 'multi_awakening') {
    showEventModal('⚡⚡', '多重覺醒', status_update.special_event_text || '不只一種力量在你體內同時甦醒');
  } else if (status_update.special_event === 'level_up') {
    showEventModal('🔺', '能力進化', status_update.special_event_text || '你的能力形態出現了變化');
  } else if (status_update.special_event && status_update.special_event !== 'none') {
    showEventModal('❗', '重要事件', status_update.special_event_text || '發生了重要的事情');
  }

  renderOptions(options);
  renderAll();
  saveStateToLocal();
  maybeSyncToNotion();
}

function maybeSyncToNotion() {
  if (gameState.turnCount % NOTION_SYNC_INTERVAL === 0) {
    syncToNotion(true);
  }
}

function buildNotionSyncBody() {
  var injuryOption = gameState.injuryStatus || 'none';
  var lastNarrative = gameState.recentTurns.length ? gameState.recentTurns[gameState.recentTurns.length - 1].narrative : '';
  var briefSummary = lastNarrative.length > 450 ? lastNarrative.slice(0, 450) + '…' : lastNarrative;

  return {
    parent: { database_id: CONFIG.NOTION_DATABASE_ID },
    properties: {
      '存檔名稱': { title: [{ text: { content: '同步-第' + gameState.time.day + '天-' + new Date().toLocaleTimeString() } }] },
      '角色姓名': { rich_text: [{ text: { content: gameState.charSetup.name || '未命名倖存者' } }] },
      '遊戲天數': { number: gameState.time.day },
      '體力': { number: gameState.stamina },
      '當前地點': { rich_text: [{ text: { content: gameState.location } }] },
      '傷勢': { select: { name: injuryOption } },
      '覺醒等級': { number: gameState.awakeningLevel },
      '危險等級': { select: { name: gameState.dangerLevel } },
      '人性值': { number: gameState.humanity },
      '飢餓值': { number: gameState.hunger },
      '共鳴值': { number: gameState.resonanceValue },
      '背包物品': { rich_text: [{ text: { content: gameState.inventory.map(function (it) { return it.name + 'x' + it.quantity; }).join('、') || '無' } }] },
      '隨行隊員': { rich_text: [{ text: { content: gameState.companions.join('、') || '無' } }] },
      '前文提要': { rich_text: [{ text: { content: briefSummary || '無' } }] },
      '更新時間': { date: { start: new Date().toISOString() } },
      '存檔JSON': { rich_text: [{ text: { content: JSON.stringify(gameState).slice(0, 1900) } }] }
    }
  };
}

function syncToNotion(silent) {
  if (!CONFIG.NOTION_ENABLED || !CONFIG.NOTION_PROXY_URL || !CONFIG.NOTION_DATABASE_ID) {
    if (!silent) alert('請先填入並儲存 Notion 轉發網址與 Database ID');
    return;
  }
  if (gameState.isTestMode && silent) return;

  var body = buildNotionSyncBody();

  fetch(CONFIG.NOTION_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(function (res) {
    return res.json().then(function (data) {
      return { ok: res.ok, data: data };
    });
  }).then(function (result) {
    if (!silent) {
      if (result.ok) {
        alert('同步成功！請至 Notion 檢查是否新增存檔記錄。');
      } else {
        alert('同步失敗，錯誤內容：' + JSON.stringify(result.data).slice(0, 300));
      }
    }
    console.log('Notion同步結果:', result);
  }).catch(function (e) {
    console.warn('Notion 同步失敗:', e);
    if (!silent) alert('同步請求失敗：' + e.message);
  });
}

function handleNotionSyncNow() {
  syncToNotion(false);
}

/* ---------- 存檔管理彈窗：本機/Notion雙標籤 ---------- */

function handleOpenSaveManager() {
  toggleSideMenu(false);
  currentSaveTab = 'local';
  updateSaveTabUI();
  renderLocalSaveList();
  dom.namedSaveModal.classList.remove('hidden');
}

function switchSaveTab(tab) {
  currentSaveTab = tab;
  updateSaveTabUI();
  if (tab === 'local') {
    renderLocalSaveList();
  } else {
    renderNotionSaveList();
  }
}

function updateSaveTabUI() {
  dom.saveTabLocal.classList.toggle('active', currentSaveTab === 'local');
  dom.saveTabNotion.classList.toggle('active', currentSaveTab === 'notion');
}

function renderLocalSaveList() {
  var saves = getNamedSaves();
  var names = Object.keys(saves);
  dom.namedSaveList.innerHTML = '';
  if (names.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'named-save-empty';
    emptyEl.textContent = '目前沒有任何命名存檔';
    dom.namedSaveList.appendChild(emptyEl);
    return;
  }
  names.forEach(function (name) {
    var row = document.createElement('div');
    row.className = 'named-save-row';
    var info = document.createElement('div');
    info.className = 'named-save-info';
    info.innerHTML = '<span class="named-save-name">' + escapeHtml(name) + '</span><span class="named-save-date">' + saves[name].savedAt.slice(0, 16).replace('T', ' ') + '</span>';
    var loadBtn = document.createElement('button');
    loadBtn.className = 'btn-secondary named-save-load-btn';
    loadBtn.type = 'button';
    loadBtn.textContent = '讀取';
    loadBtn.addEventListener('click', function () { handleLoadNamedSave(name); });
    var delBtn = document.createElement('button');
    delBtn.className = 'icon-btn';
    delBtn.type = 'button';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', function () { handleDeleteNamedSave(name); });
    row.appendChild(info);
    row.appendChild(loadBtn);
    row.appendChild(delBtn);
    dom.namedSaveList.appendChild(row);
  });
}

function renderNotionSaveList() {
  dom.namedSaveList.innerHTML = '';
  if (!CONFIG.NOTION_ENABLED || !CONFIG.NOTION_PROXY_URL || !CONFIG.NOTION_DATABASE_ID) {
    var noConfigEl = document.createElement('div');
    noConfigEl.className = 'named-save-empty';
    noConfigEl.textContent = '尚未設定 Notion 雲端同步，請先於選單中儲存轉發網址與 Database ID';
    dom.namedSaveList.appendChild(noConfigEl);
    return;
  }

  var loadingEl = document.createElement('div');
  loadingEl.className = 'named-save-empty';
  loadingEl.textContent = '讀取中…';
  dom.namedSaveList.appendChild(loadingEl);

  var queryUrl = CONFIG.NOTION_PROXY_URL.replace(/\/$/, '') + '/query';

  fetch(queryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database_id: CONFIG.NOTION_DATABASE_ID, page_size: 50 })
  }).then(function (res) {
    return res.json().then(function (data) {
      return { ok: res.ok, data: data };
    });
  }).then(function (result) {
    if (currentSaveTab !== 'notion') return;
    dom.namedSaveList.innerHTML = '';
    if (!result.ok || !result.data.results) {
      var errEl = document.createElement('div');
      errEl.className = 'named-save-empty';
      errEl.textContent = '讀取失敗：' + JSON.stringify(result.data).slice(0, 200);
      dom.namedSaveList.appendChild(errEl);
      return;
    }
    notionSavesCache = result.data.results;
    if (notionSavesCache.length === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'named-save-empty';
      emptyEl.textContent = 'Notion資料庫中尚無同步記錄';
      dom.namedSaveList.appendChild(emptyEl);
      return;
    }
    notionSavesCache.forEach(function (page, idx) {
      var props = page.properties || {};
      var titleArr = props['存檔名稱'] && props['存檔名稱'].title;
      var titleText = (titleArr && titleArr[0] && titleArr[0].plain_text) || '未命名同步記錄';
      var dateText = (props['更新時間'] && props['更新時間'].date && props['更新時間'].date.start) || '';
      var dayNum = (props['遊戲天數'] && props['遊戲天數'].number) || '?';
      var locText = (props['當前地點'] && props['當前地點'].rich_text && props['當前地點'].rich_text[0] && props['當前地點'].rich_text[0].plain_text) || '';

      var row = document.createElement('div');
      row.className = 'named-save-row';
      var info = document.createElement('div');
      info.className = 'named-save-info';
      info.innerHTML = '<span class="named-save-name">' + escapeHtml(titleText) + '（第' + dayNum + '天 ' + escapeHtml(locText) + '）</span><span class="named-save-date">' + escapeHtml(dateText.slice(0, 16).replace('T', ' ')) + '</span>';
      var loadBtn = document.createElement('button');
      loadBtn.className = 'btn-secondary named-save-load-btn';
      loadBtn.type = 'button';
      loadBtn.textContent = '讀取';
      loadBtn.addEventListener('click', function () { handleLoadNotionSave(idx); });
      row.appendChild(info);
      row.appendChild(loadBtn);
      dom.namedSaveList.appendChild(row);
    });
  }).catch(function (e) {
    if (currentSaveTab !== 'notion') return;
    dom.namedSaveList.innerHTML = '';
    var errEl = document.createElement('div');
    errEl.className = 'named-save-empty';
    errEl.textContent = '讀取請求失敗：' + e.message;
    dom.namedSaveList.appendChild(errEl);
  });
}

function handleLoadNotionSave(idx) {
  var page = notionSavesCache[idx];
  if (!page) return;
  var props = page.properties || {};
  var jsonArr = props['存檔JSON'] && props['存檔JSON'].rich_text;
  var jsonText = jsonArr && jsonArr.map(function (t) { return t.plain_text; }).join('');
  if (!jsonText) {
    alert('這筆記錄沒有可讀取的存檔內容');
    return;
  }
  try {
    var parsedState = JSON.parse(jsonText);
    if (!confirm('讀取這筆Notion存檔將覆蓋目前進度，確定繼續嗎？（此存檔JSON因Notion欄位長度限制可能被截斷，若讀取失敗請改用完整匯出檔案）')) return;
    restoreState(parsedState);
    var key = localStorage.getItem(APIKEY_KEY_PREFIX + gameState.provider);
    if (gameState.isTestMode || key) {
      gameState.apiKey = key || '';
      showGameScreen();
      rebuildNarrativeFromHistory();
      renderOptions(gameState.lastOptions);
      renderAll();
      saveStateToLocal();
      dom.namedSaveModal.classList.add('hidden');
    } else {
      alert('請先在開局畫面輸入 API 金鑰');
    }
  } catch (e) {
    alert('這筆Notion存檔JSON內容不完整或格式錯誤，可能因欄位長度限制被截斷，無法讀取。建議改用「匯出/匯入存檔檔案」功能作為完整備份。');
  }
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
  if (update.current_location) gameState.location = update.current_location;
  if (update.danger_level) gameState.dangerLevel = update.danger_level;
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
  }
  if (update.inventory_changes && update.inventory_changes.length) {
    applyInventoryChanges(update.inventory_changes);
  }
  if (update.companion_changes && update.companion_changes.length) {
    applyCompanionChanges(update.companion_changes);
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
    } else if (change.action === 'leave' || change.action === 'die') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
    }
  }
}

function applyAbilityExpChange(delta) {
  if (gameState.awakeningLevel <= 0) return;
  gameState.abilityExp += delta;
  var needed = getAbilityExpNeeded(gameState.awakeningLevel);
  while (gameState.awakeningLevel < 10 && gameState.abilityExp >= needed) {
    gameState.abilityExp -= needed;
    gameState.awakeningLevel += 1;
    needed = getAbilityExpNeeded(gameState.awakeningLevel);
  }
}

function applyInventoryChanges(changes) {
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    var existing = null;
    for (var j = 0; j < gameState.inventory.length; j++) {
      if (gameState.inventory[j].name === change.name) {
        existing = gameState.inventory[j];
        break;
      }
    }
    if (change.action === 'remove') {
      if (existing) {
        existing.quantity -= (change.quantity || 1);
        if (existing.quantity <= 0) {
          gameState.inventory = gameState.inventory.filter(function (it) { return it.name !== change.name; });
        }
      }
    } else {
      if (existing) {
        existing.quantity += (change.quantity || 1);
      } else {
        gameState.inventory.push({ name: change.name, quantity: change.quantity || 1 });
      }
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
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
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
  dom.statAwakening.textContent = gameState.awakeningLevel > 0
    ? ('Lv.' + gameState.awakeningLevel + ' ' + (gameState.awakeningAbility || '') + '（' + gameState.abilityExp + '/' + getAbilityExpNeeded(gameState.awakeningLevel) + '）')
    : '未覺醒';
  dom.statWeather.textContent = gameState.weather;
  if (dom.statHunger) dom.statHunger.textContent = gameState.hunger;
  if (dom.statCompanions) dom.statCompanions.textContent = gameState.companions.length ? gameState.companions.join('、') : '無';

  var factionEntries = [];
  for (var k in gameState.factionTrust) {
    if (Object.prototype.hasOwnProperty.call(gameState.factionTrust, k)) {
      factionEntries.push(k + ':' + gameState.factionTrust[k]);
    }
  }
  dom.statFaction.textContent = factionEntries.length ? factionEntries.join(' / ') : '無接觸';

  renderInventory();
}

function renderInventory() {
  dom.inventoryList.innerHTML = '';
  if (gameState.inventory.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'inventory-empty';
    emptyEl.textContent = '背包空無一物';
    dom.inventoryList.appendChild(emptyEl);
  } else {
    for (var i = 0; i < gameState.inventory.length; i++) {
      var it = gameState.inventory[i];
      var row = document.createElement('div');
      row.className = 'inventory-item';
      row.textContent = it.name + ' x' + it.quantity;
      dom.inventoryList.appendChild(row);
    }
  }
  var loadLevel = getInventoryLoadLevel();
  dom.inventoryLoadTag.textContent = loadLevel;
  dom.inventoryLoadTag.className = 'inventory-load-tag load-' + loadLevel;
  dom.inventoryToggleBtn.querySelector('span').textContent = '🎒 背包（' + gameState.inventory.length + '）';
}

function appendGMText(text) {
  var el = document.createElement('div');
  el.className = 'narrative-entry gm-text';
  el.textContent = text;
  dom.narrativeContent.appendChild(el);
  scrollToBottom();
}

function appendPlayerAction(text) {
  var el = document.createElement('div');
  el.className = 'narrative-entry player-action';
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
  dom.loadingOverlay.classList.toggle('hidden', !show);
  if (show) scrollToBottom();
}

function renderOptions(options) {
  gameState.lastOptions = options || [];
  dom.optionsContainer.innerHTML = '';
  var list = options || [];
  for (var i = 0; i < list.length; i++) {
    var opt = list[i];
    var btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.type = 'button';
    var riskHtml = opt.risk_hint ? ('<span class="option-risk">' + escapeHtml(opt.risk_hint) + '</span>') : '';
    btn.innerHTML = '<span class="option-id">' + opt.id + '.</span>' + escapeHtml(opt.label) + riskHtml;
    btn.addEventListener('click', makeOptionClickHandler(opt));
    dom.optionsContainer.appendChild(btn);
  }
  dom.optionsCollapseToggle.classList.toggle('hidden', list.length === 0);
  applyOptionsDisplayMode();
}

function makeOptionClickHandler(opt) {
  return function () {
    if (opt.id === 'RETRY') {
      requestNextTurn(gameState.lastPlayerAction || '__START__');
    } else {
      requestNextTurn(opt.label);
    }
  };
}

function applyOptionsDisplayMode() {
  dom.optionsContainer.classList.toggle('hidden', optionsMiniMode);
  dom.freeInputToggle.classList.toggle('hidden', optionsMiniMode);
  dom.freeInputRow.classList.add('hidden');
  dom.optionsCollapseToggle.classList.toggle('hidden', optionsMiniMode);
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

function handleExportSave() {
  var saveData = { version: 1, exportedAt: new Date().toISOString(), gameState: gameState };
  var blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'doomsday-save-day' + gameState.time.day + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toggleSideMenu(false);
}

function getNamedSaves() {
  try {
    return JSON.parse(localStorage.getItem(NAMED_SAVES_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function handleOpenNamedSave() {
  toggleSideMenu(false);
  var name = prompt('請輸入此存檔的名稱（例如：維爾赫姆市-覺醒前）：');
  if (!name || !name.trim()) return;
  var saves = getNamedSaves();
  saves[name.trim()] = { savedAt: new Date().toISOString(), gameState: gameState };
  localStorage.setItem(NAMED_SAVES_KEY, JSON.stringify(saves));
  alert('已儲存命名存檔：' + name.trim());
}

function handleLoadNamedSave(name) {
  var saves = getNamedSaves();
  var entry = saves[name];
  if (!entry) return;
  restoreState(entry.gameState);
  var key = localStorage.getItem(APIKEY_KEY_PREFIX + gameState.provider);
  if (gameState.isTestMode || key) {
    gameState.apiKey = key || '';
    showGameScreen();
    rebuildNarrativeFromHistory();
    renderOptions(gameState.lastOptions);
    renderAll();
    saveStateToLocal();
    dom.namedSaveModal.classList.add('hidden');
  } else {
    alert('請先在開局畫面輸入 API 金鑰');
  }
}

function handleDeleteNamedSave(name) {
  if (!confirm('刪除命名存檔「' + name + '」？')) return;
  var saves = getNamedSaves();
  delete saves[name];
  localStorage.setItem(NAMED_SAVES_KEY, JSON.stringify(saves));
  renderLocalSaveList();
}

function handleImportFile(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (event) {
    try {
      var saveData = JSON.parse(event.target.result);
      restoreState(saveData.gameState);
      var key = dom.apiKeyInput.value.trim() || localStorage.getItem(APIKEY_KEY_PREFIX + gameState.provider);
      if (gameState.isTestMode || key) {
        gameState.apiKey = key || '';
        if (key) localStorage.setItem(APIKEY_KEY_PREFIX + gameState.provider, key);
        showGameScreen();
        rebuildNarrativeFromHistory();
        renderOptions(gameState.lastOptions);
        renderAll();
        saveStateToLocal();
      } else {
        alert('請先在開局畫面輸入 API 金鑰，再匯入存檔');
      }
    } catch (err) {
      alert('存檔檔案格式錯誤，無法匯入');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function rebuildNarrativeFromHistory() {
  dom.narrativeContent.innerHTML = '';
  for (var i = 0; i < gameState.recentTurns.length; i++) {
    var t = gameState.recentTurns[i];
    if (t.action && t.action !== '(開局)') {
      var actionEl = document.createElement('div');
      actionEl.className = 'narrative-entry player-action';
      actionEl.textContent = '▸ ' + t.action;
      dom.narrativeContent.appendChild(actionEl);
    }
    var gmEl = document.createElement('div');
    gmEl.className = 'narrative-entry gm-text';
    gmEl.textContent = t.narrative;
    dom.narrativeContent.appendChild(gmEl);
  }
  if (gameState.isDead) {
    dom.deathScreen.classList.remove('hidden');
  }
  scrollToBottom();
}

function handleRestart() {
  toggleSideMenu(false);
  setTimeout(function () {
    if (!confirm('確定要清空所有進度，重新開始嗎？此操作無法復原。')) return;
    localStorage.removeItem(STATE_KEY);
    location.reload();
  }, 200);
}

function handleChangeApiKey() {
  toggleSideMenu(false);
  setTimeout(function () {
    var newKey = prompt('請輸入新的 API 金鑰：', gameState.apiKey);
    if (newKey && newKey.trim()) {
      gameState.apiKey = newKey.trim();
      localStorage.setItem(APIKEY_KEY_PREFIX + gameState.provider, gameState.apiKey);
    }
  }, 200);
}

function handleSaveNotionConfig() {
  var proxyUrl = dom.notionProxyInput.value.trim();
  var dbId = dom.notionDbInput.value.trim();
  localStorage.setItem(NOTION_KEY, JSON.stringify({ proxyUrl: proxyUrl, dbId: dbId }));
  CONFIG.NOTION_ENABLED = !!(proxyUrl && dbId);
  CONFIG.NOTION_PROXY_URL = proxyUrl;
  CONFIG.NOTION_DATABASE_ID = dbId;
  alert('Notion 設定已儲存於本機。');
}

function saveStateToLocal() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(gameState));
  } catch (e) {}
}

function restoreState(saved) {
  gameState = Object.assign({}, gameState, saved);
  gameState.worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
}

document.addEventListener('DOMContentLoaded', init);
