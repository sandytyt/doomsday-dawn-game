'use strict';

const STATE_KEY = 'doomsday_dawn_save_v1';
const APIKEY_KEY = 'doomsday_dawn_apikey';
const NOTION_KEY = 'doomsday_dawn_notion_config';

let gameState = {
  apiKey: '',
  isTestMode: false,
  testScriptIndex: 0,
  time: { day: 1, hour: 6, minute: 0 },
  location: '未知地點',
  stamina: CONFIG.INITIAL_STAMINA,
  maxStamina: CONFIG.INITIAL_STAMINA,
  humanity: 100,
  factionTrust: {},
  awakeningLevel: 0,
  awakeningAbility: null,
  dangerLevel: 'safe',
  weather: '晴',
  recentTurns: [],
  summary: '',
  turnCount: 0,
  lastOptions: [],
  lastPlayerAction: '',
  loreText: '',
  charSetup: { name: '', background: '', notes: '' }
};

let isWaitingForAI = false;
let statusExpanded = false;
let optionsMiniMode = false;

const dom = {
  setupScreen: document.getElementById('setup-screen'),
  gameScreen: document.getElementById('game-screen'),
  apiKeyInput: document.getElementById('api-key-input'),
  startBtn: document.getElementById('start-game-btn'),
  testModeBtn: document.getElementById('test-mode-btn'),
  importSaveBtn: document.getElementById('import-save-btn'),
  importSaveFile: document.getElementById('import-save-file'),
  charSetupToggle: document.getElementById('char-setup-toggle'),
  charSetupFields: document.getElementById('char-setup-fields'),
  charNameInput: document.getElementById('char-name-input'),
  charBackgroundInput: document.getElementById('char-background-input'),
  charNotesInput: document.getElementById('char-notes-input'),
  statusTime: document.getElementById('status-time'),
  statusLocation: document.getElementById('status-location'),
  statusExpandBtn: document.getElementById('status-expand-btn'),
  staminaFill: document.getElementById('stamina-bar-fill'),
  staminaValue: document.getElementById('stamina-value'),
  statusDanger: document.getElementById('status-danger'),
  menuToggleBtn: document.getElementById('menu-toggle-btn'),
  statusPanelFull: document.getElementById('status-panel-full'),
  statHumanity: document.getElementById('stat-humanity'),
  statFaction: document.getElementById('stat-faction'),
  statAwakening: document.getElementById('stat-awakening'),
  statWeather: document.getElementById('stat-weather'),
  narrativeLog: document.getElementById('narrative-log'),
  narrativeContent: document.getElementById('narrative-content'),
  typingIndicator: document.getElementById('typing-indicator'),
  optionsCollapseToggle: document.getElementById('options-collapse-toggle'),
  optionsContainer: document.getElementById('options-container'),
  freeInputRow: document.getElementById('free-input-row'),
  freeInputText: document.getElementById('free-input-text'),
  freeInputSend: document.getElementById('free-input-send'),
  freeInputCancel: document.getElementById('free-input-cancel'),
  freeInputToggle: document.getElementById('free-input-toggle'),
  sideMenu: document.getElementById('side-menu'),
  sideMenuBackdrop: document.getElementById('side-menu-backdrop'),
  menuExportBtn: document.getElementById('menu-export-btn'),
  menuImportBtn: document.getElementById('menu-import-btn'),
  menuRestartBtn: document.getElementById('menu-restart-btn'),
  menuApikeyBtn: document.getElementById('menu-apikey-btn'),
  menuCloseBtn: document.getElementById('menu-close-btn'),
  notionSetupToggle: document.getElementById('notion-setup-toggle'),
  notionSetupFields: document.getElementById('notion-setup-fields'),
  notionProxyInput: document.getElementById('notion-proxy-input'),
  notionDbInput: document.getElementById('notion-db-input'),
  notionSaveBtn: document.getElementById('notion-save-btn'),
  eventModal: document.getElementById('event-modal'),
  eventModalIcon: document.getElementById('event-modal-icon'),
  eventModalTitle: document.getElementById('event-modal-title'),
  eventModalText: document.getElementById('event-modal-text'),
  eventModalClose: document.getElementById('event-modal-close'),
  loadingOverlay: document.getElementById('loading-overlay')
};

const SYSTEM_INSTRUCTION = [
  '你是一位嚴謹、壓抑、寫實的末日生存TRPG game master，',
  '負責運行《末日黎明：喪屍浩劫》。你必須嚴格遵守以下規則：',
  '',
  '【核心調性】',
  '全程保持壓抑、寫實、心理驚悚的敘事氛圍，禁止任何幽默、吐槽、輕鬆插科打諢的語氣。',
  '每一個描寫都應強調生存壓力、資源稀缺、人性掙扎與環境威脅。',
  '',
  '【時間與體力機制】',
  '玩家每次行動都會推進遊戲時間(依行動性質推進5分鐘至數小時不等)。',
  '玩家與NPC都需要休息，長時間未休息會導致體力持續下降。',
  '戰鬥、長途移動、高壓力事件會消耗較多體力；安全區內的休息與睡眠會恢復體力。',
  '體力歸零時角色會陷入虛脫狀態，必須強制加入劇情轉折讓角色被迫休息或被救援。',
  '',
  '【NPC自主行為】',
  'NPC不是靜止的任務發布器，應有自己的作息、恐懼、疲勞與立場，',
  '會主動採取符合其動機的行動，不會永遠等待玩家。',
  '',
  '【異能覺醒機制】',
  '不要在開局就給予玩家異能。只有當玩家經歷極端情緒(恐懼、憤怒、絕望、犧牲)',
  '或做出關鍵抉擇時，你可以自行判斷是否觸發異能覺醒或能力進化。',
  '若判定觸發覺醒，請在JSON回應的 special_event 欄位標記 "awakening"。',
  '',
  '【角色初始設定】',
  '若玩家提供了角色姓名、背景或自訂細節，請自然地將這些元素融入開局敘事，',
  '不要生硬地照搬玩家輸入的文字，而是把它們轉化為符合末日情境的角色描寫。',
  '若玩家未提供，則由你自行生成一個符合情境的角色開場。',
  '',
  '【輸出字數規範】',
  '一般對話或安全區域的細節描寫：150～200字。',
  '戰鬥、探索、重大突發事件、據點防守：350～450字。',
  '',
  '【防重複協議】',
  '禁止重複使用相同的場景開場句式或選項措辭。',
  '每輪的行動選項必須基於當前具體情境動態生成，不可套用固定模板。',
  '禁止在未有新資訊的情況下讓NPC重複相同台詞。',
  '',
  '【輸出格式強制規範】',
  '你必須只回傳一個合法的JSON物件，不可包含任何JSON以外的文字、註解或Markdown符號。',
  'JSON結構如下：',
  '{',
  '  "narrative": "本回合劇情描寫文字",',
  '  "status_update": {',
  '    "time_advance_minutes": 數字,',
  '    "stamina_change": 數字(可負數),',
  '    "current_location": "地點名稱",',
  '    "danger_level": "safe"或"warning"或"critical",',
  '    "weather": "天氣描述",',
  '    "humanity_change": 數字(可負數，可省略則視為0),',
  '    "faction_trust_update": {"陣營名稱": 數字變化} (可省略),',
  '    "special_event": "none"或"awakening"或其他重要事件代號,',
  '    "special_event_text": "若special_event非none，簡短描述此事件"(可省略)',
  '  },',
  '  "options": [',
  '    {"id": "A", "label": "具體行動描述", "risk_hint": "簡短風險或消耗提示"},',
  '    {"id": "B", "label": "具體行動描述", "risk_hint": "簡短風險或消耗提示"}',
  '  ]',
  '}',
  'options陣列必須包含2到4個選項。'
].join('\\n');

function init() {
  bindEvents();
  loadLoreText();
  loadNotionConfig();
  setupTestModeEntry();

  const savedKey = localStorage.getItem(APIKEY_KEY);
  const savedStateRaw = localStorage.getItem(STATE_KEY);

  if (savedStateRaw) {
    try {
      const savedState = JSON.parse(savedStateRaw);
      if (savedState.isTestMode || savedKey) {
        gameState.apiKey = savedKey || '';
        restoreState(savedState);
        showGameScreen();
        rebuildNarrativeFromHistory();
        renderOptions(gameState.lastOptions);
        renderAll();
      }
    } catch (e) {
      console.error('存檔讀取失敗，將顯示開局畫面', e);
    }
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

function loadLoreText() {
  fetch('knowledge/virus_lore.txt')
    .then(function (res) { return res.text(); })
    .then(function (text) { gameState.loreText = text; })
    .catch(function (e) {
      console.warn('無法載入世界觀密檔:', e);
      gameState.loreText = '';
    });
}

function loadNotionConfig() {
  const saved = localStorage.getItem(NOTION_KEY);
  if (saved) {
    try {
      const cfg = JSON.parse(saved);
      if (dom.notionProxyInput) dom.notionProxyInput.value = cfg.proxyUrl || '';
      if (dom.notionDbInput) dom.notionDbInput.value = cfg.dbId || '';
    } catch (e) {
      /* 忽略 */
    }
  }
}

function bindEvents() {
  dom.startBtn.addEventListener('click', handleStartGame);
  if (dom.testModeBtn) {
    dom.testModeBtn.addEventListener('click', handleStartTestMode);
  }
  dom.importSaveBtn.addEventListener('click', function () { dom.importSaveFile.click(); });
  dom.importSaveFile.addEventListener('change', handleImportFile);

  dom.charSetupToggle.addEventListener('click', function () {
    toggleCollapse(dom.charSetupToggle, dom.charSetupFields);
  });

  dom.statusExpandBtn.addEventListener('click', function () {
    statusExpanded = !statusExpanded;
    dom.statusPanelFull.classList.toggle('hidden', !statusExpanded);
    dom.statusExpandBtn.classList.toggle('expanded', statusExpanded);
  });

  dom.menuToggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleSideMenu(true);
  });
  dom.sideMenuBackdrop.addEventListener('click', function () { toggleSideMenu(false); });
  dom.menuCloseBtn.addEventListener('click', function () { toggleSideMenu(false); });
  dom.menuExportBtn.addEventListener('click', handleExportSave);
  dom.menuImportBtn.addEventListener('click', function () {
    toggleSideMenu(false);
    setTimeout(function () { dom.importSaveFile.click(); }, 200);
  });
  dom.menuRestartBtn.addEventListener('click', handleRestart);
  dom.menuApikeyBtn.addEventListener('click', handleChangeApiKey);

  dom.notionSetupToggle.addEventListener('click', function () {
    toggleCollapse(dom.notionSetupToggle, dom.notionSetupFields);
  });
  dom.notionSaveBtn.addEventListener('click', handleSaveNotionConfig);

  dom.optionsCollapseToggle.addEventListener('click', function () {
    optionsMiniMode = !optionsMiniMode;
    applyOptionsDisplayMode();
  });

  dom.freeInputToggle.addEventListener('click', function () {
    dom.freeInputRow.classList.remove('hidden');
    dom.freeInputToggle.classList.add('hidden');
    dom.freeInputText.focus();
  });
  dom.freeInputCancel.addEventListener('click', function () {
    dom.freeInputRow.classList.add('hidden');
    dom.freeInputToggle.classList.remove('hidden');
    dom.freeInputText.value = '';
  });
  dom.freeInputSend.addEventListener('click', handleFreeInputSend);
  dom.freeInputText.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') handleFreeInputSend();
  });

  dom.eventModalClose.addEventListener('click', function () {
    dom.eventModal.classList.add('hidden');
  });
}

function toggleCollapse(btn, body) {
  const isHidden = body.classList.contains('hidden');
  if (isHidden) {
    body.classList.remove('hidden');
    btn.classList.add('expanded');
  } else {
    body.classList.add('hidden');
    btn.classList.remove('expanded');
  }
}

function handleStartGame() {
  const key = dom.apiKeyInput.value.trim();
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
    notes: dom.charNotesInp
