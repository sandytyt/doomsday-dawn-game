/* ============================================
   末日黎明：喪屍浩劫 — 使用者介面模組 (ui.js)
   職責：DOM 元素快取、畫面渲染、面板開關與特效
   ============================================ */

var dom = {};
var statusExpanded = false;
var optionsMiniMode = false;
var pendingMilestoneModals = [];

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
  dom.panelsToggleBtn = document.getElementById('panels-toggle-btn');
  dom.infoPanel = document.getElementById('info-panel');
  dom.infoPanelBackdrop = document.getElementById('info-panel-backdrop');
  dom.infoPanelClose = document.getElementById('info-panel-close');
  dom.itemsSectionToggle = document.getElementById('items-section-toggle');
  dom.itemsSectionBody = document.getElementById('items-section-body');
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
  dom.profileGender = document.getElementById('profile-gender');
  dom.profileLocation = document.getElementById('profile-location');
  dom.profileOccupation = document.getElementById('profile-occupation');
  dom.bgSelect = document.getElementById('char-background-type-select');
  dom.generalistDiv = document.getElementById('generalist-picks-container');
  dom.manualModal = document.getElementById('manual-modal');
  dom.manualCloseBtn = document.getElementById('manual-close-btn');
  dom.rulesModalContent = document.getElementById('rules-modal-content'); // 預留
}

// 畫面切換與基礎渲染
function showGameScreen() {
  dom.setupScreen.classList.add('hidden');
  dom.gameScreen.classList.remove('hidden');
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function simpleMarkdownToHtml(text) {
  var lines = text.split('\n');
  var html = '';
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf('## ') === 0) html += '<h3>' + escapeHtml(line.slice(3)) + '</h3>';
    else if (line.indexOf('# ') === 0) html += '<h2>' + escapeHtml(line.slice(2)) + '</h2>';
    else if (line.indexOf('- ') === 0) html += '<p class="rules-li">• ' + escapeHtml(line.slice(2)) + '</p>';
    else if (line.trim() === '') html += '';
    else html += '<p>' + escapeHtml(line) + '</p>';
  }
  return html;
}

// 狀態列更新
function renderAll() {
  var testTag = gameState.isTestMode ? '🧪 ' : '';
  dom.statusTime.textContent = testTag + '⏱ 第' + gameState.time.day + '天 ' + pad2(gameState.time.hour) + ':' + pad2(gameState.time.minute);
  dom.statusLocation.textContent = '📍 ' + gameState.location;

  var staminaPct = (gameState.stamina / gameState.maxStamina) * 100;
  dom.staminaFill.style.width = staminaPct + '%';
  dom.staminaValue.textContent = Math.round(gameState.stamina);
  dom.staminaFill.classList.remove('low', 'critical');
  if (staminaPct <= CONFIG.STAMINA_CRITICAL_THRESHOLD) dom.staminaFill.classList.add('critical');
  else if (staminaPct <= CONFIG.STAMINA_LOW_THRESHOLD) dom.staminaFill.classList.add('low');

  var hungerPct = gameState.hunger;
  dom.hungerFill.style.width = hungerPct + '%';
  dom.hungerValue.textContent = Math.round(gameState.hunger);
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

  dom.statHumanity.textContent = Math.round(gameState.humanity);

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

  if (dom.npcSectionToggle && typeof WorldMemory !== 'undefined') {
    var wmForVisibility = WorldMemory.ensureShape(gameState.worldMemory);
    var npcCount = Object.keys(wmForVisibility.relationships).length;
    var npcSpan = dom.npcSectionToggle.querySelector('span');
    if (npcSpan) npcSpan.textContent = '📇 人物檔案（' + npcCount + '）';
  }

  if (dom.vehicleSectionToggle) {
    var vehicleCount = gameState.vehicles.filter(function (v) { return v.status !== 'lost'; }).length;
    var vSpan = dom.vehicleSectionToggle.querySelector('span');
    if (vSpan) vSpan.textContent = '🚗 載具（' + vehicleCount + '）';
  }

  // 呼叫外部模組渲染
  if (typeof renderCharProfile === 'function') renderCharProfile();
  if (typeof renderItemsAccordion === 'function') renderItemsAccordion();
  if (typeof renderNpcPanel === 'function') renderNpcPanel();
  if (typeof renderVehiclePanel === 'function') renderVehiclePanel();
    // 每次畫面更新時，自動檢查並替換背景與頭像！
  updateDynamicVisuals(); 
}

// 對話與選項渲染
function appendGMText(text) {
  var el = document.createElement('div');
  el.className = 'narrative-entry gm-text';
  el.textContent = text;
  dom.narrativeContent.appendChild(el);
  scrollToBottom();
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

function renderOptions(options, clickHandlerFactory) {
  gameState.lastOptions = options || [];
  dom.optionsContainer.innerHTML = '';
  var list = options || [];
  for (var i = 0; i < list.length; i++) {
    var opt = list[i];
    var validLevels = ['low', 'medium', 'high'];
    var riskLevel = (validLevels.indexOf(opt.risk_level) !== -1) ? opt.risk_level : 'low';
    var btn = document.createElement('button');
    btn.className = 'option-btn risk-' + riskLevel;
    btn.type = 'button';
    var riskHtml = opt.risk_hint ? ('<span class="option-risk">' + escapeHtml(opt.risk_hint) + '</span>') : '';
    btn.innerHTML = '<span class="option-id">' + opt.id + '.</span>' + escapeHtml(opt.label) + riskHtml;
    // 透過傳入的 Factory 綁定事件
    if (clickHandlerFactory) {
      btn.addEventListener('click', clickHandlerFactory(opt, riskLevel));
    }
    dom.optionsContainer.appendChild(btn);
  }
  dom.optionsCollapseToggle.classList.toggle('hidden', list.length === 0);
  applyOptionsDisplayMode();
}

function applyOptionsDisplayMode() {
  dom.optionsContainer.classList.toggle('hidden', optionsMiniMode);
  dom.freeInputToggle.classList.toggle('hidden', optionsMiniMode);
  dom.freeInputRow.classList.add('hidden');
  dom.optionsCollapseToggle.classList.toggle('hidden', optionsMiniMode);
  dom.optionsCollapseToggle.classList.toggle('expanded', !optionsMiniMode);
  dom.actionCollapsedBar.classList.toggle('hidden', !optionsMiniMode);
}

// 各類彈窗與面板開關
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
  if (show) renderAll(); // 面板打開時自動更新最新狀態
}

function toggleSideMenu(show) {
  dom.sideMenu.classList.toggle('hidden', !show);
}

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

function toggleManualModal(show) {
  if (!dom.manualModal) return;
  dom.manualModal.classList.toggle('hidden', !show);
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

function showNextPendingModal() {
  if (pendingMilestoneModals.length === 0) return;
  var next = pendingMilestoneModals.shift();
  showEventModal(next.icon, next.title, next.text);
}

// ==========================================
// 動態視覺引擎 (背景與立繪切換)
// ==========================================
function updateDynamicVisuals() {
  // 1. 處理背景圖片切換
  var appContainer = document.getElementById('app');
  var currentZone = "未知";
  
  // 反推目前所在地屬於哪個大區域
  for (var poolId in MAP_PRESETS) {
    var pool = MAP_PRESETS[poolId];
    if (pool.name === gameState.location || pool.locations.some(function(l) { return l.name === gameState.location; })) {
      currentZone = poolId;
      break;
    }
  }
  // 若找不到具體地點，採用當前地圖池 ID
  if (currentZone === "未知" && gameState.currentMapPresetId) {
     currentZone = gameState.currentMapPresetId;
  }

  // 檔名對應字典
  var bgMap = {
    "維爾赫姆市": "wilhelm_city.jpg",
    "灰堡": "greywall.jpg",
    "荒原鎮群": "ashfield.jpg",
    "靜默聖所": "sanctum.jpg",
    "深谷中繼站": "hollowreach.jpg"
  };
  
  var bgFileName = bgMap[currentZone] || "default.jpg";
  if (appContainer) {
    appContainer.style.backgroundImage = "url('images/bg/" + bgFileName + "')";
  }

  // 2. 處理主角頭像切換
  var avatarBox = document.getElementById('player-avatar-box');
  if (avatarBox && gameState.charSetup) {
    // 判斷性別 (預設 male)
    var gender = (gameState.charSetup.gender === '女性') ? 'female' : 'male';
    // 判斷職業背景 (預設 combat_survivor)
    var bgType = gameState.charSetup.backgroundType || 'combat_survivor';
    
    // 組合頭像檔名，例如: female_healer_heart.jpg
    var avatarFileName = gender + '_' + bgType + '.jpg';
    avatarBox.style.backgroundImage = "url('images/chars/" + avatarFileName + "')";
    
    // 3. 處理覺醒特效
    if (gameState.awakeningLevel > 0) {
       avatarBox.classList.add('awakened');
    } else {
       avatarBox.classList.remove('awakened');
    }
  }
}
