/* ============================================================
   app-prompt.js（新檔案）
   職責：組裝送給 AI 的完整 Prompt（狀態快照、世界記憶、近期回合、
   死亡判定提示等），從原本的 app-api.js 搬移過來。

   【行為保證】所有函式內容與原 app-api.js 完全一致，僅搬移檔案位置，
   不改變任何邏輯。app-api.js 之後只保留「呼叫 AI 供應商 API」的職責。

   【小幅優化說明】getStaminaLabel／getHungerLabel／getInjuryLabel
   原本定義在 buildContextPayload() 函式內部（閉包函式），每次呼叫
   buildContextPayload()（也就是每個回合）都會重新建立一次函式物件。
   現搬移為模組頂層函式，行為完全相同，只是不再重複建立。

   【載入順序要求】此檔案需放在 app-api.js 之前，因為 app-api.js 的
   callGeminiAPI／callOpenAICompatibleAPI 會呼叫本檔案的
   buildFullPrompt()。建議順序：
   ... → app-engine.js → app-prompt.js → app-api.js →
   app-response-handler.js → ...
   ============================================================ */

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

  // 狀態形容詞轉換邏輯（解決 AI 認知脫節）
  var playerStaminaLabel = getStaminaLabel(gameState.stamina, gameState.maxStamina);
  var playerHungerLabel = getHungerLabel(gameState.hunger);
  var playerInjuryLabel = getInjuryLabel(gameState.injuryStatus);

  var npcStatusString = '';
  if (gameState.companions && gameState.companions.length > 0) {
    var npcDetails = [];
    gameState.companions.forEach(function (npcName) {
      if (gameState.npcStates && gameState.npcStates[npcName]) {
        var npc = gameState.npcStates[npcName];
        var nStamina = getStaminaLabel(npc.stamina || 100, 100);
        var nHunger = getHungerLabel(npc.hunger || 100);
        var nInjury = getInjuryLabel(npc.injuryStatus || 'none');
        npcDetails.push(npcName + '(體力:' + Math.round(npc.stamina || 100) + ' ' + nStamina + ', 飽食:' + Math.round(npc.hunger || 100) + ' ' + nHunger + ', 傷勢:' + nInjury + ')');
      } else {
        npcDetails.push(npcName + '(狀態未知)');
      }
    });
    npcStatusString = npcDetails.join('；');
  } else {
    npcStatusString = '無';
  }

  // 將冷冰冰的數字替換為帶有形容詞的強制狀態
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

  var worldMemoryContext = WorldMemory.buildWorldMemoryPrompt(gameState.worldMemory, gameState.time.day);

  var pacingHint = getDangerPacingHint();
  if (pacingHint) {
    userText += ' ' + pacingHint;
  }

  // 偵測死亡條件，動態插入強制提示
  var deathHint = '';
  if (typeof checkEntityDeathCondition === 'function') {
    // 檢查主角
    if (checkEntityDeathCondition(gameState.stamina, gameState.injuryStatus)) {
      deathHint += '【系統強制指令】主角的體力已歸零且處於重度受傷狀態，本回合必須觸發死亡判定，請依規則安排主角死亡或被救援的劇情，並於 special_event 回報 death 或 rescued。';
    }
    // 檢查 NPC
    if (gameState.companions && gameState.npcStates) {
      gameState.companions.forEach(function (npcName) {
        var npc = gameState.npcStates[npcName];
        if (npc && checkEntityDeathCondition(npc.stamina, npc.injuryStatus)) {
          deathHint += '【系統強制指令】隨行隊員「' + npcName + '」的體力已歸零且處於重度受傷狀態，本回合必須安排該NPC死亡或絕命掩護的劇情，並於 companion_changes 回報 die。';
        }
      });
    }
  }

  // 將死亡提示附加到玩家輸入的最後面，確保 AI 強烈關注
  if (deathHint !== '') {
    userText += '\\n\\n' + deathHint;
  }

  var dayHint = gameState.time.day <= 15
    ? "【時間線限制】目前為末日初期，所有變異體皆為普通物理變異，腦內僅有透明晶核，不可出現屬性喪屍。"
    : "【時間線演進】變異體已開始與靜默頻率深度共鳴，屍群中出現具備【金/木/水/火/土/電/狂化】屬性變異體的機率大幅提高。";

  worldMemoryContext += '\\n【世界地理位置】' + (typeof WORLD_MACRO_MAP !== 'undefined' ? WORLD_MACRO_MAP : '');
  worldMemoryContext += '\\n' + dayHint;

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

/* ---------- 狀態形容詞轉換工具（原本是 buildContextPayload 內部的閉包函式）---------- */

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