/* ============================================================
   app-response-handler.js（新檔案）
   職責：處理 AI 回應後的完整流程——套用狀態、更新世界記憶、
   判斷死亡／覺醒等特殊事件、渲染 UI、存檔。
   從原本的 app-api.js 搬移過來的 handleAIResponse()。

   【行為保證】內容與原 app-api.js 的 handleAIResponse() 完全一致，
   僅搬移檔案位置，不改變任何邏輯或呼叫順序。

   【載入順序要求】此檔案依賴 app-engine.js 的 applyStatusUpdate()、
   world_memory.js 的各種 apply* 函式、app-ui.js 的渲染函式，
   須放在這些檔案之後載入。建議順序：
   ... → world_memory.js → app-engine.js → app-ui.js → app-prompt.js
   → app-api.js → app-response-handler.js → ...
   ============================================================ */

'use strict';

function handleAIResponse(response) {
  var narrative = response.narrative;
  var status_update = response.status_update;
  var options = response.options;

  appendGMText(narrative);

  // applyStatusUpdate() 回傳正規化後的 special_event，
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