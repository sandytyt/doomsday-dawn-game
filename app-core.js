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
  charSetup: { name: '', gender: '', location: '', occupation: '' },
  vehicles: [],
  activeVehicleId: null,
  stashes: []   // 新增：地點暫存清單，每筆 { id, locationName, items: [], createdDay, note }
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
  dom.charNameInput = document.getElementById('char-name-input');
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
  dom.npcList = document.getElementById('npc-list');
  dom.vehicleSectionToggle = document.getElementById('vehicle-section-toggle');
  dom.vehicleSectionBody = document.getElementById('vehicle-section-body');
  dom.vehicleList = document.getElementById('vehicle-list');
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
  domdom.profileAwakeningSection = document.getElementById('profile-awakening-section');
  dom.profileAwakeningLevel = document.getElementById('profile-awakening-level');
  dom.profileAwakeningAbility = document.getElementById('profile-awakening-ability');
  dom.profileAwakeningExp = document.getElementById('profile-awakening-exp');dom.profileAwakeningLevel = document.getElementById('profile-awakening-level');
  dom.profileAwakeningAbility = document.getElementById('profile-awakening-ability');
  dom.profileAwakeningExp = document.getElementById('profile-awakening-exp');
}

var SYSTEM_LINES = [];
SYSTEM_LINES.push('你是《末日黎明：喪屍浩劫》的game master，壓抑寫實心理驚悚調性，禁止幽默或吐槽語氣。');
SYSTEM_LINES.push('嚴格遵守下方遊戲規則文檔的所有數值、機率與判定邏輯，該文檔已完整提供，不需要重複解釋規則本身，直接依規則生成敘事與數值變化。');
SYSTEM_LINES.push('NPC具備獨立人性，包含自保、背叛、恐懼下的過度反應，同時也可能有無償犧牲、隱瞞真相保護他人等正向行為，依規則文檔的NPC判定邏輯執行，不套用單一固定模式。');
SYSTEM_LINES.push('NPC與喪屍的覺醒或進化狀態於背景設定階段獨立判定，不依賴玩家是否目擊或介入。已登記的NPC與安全區即使主角長期不在場，仍會依世界記憶段落的既有狀態持續發展，不會停滯等待主角出現才變化，你可透過傳聞、路人轉述、環境線索等方式，將背景已發生的變化間接告知主角。');
SYSTEM_LINES.push('若玩家有隨行NPC加入隊伍，須依規則文檔管理隨行人數上限、資源分攤與隨行NPC死亡判定。');
SYSTEM_LINES.push('每回合須依規則文檔管理玩家背包物品增減、負重狀態、武器耐久或彈藥、傷勢等級、死亡判定，以及晶核掉落與能力熟練度變化。');
SYSTEM_LINES.push('禁止重複使用相同場景開場句式或選項措辭，選項必須基於當前具體情境動態生成。');
SYSTEM_LINES.push('提示詞中可能包含「長期世界記憶」段落，記載已知安全區、關鍵NPC、勢力歷史、世界重大事件、玩家志向發展與人物關係記錄，你必須將其視為已確立的事實持續納入敘事考量，不可忽略、不可與其矛盾。');
SYSTEM_LINES.push('world_memory_update欄位僅在本回合敘事確實發生下列四類事件之一時才填寫對應子欄位，其餘情況全部留空物件：new_safe_zone（玩家新建立安全區，含name、location、population、facilities陣列）、safe_zone_update（既有安全區的人口或設施異動，含name、population、facilities_add陣列、facilities_remove陣列、faction_relation_note）、npc_major_event（NPC加入、死亡、覺醒、能力習得或關係質變，含name、gender、ability、note、status僅可為alive或dead或missing或unknown）、faction_shift（勢力關係質變如轉為敵對或同盟，非小幅信任度波動，含faction、eventText）、world_landmark（地圖級重大變化如城市淪陷路線打通，含eventText）。');
SYSTEM_LINES.push('若使用者輸入中出現「請檢查背景演化」的指示，你必須額外填寫background_evolution欄位，基於提示詞中已提供的長期世界記憶段落，獨立推演已登記的NPC、安全區、勢力在主角不在場期間可能發生的變化，結構為npc_updates陣列每項含name與note與可選status與可選ability與可選gender、safe_zone_updates陣列每項含name與note、faction_updates陣列每項含faction與eventText；若沒有明確要求則此欄位留空物件。');
SYSTEM_LINES.push('若玩家取得、修復、使用或失去載具，須依規則文檔載具系統章節管理耐久度、油量、貨艙容量與危險等級雙面效果，車輛類型不限於固定清單，可為任何合理現實車輛，但須依其體型用途歸入對應數值級距。action為acquire僅可在玩家本回合首次取得全新載具時使用，若該載具已於先前回合登記且非報廢狀態，後續回合對同一輛車的任何操作須使用repair、refuel、damage、cargo_change或set_active，絕對不可對同一輛已存在的載具重複使用acquire，即使敘事措辭或載具描述方式與先前不同也視為同一輛車。若本回合涉及載具狀態變化，於vehicle_update欄位回報：action僅可為acquire（新獲得載具）、repair（耐久度恢復）、refuel（油量補充）、damage（耐久度受損）、cargo_change（貨艙物品增減）、lose（載具報廢或失去）、set_active（切換使用中載具）之一；vehicle_name為該載具的敘事名稱用於比對識別；vehicle_tier（僅action為acquire時填寫）僅可為light_two_wheel或light_four_wheel或medium或heavy或special_military之一，依車輛體型用途合理判斷；durability_change與fuel_change為對應數值變化的整數；cargo_changes陣列每項包含name與quantity與action（add或remove），僅在action為cargo_change時填寫。若本回合無任何載具狀態變化，此物件整體留空。');
SYSTEM_LINES.push('若玩家將物資留在特定地點不隨身攜帶，或返回先前暫存地點取回物資，須依規則文檔地點暫存系統章節管理。於stash_update欄位回報：action僅可為store（存入暫存）或retrieve（取回暫存）之一；location_name為該暫存點的地標式簡短名稱，須與先前回合使用過的名稱高度一致以便正確比對；items陣列每項包含name與quantity，action為store時代表本次留下的物品，action為retrieve時代表本次取回的物品。回報stash_update的同時，須同步在inventory_changes回報對應的remove（store時）或add（retrieve時），確保背包與暫存點的物品增減完全對應，不可只更新其中一方。若本回合無任何地點暫存變化，此物件整體留空。');
SYSTEM_LINES.push('玩家的長期發展路線由四條志向線構成，彼此不互斥，可同時推進：庇護建設者shelterBuilder專注安全區規模、設施、人口成長；治療探索者cureSeeker專注病毒研究與解藥或疫苗相關進展；暗影獵人shadowHunter專注透過武力與威嚇建立跨陣營恐懼名聲；勢力締造者factionLeader專注在既有陣營內取得實質決策影響力或創建新勢力。每回合若敘事內容明確符合某條志向線的推進條件，於aspiration_update欄位回報對應志向鍵名的物件，內含progress_delta（一個負20至正20之間的整數）與milestone_text（僅達成關鍵性轉折時填寫，否則留空字串）。一回合可同時推進多條志向線，也可以完全不推進任何志向線，不可為了填欄位而勉強編造進度，其餘志向留空物件。');
SYSTEM_LINES.push('每個具名NPC都有性別gender與三個獨立關係軸：trust信任範圍0到100代表對方是否相信你並願意託付重要事務、closeness親密範圍0到100代表情感靠近程度決定對話深度與私密話題開放與否、romantic_tension浪漫張力範圍0到100僅特定NPC適用代表關係往愛情方向發展的張力與前兩軸獨立運作不必然同步成長。每個NPC關係處於六個敘事階段之一：acquainted初識剛認識僅止於認識彼此存在、incipient初萌開始有一絲交集關係值變動應緩慢、developing漸深開始建立信任與默契、critical_trial風險考驗劇情須安排一次高風險抉擇考驗雙方關係不可透過玩家連續示好跳過此階段、defining_choice關鍵抉擇雙方關係將往結合決裂或維持現狀之一定型此為不可逆敘事節點、resolved_bond穩定結合或resolved_apart疏離懸置為關係定型後的穩定狀態。階段推進有時間限制，唯有初識轉為初萌不受天數限制可隨劇情自然發生，初萌之後每一階段轉換都須提示詞中的長期世界記憶段落標明「可推進下一階段」才可以在stage_transition欄位填入下一階段名稱，若標明「尚未滿5天不可推進階段」則絕對不可填寫stage_transition即使劇情發展看似合適也必須等待。若提示詞標明某NPC已進入漸深階段較久建議安排風險考驗事件，可主動於本回合或近期敘事中安排相應情境。關係推進不應是玩家單方面刷好感度就能達成，必須透過劇情中的具體事件才能真正變動關係軸數值與階段，日常閒聊互動只應造成極小幅度變動即正負1至3點。若某NPC狀態為dead或missing，其關係已被系統凍結，不可再回報trust_delta、closeness_delta、romantic_tension_delta或stage_transition，僅可透過background_note補充該NPC過去的背景資訊。若本回合涉及具名NPC的關係發展或想補充其背景經歷，於relationship_update欄位回報npc_name、gender（若尚未記錄則填寫）、trust_delta、closeness_delta、romantic_tension_delta（不涉及浪漫時留空或0）、stage_transition（僅符合天數條件時才填寫，否則留空字串）、note簡述本次關係變化的具體事由、background_note（僅當本回合透過對話或事件得知該NPC過去背景或經歷時才填寫，是一段可累加的日記式記錄，不覆蓋先前內容，若無新背景資訊則留空字串）；若本回合無任何NPC關係變化，此物件整體留空。');
SYSTEM_LINES.push('只回傳合法JSON物件，不包含JSON以外文字或Markdown符號。JSON結構：narrative為敘事文字字串；status_update物件包含time_advance_minutes、stamina_change、hunger_change、current_location、danger_level僅可為safe或warning或critical、weather、humanity_change、resonance_change、ability_exp_change、faction_trust_update、inventory_changes陣列每項包含name與quantity與action僅可為add或remove、injury_status僅可為none或minor或severe、injury_detail為15字以內的簡短部位與傷勢描述僅在傷勢狀態有變化時填寫否則留空字串、vehicle_update物件依上述規則、stash_update物件依上述規則、companion_changes陣列每項包含name與action僅可為join或leave或die、special_event僅可為none或awakening或multi_awakening或death或rescued或level_up或其他事件代號、special_event_text；world_memory_update物件依上述規則；background_evolution物件依上述規則；aspiration_update物件依上述規則；relationship_update物件依上述規則；options陣列包含2到4個元素，每個元素含id、label、risk_hint，其中id欄位只能是大寫字母A、B、C、D，依陣列順序遞增，不可使用其他任何格式如opt_1或數字。');
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

  var finalGender = dom.charGenderInput.value || pickRandom(RANDOM_CHAR_POOL.genders);
  var finalName = dom.charNameInput.value.trim() || pickRandomNameByGender(finalGender);

  gameState.charSetup = {
    name: finalName,
    gender: finalGender,
    location: dom.charLocationInput.value.trim() || pickRandom(RANDOM_CHAR_POOL.locations),
    occupation: dom.charOccupationInput.value.trim() || pickRandom(RANDOM_CHAR_POOL.occupations)
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
    if (playerAction === '__START__') {
      var c = gameState.charSetup;
      userText = '請開始遊戲，生成開局場景。角色設定：姓名：' + c.name +
        '。性別：' + c.gender + '。末日爆發時的初始地點：' + c.location +
        '。末世前職業：' + c.occupation + '。請自然融入敘事，不要生硬列出這些設定，也不要詢問玩家。';
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
    '，飽食度：' + gameState.hunger + '，人性值：' + gameState.humanity +
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
  var worldMemoryContext = WorldMemory.buildWorldMemoryPrompt(gameState.worldMemory, gameState.time.day);

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
    if (update.injury_status === 'none') {
      gameState.injuryDetail = '';
    } else if (update.injury_detail) {
      gameState.injuryDetail = update.injury_detail;
    }
  }
  if (update.inventory_changes && update.inventory_changes.length) {
    applyInventoryChanges(update.inventory_changes);
  }
  if (update.companion_changes && update.companion_changes.length) {
    applyCompanionChanges(update.companion_changes);
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
    } else if (change.action === 'leave' || change.action === 'die') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
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
  dom.statAwakening.textContent = gameState.awakeningLevel > 0
    ? ('Lv.' + gameState.awakeningLevel + ' ' + (gameState.awakeningAbility || '') + '（' + gameState.abilityExp + '/' + getAbilityExpNeeded(gameState.awakeningLevel) + '）')
    : '未覺醒';
  dom.statWeather.textContent = gameState.weather;
  if (dom.statCompanions) dom.statCompanions.textContent = gameState.companions.length ? gameState.companions.join('、') : '無';

  var factionEntries = [];
  for (var k in gameState.factionTrust) {
    if (Object.prototype.hasOwnProperty.call(gameState.factionTrust, k)) {
      factionEntries.push(k + ':' + gameState.factionTrust[k]);
    }
  }
  dom.statFaction.textContent = factionEntries.length ? factionEntries.join(' / ') : '無接觸';

  if (dom.panelItemAwakening) {
    dom.panelItemAwakening.classList.toggle('hidden', gameState.awakeningLevel <= 0);
  }
  if (dom.panelItemFaction) {
    var hasFactionContact = Object.keys(gameState.factionTrust).length > 0;
    dom.panelItemFaction.classList.toggle('hidden', !hasFactionContact);
  }

  // 側邊面板入口按鈕：人物檔案區塊可見度與數量標籤
  if (dom.npcSectionToggle) {
    var wmForVisibility = WorldMemory.ensureShape(gameState.worldMemory);
    var npcCount = Object.keys(wmForVisibility.relationships).length;
    var npcSpan = dom.npcSectionToggle.querySelector('span');
    if (npcSpan) npcSpan.textContent = '📇 人物檔案（' + npcCount + '）';
  }

  // 側邊面板入口按鈕：載具區塊可見度與數量標籤
  if (dom.vehicleSectionToggle) {
    var hasVehicle = gameState.vehicles.some(function (v) { return v.status !== 'lost'; });
    var vehicleCount = gameState.vehicles.filter(function (v) { return v.status !== 'lost'; }).length;
    var vSpan = dom.vehicleSectionToggle.querySelector('span');
    if (vSpan) vSpan.textContent = '🚗 載具（' + vehicleCount + '）';
  }

  // 每回合都重新渲染物品/人物/載具內容，
  // 確保資料一有變動就同步更新，不受側邊面板開關狀態影響
  renderItemsAccordion();
  renderNpcPanel();
  renderVehiclePanel();
}

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

document.addEventListener('DOMContentLoaded', init);
