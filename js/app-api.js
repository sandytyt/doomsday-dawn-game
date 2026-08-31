'use strict';

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

  // ─── 新增：狀態形容詞轉換邏輯 (解決 AI 認知脫節) ───
  function getStaminaLabel(val, max) {
    var ratio = val / max;
    if (ratio >= 0.8) return '充沛(完全不累)';
    if (ratio >= 0.5) return '正常(輕微疲勞)';
    if (ratio >= 0.2) return '疲憊(需要休息)';
    return '力竭(無法進行劇烈運動)';
  }

  function getHungerLabel(val) {
    if (val >= 80) return '飽足(不需要進食)';
    if (val >= 50) return '微餓(狀態正常)';
    if (val >= 20) return '飢餓(急需尋找食物)';
    return '極度飢餓(體力流失中)';
  }

  function getInjuryLabel(status) {
    if (status === 'none') return '健康(完全無傷)';
    if (status === 'minor') return '輕傷(包紮後可行動)';
    return '重傷(急需醫療支援)';
  }

  var playerStaminaLabel = getStaminaLabel(gameState.stamina, gameState.maxStamina);
  var playerHungerLabel = getHungerLabel(gameState.hunger);
  var playerInjuryLabel = getInjuryLabel(gameState.injuryStatus);

  var npcStatusString = '';
  if (gameState.companions && gameState.companions.length > 0) {
    var npcDetails = [];
    gameState.companions.forEach(function(npcName) {
      if (gameState.npcStates && gameState.npcStates[npcName]) {
        var npc = gameState.npcStates[npcName];
        var nStamina = getStaminaLabel(npc.stamina || 100, 100);
        var nHunger = getHungerLabel(npc.hunger || 100);
        var nInjury = getInjuryLabel(npc.injuryStatus || 'none');
        npcDetails.push(npcName + '(體力:' + Math.round(npc.stamina||100) + ' ' + nStamina + ', 飽食:' + Math.round(npc.hunger||100) + ' ' + nHunger + ', 傷勢:' + nInjury + ')');
      } else {
        npcDetails.push(npcName + '(狀態未知)');
      }
    });
    npcStatusString = npcDetails.join('；');
  } else {
    npcStatusString = '無';
  }

  // ─── 修改：將冷冰冰的數字替換為帶有形容詞的強制狀態 ───
  var statusSnapshot = '【系統強制當前狀態】第' + gameState.time.day + '天 ' + pad2(gameState.time.hour) + ':' + pad2(gameState.time.minute) +
    '，地點：' + gameState.location + 
    '，主角體力：' + Math.round(gameState.stamina) + '/' + gameState.maxStamina + ' (' + playerStaminaLabel + ')' +
    '，主角飽食度：' + Math.round(gameState.hunger) + ' (' + playerHungerLabel + ')' +
    '，主角傷勢：' + playerInjuryLabel +
    '，人性值：' + Math.round(gameState.humanity) +
    '，共鳴值：' + Math.round(gameState.resonanceValue) + '，覺醒等級：' + gameState.awakeningLevel +
    '，能力熟練度：' + gameState.abilityExp + '/' + getAbilityExpNeeded(gameState.awakeningLevel) +
    '，危險等級：' + gameState.dangerLevel + 
    '，背包負重：' + getInventoryLoadLevel(gameState.inventory) + '，持有物品：' + (inventoryList || '無') +
    '，隨行隊員及狀態：' + npcStatusString +
    '，回合數：' + gameState.turnCount;

  var recentParts = [];
  for (var i = 0; i < gameState.recentTurns.length; i++) {
    var t = gameState.recentTurns[i];
    recentParts.push('第' + t.turn + '回合劇情：' + t.narrative + ' 玩家行動：' + t.action);
  }
  var recentContext = recentParts.join(' ');
  
  // 修正重複宣告 var worldMemoryContext 的小 Bug
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

function buildFullPrompt(payload) {
  return payload.statusSnapshot + ' ' + (payload.worldMemoryContext || '') + ' 近期回合記錄： ' + (payload.recentContext || '尚無歷史這是開局') + ' 本回合玩家輸入： ' + payload.userText;
}

function callAIProvider(payload) {
  var providerConf = CONFIG.PROVIDERS[gameState.provider] || CONFIG.PROVIDERS.gemini;
  if (providerConf.format === 'gemini') {
    return callGeminiAPI(payload, providerConf);
  }
  return callOpenAICompatibleAPI(payload, providerConf);
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

  // 【接線】applyStatusUpdate() 現在回傳正規化後的 special_event，
  // 後續判斷一律使用這個值，不再讀取原始 status_update.special_event
  var normalizedSpecialEvent = applyStatusUpdate(status_update);

  // 建立基地後，強制將主角位置移動到基地內部
  if (response.world_memory_update && response.world_memory_update.new_safe_zone) {
    var nz = response.world_memory_update.new_safe_zone;
    // 如果 AI 回傳的是陣列，就抓第一筆；如果是物件，就直接用
    var targetZone = Array.isArray(nz) ? nz[0] : nz;

    if (targetZone && targetZone.name) {
      gameState.location = targetZone.name; // 主角自動進入新建的基地
      if (gameState.exploredLocations.indexOf(targetZone.name) === -1) {
        gameState.exploredLocations.push(targetZone.name);
      }
    }
  }

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

  if (normalizedSpecialEvent === 'death') {
    gameState.isDead = true;
    showDeathScreen(status_update.special_event_text || '你的旅程在此結束。');
    saveStateToLocal();
    maybeSyncToNotion();
    return;
  } else if (normalizedSpecialEvent === 'rescued') {
    pendingMilestoneModals.unshift({ icon: '🩹', title: '瀕死獲救', text: status_update.special_event_text || '有人在最後一刻拉住了你。' });
  } else if (normalizedSpecialEvent === 'awakening') {
    pendingMilestoneModals.unshift({ icon: '⚡', title: '異能覺醒', text: status_update.special_event_text || '你感覺到體內有某種力量正在覺醒' });
  } else if (normalizedSpecialEvent === 'multi_awakening') {
    pendingMilestoneModals.unshift({ icon: '⚡⚡', title: '多重覺醒', text: status_update.special_event_text || '不只一種力量在你體內同時甦醒' });
  } else if (normalizedSpecialEvent === 'level_up') {
    pendingMilestoneModals.unshift({ icon: '🔺', title: '能力進化', text: status_update.special_event_text || '你的能力形態出現了變化' });
  } else if (normalizedSpecialEvent && normalizedSpecialEvent !== 'none') {
    pendingMilestoneModals.unshift({ icon: '❗', title: '重要事件', text: status_update.special_event_text || '發生了重要的事情' });
  }

  // 處理 NPC 覺醒狀態寫入
  if (response.world_memory_update && response.world_memory_update.npc_major_event) {
    var ne = response.world_memory_update.npc_major_event;
    if (ne.ability && gameState.npcStates && gameState.npcStates[ne.name]) {
      gameState.npcStates[ne.name].awakeningLevel = Math.max(gameState.npcStates[ne.name].awakeningLevel, 1);
    }
  }
  if (response.background_evolution && Array.isArray(response.background_evolution.npc_updates)) {
    response.background_evolution.npc_updates.forEach(function (nu) {
      if (nu.ability && gameState.npcStates && gameState.npcStates[nu.name]) {
        gameState.npcStates[nu.name].awakeningLevel = Math.max(gameState.npcStates[nu.name].awakeningLevel, 1);
      }
    });
  }

  // 觸發 NPC 微行動（例如：自動進食）
  if (typeof processNpcMicroActions === 'function') {
    processNpcMicroActions();
  }

  renderOptions(options);
  renderAll();
  saveStateToLocal();
  maybeSyncToNotion();

  showNextPendingModal();
}
