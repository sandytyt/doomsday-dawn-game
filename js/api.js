/* ============================================
   末日黎明：喪屍浩劫 — AI 通訊與提詞模組 (api.js)
   職責：負責打包遊戲狀態、組合 Prompt，並向大語言模型 (Gemini/OpenAI 相容) 發送 API 請求
   ============================================ */

// ----------------------------------------
// 1. 打包傳送給 AI 的上下文 (Context Payload)
// ----------------------------------------
function buildContextPayload(playerAction) {
  var userText = '';
  if (playerAction === '__START__') {
    var c = gameState.charSetup;
    userText = '請開始遊戲，生成開局場景。玩家設定為：性別' + c.gender + '，初始地點' + c.location + '，末世前職業' + c.occupation + '。請自然融入敘事。絕對不可為玩家命名，必須全程使用第二人稱「你」來稱呼玩家。';
  } else {
    userText = '你的行動：' + playerAction;
  }

  // 檢查是否需要觸發背景演化
  var triggerBackgroundEvolution = false;
  if (typeof WorldMemory !== 'undefined') {
    triggerBackgroundEvolution = WorldMemory.shouldTriggerBackgroundEvolution(gameState.worldMemory, gameState.turnCount);
    if (triggerBackgroundEvolution) {
      userText += ' 請檢查背景演化。';
    }
  }

  // 整理物品與同伴名單
  var inventoryList = gameState.inventory.map(function (it) {
    return it.name + 'x' + it.quantity;
  }).join('、');
  var companionList = gameState.companions.join('、');

  // 組裝數值快照 (套用 Math.round 避免浮點數干擾 AI)
  var statusSnapshot = '當前狀態：第' + gameState.time.day + '天 ' + pad2(gameState.time.hour) + ':' + pad2(gameState.time.minute) +
    '，地點：' + gameState.location + '，體力：' + Math.round(gameState.stamina) + '/' + gameState.maxStamina +
    '，飽食度：' + Math.round(gameState.hunger) + '，人性值：' + Math.round(gameState.humanity) +
    '，共鳴值：' + Math.round(gameState.resonanceValue) + '，覺醒等級：' + gameState.awakeningLevel +
    '，能力熟練度：' + gameState.abilityExp + '/' + getAbilityExpNeeded(gameState.awakeningLevel) +
    '，危險等級：' + gameState.dangerLevel + '，傷勢：' + gameState.injuryStatus +
    '，背包負重：' + getInventoryLoadLevel(gameState.inventory) + '，持有物品：' + (inventoryList || '無') +
    '，隨行隊員：' + (companionList || '無') +
    '，回合數：' + gameState.turnCount;

  // 組裝近期回合記錄
  var recentParts = [];
  for (var i = 0; i < gameState.recentTurns.length; i++) {
    var t = gameState.recentTurns[i];
    recentParts.push('第' + t.turn + '回合劇情：' + t.narrative + ' 玩家行動：' + t.action);
  }
  var recentContext = recentParts.join(' ');

  // 危險節奏緩衝提示
  var pacingHint = (typeof getDangerPacingHint === 'function') ? getDangerPacingHint() : '';
  if (pacingHint) {
    userText += ' ' + pacingHint;
  }
  
  // 偵測死亡條件，動態插入強制提示
  var deathHint = '';
  if (typeof checkEntityDeathCondition === 'function') {
    if (checkEntityDeathCondition(gameState.stamina, gameState.injuryStatus)) {
      deathHint += '【系統強制指令】主角的體力已歸零且處於重度受傷狀態，本回合必須觸發死亡判定，請依規則安排主角死亡或被救援的劇情，並於 special_event 回報 death 或 rescued。';
    }
    if (gameState.companions && gameState.npcStates) {
      gameState.companions.forEach(function(npcName) {
        var npc = gameState.npcStates[npcName];
        if (npc && checkEntityDeathCondition(npc.stamina, npc.injuryStatus)) {
          deathHint += '【系統強制指令】隨行隊員「' + npcName + '」的體力已歸零且處於重度受傷狀態，本回合必須安排該NPC死亡或絕命掩護的劇情，並於 companion_changes 回報 die。';
        }
      });
    }
  }
  if (deathHint !== '') {
    userText += '\n\n' + deathHint;
  }
  
  // 時間線演進 (前期透明晶核 / 後期屬性晶核)
  var dayHint = gameState.time.day <= 15 
    ? "【時間線限制】目前為末日初期，所有變異體皆為普通物理變異，腦內僅有透明晶核，不可出現屬性喪屍。" 
    : "【時間線演進】變異體已開始與靜默頻率深度共鳴，屍群中出現具備【金/木/水/火/土/電/狂化】屬性變異體的機率大幅提高。";
    
  var worldMemoryContext = '';
  if (typeof WorldMemory !== 'undefined') {
    worldMemoryContext = WorldMemory.buildWorldMemoryPrompt(gameState.worldMemory, gameState.time.day);
  }
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

// ----------------------------------------
// 2. 組合字串給不同 API
// ----------------------------------------
function buildFullPrompt(payload) {
  return payload.statusSnapshot + ' ' + (payload.worldMemoryContext || '') + 
         ' 近期回合記錄： ' + (payload.recentContext || '尚無歷史這是開局') + 
         ' 本回合玩家輸入： ' + payload.userText;
}

// ----------------------------------------
// 3. API 呼叫分配器
// ----------------------------------------
function callAIProvider(payload) {
  var providerConf = CONFIG.PROVIDERS[gameState.provider] || CONFIG.PROVIDERS.gemini;
  if (providerConf.format === 'gemini') {
    return callGeminiAPI(payload, providerConf);
  }
  return callOpenAICompatibleAPI(payload, providerConf);
}

// ----------------------------------------
// 4. Gemini API 專用通道
// ----------------------------------------
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

// ----------------------------------------
// 5. OpenAI 格式相容 API (DeepSeek / Qwen 等)
// ----------------------------------------
function callOpenAICompatibleAPI(payload, providerConf) {
  var fullPrompt = buildFullPrompt(payload);
  
  // 【升級】順手幫其他模型也補上四個完整的規則檔案
  var systemText = (gameState.rulesText || '') +
                   '\n\n【世界觀與主線真相】\n' + (gameState.loreText || '') +
                   '\n\n【技能樹與判定鐵律】\n' + (gameState.skillTreesText || '') +
                   '\n\n【勢力與地緣政治】\n' + (gameState.factionsText || '');

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
