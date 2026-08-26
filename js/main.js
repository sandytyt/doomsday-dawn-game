/* ============================================
   末日黎明：喪屍浩劫 — 主流程與控制器 (main.js)
   職責：遊戲初始化、事件綁定、狀態更新分發與回合控制
   ============================================ */

var isWaitingForAI = false;

function init() {
  cacheDom();
  populateProviderSelect();
  bindEvents();
  setupManualTabs();
  loadRulesAndLore();
  loadNotionConfig();
  setupTestModeEntry();
  tryRestoreSavedGame();
}

function bindEvents() {
  // 開局設定
  dom.providerSelect.addEventListener('change', handleProviderChange);
  dom.startBtn.addEventListener('click', handleStartGame);
  if (dom.testModeBtn) dom.testModeBtn.addEventListener('click', handleStartTestMode);
  dom.importSaveBtn.addEventListener('click', function () { dom.importSaveFile.click(); });
  dom.importSaveFile.addEventListener('change', handleImportFile);
  dom.charSetupToggle.addEventListener('click', function () { toggleCollapse(dom.charSetupToggle, dom.charSetupFields); });
  if (dom.bgSelect) dom.bgSelect.addEventListener('change', handleBackgroundTypeChange);
  
  if (dom.generalistDiv) {
    var pointInputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
    for (var j = 0; j < pointInputs.length; j++) {
      pointInputs[j].addEventListener('input', handleGeneralistPointChange);
    }
  }

  // 遊戲內介面開關
  dom.statusExpandBtn.addEventListener('click', function() {
    statusExpanded = !statusExpanded;
    dom.statusPanelFull.classList.toggle('hidden', !statusExpanded);
    dom.statusExpandBtn.classList.toggle('expanded', statusExpanded);
  });
  dom.menuToggleBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleSideMenu(true); });
  dom.sideMenuBackdrop.addEventListener('click', function () { toggleSideMenu(false); });
  dom.menuCloseBtn.addEventListener('click', function () { toggleSideMenu(false); });
  
  if (dom.panelsToggleBtn) dom.panelsToggleBtn.addEventListener('click', function () { toggleInfoPanel(true); });
  if (dom.infoPanelBackdrop) dom.infoPanelBackdrop.addEventListener('click', function () { toggleInfoPanel(false); });
  if (dom.infoPanelClose) dom.infoPanelClose.addEventListener('click', function () { toggleInfoPanel(false); });
  
  if (dom.itemsSectionToggle) dom.itemsSectionToggle.addEventListener('click', function () { toggleCollapse(dom.itemsSectionToggle, dom.itemsSectionBody); });
  if (dom.npcSectionToggle) dom.npcSectionToggle.addEventListener('click', function () { toggleCollapse(dom.npcSectionToggle, dom.npcSectionBody); renderNpcPanel(); });
  if (dom.charProfileToggle) dom.charProfileToggle.addEventListener('click', function () { toggleCollapse(dom.charProfileToggle, dom.charProfileBody); renderCharProfile(); });
  if (dom.vehicleSectionToggle) dom.vehicleSectionToggle.addEventListener('click', function () { toggleCollapse(dom.vehicleSectionToggle, dom.vehicleSectionBody); });

  // 遊戲手冊
  if (dom.rulesLinkBtn) dom.rulesLinkBtn.addEventListener('click', function () { toggleManualModal(true); });
  if (dom.menuRulesBtn) dom.menuRulesBtn.addEventListener('click', function () { toggleSideMenu(false); setTimeout(function () { toggleManualModal(true); }, 200); });
  if (dom.manualCloseBtn) dom.manualCloseBtn.addEventListener('click', function () { toggleManualModal(false); });

  // 玩家行動輸入區
  dom.optionsCollapseToggle.addEventListener('click', function() { optionsMiniMode = !optionsMiniMode; applyOptionsDisplayMode(); });
  dom.actionCollapsedBar.addEventListener('click', function() { optionsMiniMode = !optionsMiniMode; applyOptionsDisplayMode(); });
  dom.freeInputToggle.addEventListener('click', function() { dom.freeInputRow.classList.remove('hidden'); dom.freeInputToggle.classList.add('hidden'); dom.freeInputText.focus(); });
  dom.freeInputCancel.addEventListener('click', function() { dom.freeInputRow.classList.add('hidden'); dom.freeInputToggle.classList.remove('hidden'); dom.freeInputText.value = ''; });
  dom.freeInputSend.addEventListener('click', handleFreeInputSend);
  dom.freeInputText.addEventListener('keypress', function(e) { if (e.key === 'Enter') handleFreeInputSend(); });
  dom.eventModalClose.addEventListener('click', function() { dom.eventModal.classList.add('hidden'); showNextPendingModal(); });

  // 存檔與其他選單
  dom.menuExportBtn.addEventListener('click', handleExportSave);
  dom.menuImportBtn.addEventListener('click', function() { toggleSideMenu(false); setTimeout(function () { dom.importSaveFile.click(); }, 200); });
  dom.menuNamedSaveBtn.addEventListener('click', handleOpenNamedSave);
  dom.menuSaveManagerBtn.addEventListener('click', handleOpenSaveManager);
  dom.namedSaveClose.addEventListener('click', function () { dom.namedSaveModal.classList.add('hidden'); });
  dom.saveTabLocal.addEventListener('click', function () { switchSaveTab('local'); });
  dom.saveTabNotion.addEventListener('click', function () { switchSaveTab('notion'); });
  dom.menuRestartBtn.addEventListener('click', handleRestart);
  dom.menuApikeyBtn.addEventListener('click', handleChangeApiKey);
  dom.notionSetupToggle.addEventListener('click', function () { toggleCollapse(dom.notionSetupToggle, dom.notionSetupFields); });
  dom.notionSaveBtn.addEventListener('click', handleSaveNotionConfig);
  dom.notionSyncNowBtn.addEventListener('click', handleNotionSyncNow);
}

// --- 初始化輔助函式 ---
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

function handleProviderChange() {
  var provider = dom.providerSelect.value;
  localStorage.setItem(PROVIDER_KEY, provider);
  var savedKey = localStorage.getItem(APIKEY_KEY_PREFIX + provider);
  dom.apiKeyInput.value = savedKey || '';
}

function loadRulesAndLore() {
  fetch('knowledge/ai_system_rules.txt').then(function (res) { return res.text(); })
    .then(function (text) { gameState.rulesText = text; if (dom.rulesModalContent) dom.rulesModalContent.innerHTML = simpleMarkdownToHtml(text); }).catch(function () { gameState.rulesText = ''; });
  fetch('knowledge/virus_lore.txt').then(function (res) { return res.text(); })
    .then(function (text) { gameState.loreText = text; }).catch(function () { gameState.loreText = ''; });
  fetch('knowledge/skill_trees.txt').then(function (res) { return res.text(); })
    .then(function (text) { gameState.skillTreesText = text; }).catch(function () { gameState.skillTreesText = ''; });
  fetch('knowledge/factions.txt').then(function (res) { return res.text(); })
    .then(function (text) { gameState.factionsText = text; }).catch(function () { gameState.factionsText = ''; });
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

function setupTestModeEntry() {
  if (!dom.testModeBtn) return;
  dom.testModeBtn.classList.toggle('hidden', !CONFIG.TEST_MODE_ENABLED);
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
      renderOptions(gameState.lastOptions, makeOptionClickHandler);
      renderAll();
    }
  } catch (e) {
    console.error('存檔讀取失敗', e);
  }
}

// --- 角色建立與開始遊戲 ---
function handleBackgroundTypeChange() {
  if (dom.bgSelect.value === 'generalist') dom.generalistDiv.classList.remove('hidden');
  else dom.generalistDiv.classList.add('hidden');
}

function handleGeneralistPointChange(e) {
  var inputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
  var total = 0;
  for (var i = 0; i < inputs.length; i++) total += parseInt(inputs[i].value, 10) || 0;
  if (total > 3) {
    e.target.value = parseInt(e.target.value, 10) - (total - 3);
    total = 3;
    alert('點數上限為 3 點');
  }
  var leftSpan = document.getElementById('generalist-points-left');
  if (leftSpan) leftSpan.textContent = (3 - total);
}

function applyCharacterSetup() {
  var finalGender = dom.charGenderInput.value || pickRandom(RANDOM_CHAR_POOL.genders);
  var bgType = dom.bgSelect ? dom.bgSelect.value : 'combat_survivor';
  var picks = {};
  
  if (bgType === 'generalist') {
    var inputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
    for (var i = 0; i < inputs.length; i++) {
      var val = parseInt(inputs[i].value, 10) || 0;
      if (val > 0) picks[inputs[i].dataset.stat] = val;
    }
  }

  gameState.charSetup = {
    name: '你',
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
  if (!key) { alert('請輸入你的 API 金鑰'); return; }
  
  if (!applyCharacterSetup()) return;
  
  gameState.apiKey = key;
  gameState.provider = provider;
  gameState.isTestMode = false;
  localStorage.setItem(PROVIDER_KEY, provider);
  localStorage.setItem(APIKEY_KEY_PREFIX + provider, key);

  var mapIds = Object.keys(MAP_PRESETS);
  gameState.currentMapPresetId = pickRandom(mapIds);
  gameState.exploredLocations = []; 

  if (typeof WorldMemory !== 'undefined') {
    gameState.worldMemory = WorldMemory.createInitial();
  }

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
  gameState.exploredLocations = []; 
  
  if (typeof WorldMemory !== 'undefined') {
    gameState.worldMemory = WorldMemory.createInitial();
  }

  showGameScreen();
  playNextTestScript('__START__');
}

// --- 遊戲回合引擎 ---
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
    renderOptions([{ id: 'RETRY', label: '重新嘗試', risk_hint: '' }], makeOptionClickHandler);
    isWaitingForAI = false;
    showTyping(false);
  });
}

function handleFreeInputSend() {
  var text = dom.freeInputText.value.trim();
  if (!text) return;
  dom.freeInputText.value = '';
  dom.freeInputRow.classList.add('hidden');
  dom.freeInputToggle.classList.remove('hidden');
  requestNextTurn(text);
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

function playNextTestScript(playerAction) {
  if (playerAction !== '__START__') {
    appendPlayerAction(playerAction);
    gameState.lastPlayerAction = playerAction;
  }
  showTyping(true);
  setTimeout(function () {
    var script = CONFIG.TEST_SCRIPT;
    if (!script || script.length === 0) {
      appendGMText('測試劇本尚未載入。');
      renderOptions([{ id: 'RETRY', label: '重新嘗試', risk_hint: '' }], makeOptionClickHandler);
      showTyping(false);
      return;
    }
    var step = script[gameState.testScriptIndex % script.length];
    gameState.testScriptIndex += 1;
    handleAIResponse(step);
    showTyping(false);
  }, 600);
}

// --- 處理 AI 回傳狀態並更新系統 ---
function handleAIResponse(response) {
  var narrative = response.narrative;
  var status_update = response.status_update || {};
  var options = response.options || [];

  appendGMText(narrative);
  applyStatusUpdate(status_update);

  gameState.turnCount += 1;
  gameState.recentTurns.push({ turn: gameState.turnCount, narrative: narrative, action: gameState.lastPlayerAction || '(開局)' });
  if (gameState.recentTurns.length > CONFIG.MAX_RECENT_TURNS) {
    gameState.recentTurns.shift();
  }

  pendingMilestoneModals = [];

  if (typeof WorldMemory !== 'undefined') {
    if (response.world_memory_update) gameState.worldMemory = WorldMemory.applyWorldMemoryUpdate(gameState.worldMemory, response.world_memory_update, gameState.turnCount);
    if (response.background_evolution) gameState.worldMemory = WorldMemory.applyBackgroundEvolution(gameState.worldMemory, response.background_evolution, gameState.turnCount);
    if (response.relationship_update) gameState.worldMemory = WorldMemory.applyRelationshipUpdate(gameState.worldMemory, response.relationship_update, gameState.time.day);
    if (response.aspiration_update) {
      var aspResult = WorldMemory.applyAspirationUpdate(gameState.worldMemory, response.aspiration_update, gameState.time.day);
      gameState.worldMemory = aspResult.worldMemory;
      aspResult.milestones.forEach(function (m) {
        pendingMilestoneModals.push({ icon: '🎯', title: m.aspirationLabel + '志向進展', text: m.text });
      });
    }
  }

  if (status_update.special_event === 'death') {
    gameState.isDead = true;
    showDeathScreen(status_update.special_event_text || '你的旅程在此結束。');
    if (typeof saveStateToLocal === 'function') saveStateToLocal();
    if (typeof maybeSyncToNotion === 'function') maybeSyncToNotion();
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

  // NPC 覺醒狀態寫入
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

  // 觸發 NPC 微行動
  if (typeof processNpcMicroActions === 'function') {
    processNpcMicroActions();
  }
  
  renderOptions(options, makeOptionClickHandler);
  renderAll();
  
  if (typeof saveStateToLocal === 'function') saveStateToLocal();
  if (typeof maybeSyncToNotion === 'function') maybeSyncToNotion();

  showNextPendingModal();
}

function applyStatusUpdate(update) {
  if (!update) return;
  if (update.time_advance_minutes) advanceTime(update.time_advance_minutes);
  if (typeof update.stamina_change === 'number') gameState.stamina = clamp(gameState.stamina + update.stamina_change, 0, gameState.maxStamina);
  if (typeof update.hunger_change === 'number') gameState.hunger = clamp(gameState.hunger + update.hunger_change, 0, 100);
  
  if (update.current_location) {
    gameState.location = update.current_location;
    if (update.current_location !== '未知地點' && gameState.exploredLocations.indexOf(update.current_location) === -1) {
      gameState.exploredLocations.push(update.current_location);
    }
  }
  
  if (update.danger_level) {
    gameState.dangerLevel = update.danger_level;
    trackDangerLevel(update.danger_level);
  }
  
  if (update.weather) gameState.weather = update.weather;
  if (typeof update.humanity_change === 'number') gameState.humanity = clamp(gameState.humanity + update.humanity_change, 0, 100);
  if (typeof update.resonance_change === 'number') gameState.resonanceValue = clamp(gameState.resonanceValue + update.resonance_change, 0, 999);
  
  if (typeof update.ability_exp_change === 'number' && update.ability_exp_change !== 0) {
    if (typeof applyAbilityExpChange === 'function') applyAbilityExpChange(update.ability_exp_change);
  }
  
  if (update.injury_status) {
    gameState.injuryStatus = update.injury_status;
    if (update.injury_status === 'none') gameState.injuryDetail = '';
    else if (update.injury_detail) gameState.injuryDetail = update.injury_detail;
  }
  
  if (update.inventory_changes && update.inventory_changes.length && typeof applyInventoryChanges === 'function') {
    var autoRecovery = applyInventoryChanges(update.inventory_changes);
    if (autoRecovery > 0) gameState.hunger = clamp(gameState.hunger + autoRecovery, 0, 100);
  }

  if (update.companion_changes && update.companion_changes.length) {
    applyCompanionChanges(update.companion_changes);
  }
  
  // NPC 獨立狀態變化
  if (update.npc_status_updates && Array.isArray(update.npc_status_updates)) {
    update.npc_status_updates.forEach(function(npcUpdate) {
      if (npcUpdate.name && gameState.npcStates && gameState.npcStates[npcUpdate.name]) {
        var npc = gameState.npcStates[npcUpdate.name];
        if (typeof npcUpdate.stamina_change === 'number') npc.stamina = clamp(npc.stamina + npcUpdate.stamina_change, 0, 100);
        if (typeof npcUpdate.hunger_change === 'number') npc.hunger = clamp(npc.hunger + npcUpdate.hunger_change, 0, 100);
        
        if (npcUpdate.injury_status) npc.injuryStatus = npcUpdate.injury_status;
        if (npcUpdate.injury_status === 'none') npc.injuryDetail = '';
        else if (npcUpdate.injury_detail) npc.injuryDetail = npcUpdate.injury_detail;
        
        // NPC 背包變化
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
        
        // NPC 體格成長
        if (npcUpdate.proficiency_triggered && Array.isArray(npcUpdate.proficiency_triggered)) {
          npc.proficiency = npc.proficiency || { combat: 0, shooting: 0, agility: 0, scouting: 0, medical: 0, negotiation: 0, searching: 0, mechanics: 0 };
          npcUpdate.proficiency_triggered.forEach(function(prof) {
            if (typeof npc.proficiency[prof] !== 'undefined') npc.proficiency[prof] += 15;
          });
        }
      }
    });
  }

  // 技能熟練度增加
  if (update.proficiency_triggered && Array.isArray(update.proficiency_triggered) && typeof applyProficiencyGrowth === 'function') {
    applyProficiencyGrowth(gameState.skillProficiency, update.proficiency_triggered);
  }
  
  if (update.vehicle_update && update.vehicle_update.action && typeof applyVehicleUpdate === 'function') {
    applyVehicleUpdate(update.vehicle_update);
  }
  if (update.stash_update && update.stash_update.action && typeof applyStashUpdate === 'function') {
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
  
  if (update.special_event === 'awakening' || update.special_event === 'multi_awakening') {
    gameState.awakeningLevel = Math.max(gameState.awakeningLevel, 1);
  }
}

function applyCompanionChanges(changes) {
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    if (change.action === 'join') {
      if (gameState.companions.indexOf(change.name) === -1 && gameState.companions.length < 2) {
        gameState.companions.push(change.name);
      }
      if (typeof createNpcStateSkeleton === 'function') createNpcStateSkeleton(change.name);
      if (typeof correctNpcStateOnRejoin === 'function') correctNpcStateOnRejoin(change.name, gameState.turnCount);
    } else if (change.action === 'leave') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
      if (gameState.npcStates && gameState.npcStates[change.name]) {
        gameState.npcStates[change.name].lastLeftTurn = gameState.turnCount;
      }
    } else if (change.action === 'die') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
      if (typeof clearNpcStateOnDeath === 'function') clearNpcStateOnDeath(change.name);
    }
  }
}

// 綁定頁面載入啟動
document.addEventListener('DOMContentLoaded', init);