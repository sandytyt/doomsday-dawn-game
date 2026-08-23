'use strict';

var STATE_KEY = 'doomsday_dawn_save_v1';
var APIKEY_KEY = 'doomsday_dawn_apikey';
var NOTION_KEY = 'doomsday_dawn_notion_config';

var gameState = {
  apiKey: '',
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
  resonanceValue: 0,
  dangerLevel: 'safe',
  weather: '晴',
  inventory: [],
  injuryStatus: 'none',
  isDead: false,
  recentTurns: [],
  summary: '',
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
var dom = {};

function cacheDom() {
  dom.setupScreen = document.getElementById('setup-screen');
  dom.gameScreen = document.getElementById('game-screen');
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
  dom.menuRestartBtn = document.getElementById('menu-restart-btn');
  dom.menuApikeyBtn = document.getElementById('menu-apikey-btn');
  dom.menuRulesBtn = document.getElementById('menu-rules-btn');
  dom.menuCloseBtn = document.getElementById('menu-close-btn');
  dom.notionSetupToggle = document.getElementById('notion-setup-toggle');
  dom.notionSetupFields = document.getElementById('notion-setup-fields');
  dom.notionProxyInput = document.getElementById('notion-proxy-input');
  dom.notionDbInput = document.getElementById('notion-db-input');
  dom.notionSaveBtn = document.getElementById('notion-save-btn');
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
}

var SYSTEM_LINES = [];
SYSTEM_LINES.push('你是《末日黎明：喪屍浩劫》的game master，壓抑寫實心理驚悚調性，禁止幽默或吐槽語氣。');
SYSTEM_LINES.push('嚴格遵守下方遊戲規則文檔的所有數值、機率與判定邏輯，該文檔已完整提供，不需要重複解釋規則本身，直接依規則生成敘事與數值變化。');
SYSTEM_LINES.push('NPC具備獨立人性，包含自保、背叛、恐懼下的過度反應，同時也可能有無償犧牲、隱瞞真相保護他人等正向行為，依規則文檔的NPC判定邏輯執行，不套用單一固定模式。');
SYSTEM_LINES.push('NPC的覺醒狀態於其背景設定階段獨立判定，不依賴玩家是否目擊，玩家可能遇見已完成覺醒的NPC。');
SYSTEM_LINES.push('每回合須依規則文檔管理玩家背包物品增減、負重狀態、武器耐久或彈藥、傷勢等級與死亡判定。');
SYSTEM_LINES.push('禁止重複使用相同場景開場句式或選項措辭，選項必須基於當前具體情境動態生成。');
SYSTEM_LINES.push('只回傳合法JSON物件，不包含JSON以外文字或Markdown符號。JSON結構：narrative為敘事文字字串；status_update物件包含time_advance_minutes、stamina_change、hunger_change、current_location、danger_level僅可為safe或warning或critical、weather、humanity_change、resonance_change、faction_trust_update、inventory_changes陣列每項包含name與quantity與action僅可為add或remove、injury_status僅可為none或minor或severe、special_event僅可為none或awakening或multi_awakening或death或rescued或其他事件代號、special_event_text；options陣列包含2到4個元素，每個元素含id、label、risk_hint。');
SYSTEM_LINES.push('一般對話或安全區域描寫150至200字，戰鬥探索重大事件描寫350至450字。');

var SYSTEM_INSTRUCTION = SYSTEM_LINES.join(' ');

function init() {
  cacheDom();
  bindEvents();
  loadRulesAndLore();
  loadNotionConfig();
  setupTestModeEntry();
  tryRestoreSavedGame();
}

function tryRestoreSavedGame() {
  var savedKey = localStorage.getItem(APIKEY_KEY);
  var savedStateRaw = localStorage.getItem(STATE_KEY);
  if (!savedStateRaw) return;

  try {
    var savedState = JSON.parse(savedStateRaw);
    if (savedState.isTestMode || savedKey) {
      gameState.apiKey = savedKey || '';
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

function loadRulesAndLore() {
  fetch('game_rules.txt').then(function (res) {
    return res.text();
  }).then(function (text) {
    gameState.rulesText = text;
    if (dom.rulesModalContent) dom.rulesModalContent.textContent = text;
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
  } catch (e) {}
}

function bindEvents() {
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
  dom.menuRestartBtn.addEventListener('click', handleRestart);
  dom.menuApikeyBtn.addEventListener('click', handleChangeApiKey);
  if (dom.menuRulesBtn) dom.menuRulesBtn.addEventListener('click', function () { toggleSideMenu(false); setTimeout(function () { toggleRulesModal(true); }, 200); });
  if (dom.rulesModalClose) dom.rulesModalClose.addEventListener('click', function () { toggleRulesModal(false); });
  dom.notionSetupToggle.addEventListener('click', function () { toggleCollapse(dom.notionSetupToggle, dom.notionSetupFields); });
  dom.notionSaveBtn.addEventListener('click', handleSaveNotionConfig);
  dom.optionsCollapseToggle.addEventListener('click', handleOptionsCollapseClick);
  dom.actionCollapsedBar.addEventListener('click', handleOptionsCollapseClick);
  dom.inventoryToggleBtn.addEventListener('click', handleInventoryToggleClick);
  dom.freeInputToggle.addEventListener('click', handleFreeInputToggleClick);
  dom.freeInputCancel.addEventListener('click', handleFreeInputCancelClick);
  dom.freeInputSend.addEventListener('click', handleFreeInputSend);
  dom.freeInputText.addEventListener('keypress', handleFreeInputKeypress);
  dom.eventModalClose.addEventListener('click', function () { dom.eventModal.classList.add('hidden'); });
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
  var key = dom.apiKeyInput.value.trim();
  if (!key) {
    alert('請輸入你的 Google Gemini API 金鑰');
    return;
  }
  gameState.apiKey = key;
  gameState.isTestMode = false;
  localStorage.setItem(APIKEY_KEY, key);
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
  callGeminiAPI(contextPayload).then(function (response) {
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

  var inventoryList = gameState.inventory.map(function (it) {
    return it.name + 'x' + it.quantity;
  }).join('、');

  var statusSnapshot = '當前狀態：第' + gameState.time.day + '天 ' + pad2(gameState.time.hour) + ':' + pad2(gameState.time.minute) +
    '，地點：' + gameState.location + '，體力：' + gameState.stamina + '/' + gameState.maxStamina +
    '，飢餓：' + gameState.hunger + '，人性值：' + gameState.humanity +
    '，共鳴值：' + gameState.resonanceValue + '，覺醒等級：' + gameState.awakeningLevel +
    '，危險等級：' + gameState.dangerLevel + '，傷勢：' + gameState.injuryStatus +
    '，背包負重：' + getInventoryLoadLevel() + '，持有物品：' + (inventoryList || '無') +
    '，回合數：' + gameState.turnCount;

  var recentParts = [];
  for (var i = 0; i < gameState.recentTurns.length; i++) {
    var t = gameState.recentTurns[i];
    recentParts.push('第' + t.turn + '回合劇情：' + t.narrative + ' 玩家行動：' + t.action);
  }
  var recentContext = recentParts.join(' ');
  var summaryContext = gameState.summary ? ('更早期摘要：' + gameState.summary) : '';

  return { userText: userText, statusSnapshot: statusSnapshot, recentContext: recentContext, summaryContext: summaryContext };
}

function callGeminiAPI(payload) {
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.MODEL_NAME + ':generateContent?key=' + gameState.apiKey;
  var fullPrompt = payload.statusSnapshot + ' ' + payload.summaryContext + ' 近期回合記錄： ' + (payload.recentContext || '尚無歷史這是開局') + ' 本回合玩家輸入： ' + payload.userText;

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

  if (status_update.special_event === 'death') {
    gameState.isDead = true;
    showDeathScreen(status_update.special_event_text || '你的旅程在此結束。');
    saveStateToLocal();
    return;
  } else if (status_update.special_event === 'rescued') {
    showEventModal('🩹', '瀕死獲救', status_update.special_event_text || '有人在最後一刻拉住了你。');
  } else if (status_update.special_event === 'awakening') {
    showEventModal('⚡', '異能覺醒', status_update.special_event_text || '你感覺到體內有某種力量正在覺醒');
  } else if (status_update.special_event === 'multi_awakening') {
    showEventModal('⚡⚡', '多重覺醒', status_update.special_event_text || '不只一種力量在你體內同時甦醒');
  } else if (status_update.special_event && status_update.special_event !== 'none') {
    showEventModal('❗', '重要事件', status_update.special_event_text || '發生了重要的事情');
  }

  renderOptions(options);
  renderAll();
  saveStateToLocal();
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
  if (update.injury_status) {
    gameState.injuryStatus = update.injury_status;
  }
  if (update.inventory_changes && update.inventory_changes.length) {
    applyInventoryChanges(update.inventory_changes);
  }
  if (update.faction_trust_update) {
    for (var faction in update.faction_trust_update) {
      if (Object.prototype.hasOwnProperty.call(update.faction_trust_update, faction)) {
        var delta = update.faction_trust_update[faction];
        gameState.factionTrust[faction] = (gameState.factionTrust[faction] || 0) + delta;
      }
    }
  }
  if (update.special_event === 'awakening') gameState.awakeningLevel += 1;
  if (update.special_event === 'multi_awakening') gameState.awakeningLevel += 1;
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
  dom.statAwakening.textContent = gameState.awakeningLevel > 0 ? ('Lv.' + gameState.awakeningLevel + ' ' + (gameState.awakeningAbility || '')) : '未覺醒';
  dom.statWeather.textContent = gameState.weather;
  if (dom.statHunger) dom.statHunger.textContent = gameState.hunger;

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

function handleImportFile(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (event) {
    try {
      var saveData = JSON.parse(event.target.result);
      restoreState(saveData.gameState);
      var key = dom.apiKeyInput.value.trim() || localStorage.getItem(APIKEY_KEY);
      if (gameState.isTestMode || key) {
        gameState.apiKey = key || '';
        if (key) localStorage.setItem(APIKEY_KEY, key);
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
    var newKey = prompt('請輸入新的 Google Gemini API 金鑰：', gameState.apiKey);
    if (newKey && newKey.trim()) {
      gameState.apiKey = newKey.trim();
      localStorage.setItem(APIKEY_KEY, gameState.apiKey);
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
}

document.addEventListener('DOMContentLoaded', init);
