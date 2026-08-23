/* ============================================
   末日黎明：喪屍浩劫 — 核心遊戲引擎 v3
   新增：離線測試模式（不消耗API配額，使用固定劇本）
   ============================================ */

'use strict';

/* ---------- 全域狀態 ---------- */

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

/* ---------- DOM 參照 ---------- */

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

/* ---------- 系統規則層 ---------- */

const SYSTEM_INSTRUCTION = `你是一位嚴謹、壓抑、寫實的末日生存TRPG game master，
負責運行《末日黎明：喪屍浩劫》。你必須嚴格遵守以下規則：

【核心調性】
全程保持壓抑、寫實、心理驚悚的敘事氛圍，禁止任何幽默、吐槽、輕鬆插科打諢的語氣。
每一個描寫都應強調生存壓力、資源稀缺、人性掙扎與環境威脅。

【時間與體力機制】
玩家每次行動都會推進遊戲時間(依行動性質推進5分鐘至數小時不等)。
玩家與NPC都需要休息，長時間未休息會導致體力持續下降。
戰鬥、長途移動、高壓力事件會消耗較多體力；安全區內的休息與睡眠會恢復體力。
體力歸零時角色會陷入虛脫狀態，必須強制加入劇情轉折讓角色被迫休息或被救援。

【NPC自主行為】
NPC不是靜止的任務發布器，應有自己的作息、恐懼、疲勞與立場，
會主動採取符合其動機的行動，不會永遠等待玩家。

【異能覺醒機制】
不要在開局就給予玩家異能。只有當玩家經歷極端情緒(恐懼、憤怒、絕望、犧牲)
或做出關鍵抉擇時，你可以自行判斷是否觸發異能覺醒或能力進化。
若判定觸發覺醒，請在JSON回應的 special_event 欄位標記 "awakening"。

【角色初始設定】
若玩家提供了角色姓名、背景或自訂細節，請自然地將這些元素融入開局敘事，
不要生硬地照搬玩家輸入的文字，而是把它們轉化為符合末日情境的角色描寫。
若玩家未提供，則由你自行生成一個符合情境的角色開場。

【輸出字數規範】
一般對話或安全區域的細節描寫：150～200字。
戰鬥、探索、重大突發事件、據點防守：350～450字。

【防重複協議】
禁止重複使用相同的場景開場句式或選項措辭。
每輪的行動選項必須基於當前具體情境動態生成，不可套用固定模板。
禁止在未有新資訊的情況下讓NPC重複相同台詞。

【輸出格式強制規範】
你必須只回傳一個合法的JSON物件，不可包含任何JSON以外的文字、註解或Markdown符號。
JSON結構如下：
{
  "narrative": "本回合劇情描寫文字",
  "status_update": {
    "time_advance_minutes": 數字,
    "stamina_change": 數字(可負數),
    "current_location": "地點名稱",
    "danger_level": "safe"或"warning"或"critical",
    "weather": "天氣描述",
    "humanity_change": 數字(可負數，可省略則視為0),
    "faction_trust_update": {"陣營名稱": 數字變化} (可省略),
    "special_event": "none"或"awakening"或其他重要事件代號,
    "special_event_text": "若special_event非none，簡短描述此事件"(可省略)
  },
  "options": [
    {"id": "A", "label": "具體行動描述", "risk_hint": "簡短風險或消耗提示"},
    {"id": "B", "label": "具體行動描述", "risk_hint": "簡短風險或消耗提示"}
  ]
}
options陣列必須包含2到4個選項。`;

/* ---------- 初始化 ---------- */

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

async function loadLoreText() {
  try {
    const res = await fetch('knowledge/virus_lore.txt');
    gameState.loreText = await res.text();
  } catch (e) {
    console.warn('無法載入世界觀密檔:', e);
    gameState.loreText = '';
  }
}

function loadNotionConfig() {
  const saved = localStorage.getItem(NOTION_KEY);
  if (saved) {
    try {
      const cfg = JSON.parse(saved);
      if (dom.notionProxyInput) dom.notionProxyInput.value = cfg.proxyUrl || '';
      if (dom.notionDbInput) dom.notionDbInput.value = cfg.dbId || '';
    } catch (e) { /* 忽略 */ }
  }
}

/* ---------- 事件綁定 ---------- */

function bindEvents() {
  dom.startBtn.addEventListener('click', handleStartGame);
  if (dom.testModeBtn) {
    dom.testModeBtn.addEventListener('click', handleStartTestMode);
  }
  dom.importSaveBtn.addEventListener('click', () => dom.importSaveFile.click());
  dom.importSaveFile.addEventListener('change', handleImportFile);

  dom.charSetupToggle.addEventListener('click', () => {
    toggleCollapse(dom.charSetupToggle, dom.charSetupFields);
  });

  dom.statusExpandBtn.addEventListener('click', () => {
    statusExpanded = !statusExpanded;
    dom.statusPanelFull.classList.toggle('hidden', !statusExpanded);
    dom.statusExpandBtn.classList.toggle('expanded', statusExpanded);
  });

  dom.menuToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSideMenu(true);
  });
  dom.sideMenuBackdrop.addEventListener('click', () => toggleSideMenu(false));
  dom.menuCloseBtn.addEventListener('click', () => toggleSideMenu(false));
  dom.menuExportBtn.addEventListener('click', handleExportSave);
  dom.menuImportBtn.addEventListener('click', () => {
    toggleSideMenu(false);
    setTimeout(() => dom.importSaveFile.click(), 200);
  });
  dom.menuRestartBtn.addEventListener('click', handleRestart);
  dom.menuApikeyBtn.addEventListener('click', handleChangeApiKey);

  dom.notionSetupToggle.addEventListener('click', () => {
    toggleCollapse(dom.notionSetupToggle, dom.notionSetupFields);
  });
  dom.notionSaveBtn.addEventListener('click', handleSaveNotionConfig);

  dom.optionsCollapseToggle.addEventListener('click', () => {
    optionsMiniMode = !optionsMiniMode;
    applyOptionsDisplayMode();
  });

  dom.freeInputToggle.addEventListener('click', () => {
    dom.freeInputRow.classList.remove('hidden');
    dom.freeInputToggle.classList.add('hidden');
    dom.freeInputText.focus();
  });
  dom.freeInputCancel.addEventListener('click', () => {
    dom.freeInputRow.classList.add('hidden');
    dom.freeInputToggle.classList.remove('hidden');
    dom.freeInputText.value = '';
  });
  dom.freeInputSend.addEventListener('click', handleFreeInputSend);
  dom.freeInputText.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleFreeInputSend();
  });

  dom.eventModalClose.addEventListener('click', () => {
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

/* ---------- 開局流程：正式模式 ---------- */

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
    notes: dom.charNotesInput.value.trim()
  };

  showGameScreen();
  requestNextTurn('__START__');
}

/* ---------- 開局流程：離線測試模式 ---------- */

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
  setTimeout(() => {
    const script = CONFIG.TEST_SCRIPT;
    const step = script[gameState.testScriptIndex % script.length];
    gameState.testScriptIndex += 1;

    handleAIResponse(step);
    showTyping(false);
  }, 600);
}

function showGameScreen() {
  dom.setupScreen.classList.add('hidden');
  dom.gameScreen.classList.remove('hidden');
}

/* ---------- 核心：呼叫 Gemini API（正式模式）---------- */

async function requestNextTurn(playerAction) {
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

  const contextPayload = buildContextPayload(playerAction);

  try {
    const response = await callGeminiAPI(contextPayload);
    handleAIResponse(response);
  } catch (err) {
    console.error(err);
    appendGMText(`⚠ 連線異常：${err.message}\n\n請檢查API金鑰是否正確，或稍後再試一次。`);
    renderOptions([{ id: 'RETRY', label: '重新嘗試', risk_hint: '' }]);
  } finally {
    isWaitingForAI = false;
    showTyping(false);
  }
}

function buildContextPayload(playerAction) {
  let userText = '';
  if (playerAction === '__START__') {
    const c = gameState.charSetup;
    const hasCustom = c.name || c.background || c.notes;
    if (hasCustom) {
      userText = `請開始遊戲，生成開局場景。玩家提供了以下角色參考設定（請自然融入敘事，不要生硬照搬）：
姓名/稱呼：${c.name || '(未指定，由你決定)'}
背景：${c.background || '(未指定，由你決定)'}
其他細節：${c.notes || '(無)'}
不要詢問玩家姓名或性別，直接讓玩家以第一人稱進入末日情境。`;
    } else {
      userText = '請開始遊戲。生成開局場景，不要詢問玩家姓名或性別，直接讓玩家以第一人稱進入末日情境，並自然帶出角色初始身份與所在地點。';
    }
  } else {
    userText = `玩家選擇的行動：${playerAction}`;
  }

  const statusSnapshot = `
【當前遊戲狀態】
時間：第${gameState.time.day}天 ${String(gameState.time.hour).padStart(2,'0')}:${String(gameState.time.minute).padStart(2,'0')}
地點：${gameState.location}
體力：${gameState.stamina}/${gameState.maxStamina}
人性值：${gameState.humanity}
覺醒等級：${gameState.awakeningLevel}${gameState.awakeningAbility ? ' - ' + gameState.awakeningAbility : ''}
危險等級：${gameState.dangerLevel}
回合數：${gameState.turnCount}
`;

  const recentContext = gameState.recentTurns
    .map(t => `[第${t.turn}回合]\n劇情：${t.narrative}\n玩家行動：${t.action}`)
    .join('\n\n');

  const summaryContext = gameState.summary ? `【更早期劇情摘要】\n${gameState.summary}` : '';

  return { userText, statusSnapshot, recentContext, summaryContext };
}

async function callGeminiAPI(payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL_NAME}:generateContent?key=${gameState.apiKey}`;

  const fullPrompt = `${payload.statusSnapshot}

${payload.summaryContext}

【近期回合記錄】
${payload.recentContext || '(尚無歷史，這是開局)'}

【本回合玩家輸入】
${payload.userText}`;

  const requestBody = {
    system_instruction: {
      parts: [
        { text: SYSTEM_INSTRUCTION },
        { text: `【世界觀密檔參考資料】\n${gameState.loreText}` }
      ]
    },
    contents: [
      { role: 'user', parts: [{ text: fullPrompt }] }
    ],
    generationConfig: {
      temperature: 1.0,
      responseMimeType: 'application/json'
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('AI 未回傳有效內容');

  return JSON.parse(rawText);
}

/* ---------- 處理AI回應（正式或測試模式共用）並更新狀態 ---------- */

function handleAIResponse(response) {
  const { narrative, status_update, options } = response;

  appendGMText(narrative);
  applyStatusUpdate(status_update);

  gameState.turnCount += 1;
  gameState.recentTurns.push({
    turn: gameState.turnCount,
    narrative: narrative,
    action: gameState.lastPlayerAction || '(開局)'
  });
  if (gameState.recentTurns.length > CONFIG.MAX_RECENT_TURNS) {
    gameState.recentTurns.shift();
  }

  if (status_update.special_event === 'awakening') {
    showEventModal('⚡', '異能覺醒', status_update.special_event_text || '你感覺到體內有某種力量正在覺醒……');
  } else if (status_update.special_event && status_update.special_event !== 'none') {
    showEventModal('❗', '重要事件', status_update.special_event_text || '發生了重要的事情。');
  }

  renderOptions(options);
  renderAll();
  saveStateToLocal();
}

function applyStatusUpdate(update) {
  if (!update) return;

  if (update.time_advance_minutes) {
    advanceTime(update.time_advance_minutes);
  }
  if (typeof update.stamina_change === 'number') {
    gameState.stamina = clamp(gameState.stamina + update.stamina_change, 0, gameState.maxStamina);
  }
  if (update.current_location) {
    gameState.location = update.current_location;
  }
  if (update.danger_level) {
    gameState.dangerLevel = update.danger_level;
  }
  if (update.weather) {
    gameState.weather = update.weather;
  }
  if (typeof update.humanity_change === 'number') {
    gameState.humanity = clamp(gameState.humanity + update.humanity_change, 0, 100);
  }
  if (update.faction_trust_update) {
    for (const [faction, delta] of Object.entries(update.faction_trust_update)) {
      gameState.factionTrust[faction] = (gameState.factionTrust[faction] || 0) + delta;
    }
  }
  if (update.special_event === 'awakening') {
    gameState.awakeningLevel += 1;
  }
}

function advanceTime(minutes) {
  let total = gameState.time.hour * 60 + gameState.time.minute + minutes;
  let daysToAdd = Math.floor(total / 1440);
  total = total % 1440;
  gameState.time.day += daysToAdd;
  gameState.time.hour = Math.floor(total / 60);
  gameState.time.minute = total % 60;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/* ---------- 畫面渲染 ---------- */

function renderAll() {
  const testTag = gameState.isTestMode ? '🧪 ' : '';
  dom.statusTime.textContent = `${testTag}⏱ 第${gameState.time.day}天 ${String(gameState.time.hour).padStart(2,'0')}:${String(gameState.time.minute).padStart(2,'0')}`;
  dom.statusLocation.textContent = `📍 ${gameState.location}`;

  const staminaPct = (gameState.stamina / gameState.maxStamina) * 100;
  dom.staminaFill.style.width = `${staminaPct}%`;
  dom.staminaValue.textContent = gameState.stamina;
  dom.staminaFill.classList.remove('low', 'critical');
  if (staminaPct <= CONFIG.STAMINA_CRITICAL_THRESHOLD) dom.staminaFill.classList.add('critical');
  else if (staminaPct <= CONFIG.STAMINA_LOW_THRESHOLD) dom.staminaFill.classList.add('low');

  const dangerMap = { safe: '安全', warning: '警戒', critical: '危險' };
  dom.statusDanger.textContent = dangerMap[gameState.dangerLevel] || '安全';
  dom.statusDanger.className = `danger-tag ${gameState.dangerLevel}`;

  dom.statHumanity.textContent = gameState.humanity;
  dom.statAwakening.textContent = gameState.awakeningLevel > 0
    ? `Lv.${gameState.awakeningLevel} ${gameState.awakeningAbility || ''}`
    : '未覺醒';
  dom.statWeather.textContent = gameState.weather;

  const factionText = Object.entries(gameState.factionTrust)
    .map(([k, v]) => `${k}:${v}`).join(' / ') || '無接觸';
  dom.statFaction.textContent = factionText;
}

function appendGMText(text) {
  const el = document.createElement('div');
  el.className = 'narrative-entry gm-text';
  el.textContent = text;
  dom.narrativeContent.appendChild(el);
  scrollToBottom();
}

function appendPlayerAction(text) {
  const el = document.createElement('div');
  el.className = 'narrative-entry player-action';
  el.textContent = `▸ ${text}`;
  dom.narrativeContent.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
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

  (options || []).forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.type = 'button';
    btn.innerHTML = `<span class="option-id">${opt.id}.</span>${escapeHtml(opt.label)}` +
      (opt.risk_hint ? `<span class="option-risk">${escapeHtml(opt.risk_hint)}</span>` : '');
    btn.addEventListener('click', () => {
      if (opt.id === 'RETRY') {
        requestNextTurn(gameState.lastPlayerAction || '__START__');
      } else {
        requestNextTurn(opt.label);
      }
    });
    dom.optionsContainer.appendChild(btn);
  });

  dom.optionsCollapseToggle.classList.toggle('hidden', !options || options.length === 0);
  applyOptionsDisplayMode();
}

function applyOptionsDisplayMode() {
  dom.optionsContainer.classList.toggle('mini-mode', optionsMiniMode);
  dom.optionsCollapseToggle.classList.toggle('expanded', !optionsMiniMode);
  const label = dom.optionsCollapseToggle.querySelector('span');
  if (label) label.textContent = optionsMiniMode ? '行動選項（精簡）' : '行動選項';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showEventModal(icon, title, text) {
  dom.eventModalIcon.textContent = icon;
  dom.eventModalTitle.textContent = title;
  dom.eventModalText.textContent = text;
  dom.eventModal.classList.remove('hidden');
}

/* ---------- 自由輸入 ---------- */

function handleFreeInputSend() {
  const text = dom.freeInputText.value.trim();
  if (!text) return;
  dom.freeInputText.value = '';
  dom.freeInputRow.classList.add('hidden');
  dom.freeInputToggle.classList.remove('hidden');
  requestNextTurn(text);
}

/* ---------- 側邊選單 ---------- */

function toggleSideMenu(show) {
  dom.sideMenu.classList.toggle('hidden', !show);
}

function handleExportSave() {
  const saveData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    gameState: gameState
  };
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `doomsday-save-day${gameState.time.day}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toggleSideMenu(false);
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const saveData = JSON.parse(event.target.result);
      restoreState(saveData.gameState);

      const key = dom.apiKeyInput.value.trim() || localStorage.getItem(APIKEY_KEY);
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
      console.error(err);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function rebuildNarrativeFromHistory() {
  dom.narrativeContent.innerHTML = '';
  gameState.recentTurns.forEach(t => {
    if (t.action && t.action !== '(開局)') {
      const actionEl = document.createElement('div');
      actionEl.className = 'narrative-entry player-action';
      actionEl.textContent = `▸ ${t.action}`;
      dom.narrativeContent.appendChild(actionEl);
    }
    const gmEl = document.createElement('div');
    gmEl.className = 'narrative-entry gm-text';
    gmEl.textContent = t.narrative;
    dom.narrativeContent.appendChild(gmEl);
  });
  scrollToBottom();
}

function handleRestart() {
  toggleSideMenu(false);
  setTimeout(() => {
    if (!confirm('確定要清空所有進度，重新開始嗎？此操作無法復原。')) return;
    localStorage.removeItem(STATE_KEY);
    location.reload();
  }, 200);
}

function handleChangeApiKey() {
  toggleSideMenu(false);
  setTimeout(() => {
    const newKey = prompt('請輸入新的 Google Gemini API 金鑰：', gameState.apiKey);
    if (newKey && newKey.trim()) {
      gameState.apiKey = newKey.trim();
      localStorage.setItem(APIKEY_KEY, gameState.apiKey);
    }
  }, 200);
}

function handleSaveNotionConfig() {
  const proxyUrl = dom.notionProxyInput.value.trim();
  const dbId = dom.notionDbInput.value.trim();
  localStorage.setItem(NOTION_KEY, JSON.stringify({ proxyUrl, dbId }));
  CONFIG.NOTION_ENABLED = !!(proxyUrl && dbId);
  CONFIG.NOTION_PROXY_URL = proxyUrl;
  CONFIG.NOTION_DATABASE_ID = dbId;
  alert('Notion 設定已儲存於本機。');
}

/* ---------- 存檔序列化 ---------- */

function saveStateToLocal() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(gameState));
  } catch (e) {
    console.warn('本機存檔失敗:', e);
  }
}

function restoreState(saved) {
  gameState = Object.assign({}, gameState, saved);
}

/* ---------- 啟動 ---------- */

document.addEventListener('DOMContentLoaded', init);
