'use strict';

/**
 * 宣告 npcStates 結構與函式
 */

// 1. NPC 狀態初始化
function createNpcStateSkeleton(npcName) {
  if (!gameState.npcStates) gameState.npcStates = {};
  if (!gameState.npcStates[npcName]) {
    gameState.npcStates[npcName] = {
      hunger: 100,
      stamina: 100,
      injuryStatus: 'none',
      inventory: [],
      awakeningLevel: 0,
      lastLeftTurn: -1,
      proficiency: {
        combat: 0, shooting: 0, agility: 0, scouting: 0,
        medical: 0, negotiation: 0, searching: 0, mechanics: 0
      }
    };
  }
}

// 2. 離隊與復隊校正
function correctNpcStateOnRejoin(npcName, currentTurn) {
  var npc = gameState.npcStates[npcName];
  if (!npc) return;
  
  if (npc.lastLeftTurn !== -1 && (currentTurn - npc.lastLeftTurn >= 15)) {
    // 離隊超過 15 回合，進行狀態校正（模擬 NPC 自己在外求生）
    npc.hunger = Math.max(50, npc.hunger);
    npc.stamina = Math.max(50, npc.stamina);
    npc.injuryStatus = 'none'; // 假設傷勢已隨時間緩解
    console.log('[NPC系統] ' + npcName + ' 離隊過久，狀態已校正。');
  }
  npc.lastLeftTurn = -1; // 重置離隊標記
}

// 3. 死亡清除邏輯
function clearNpcStateOnDeath(npcName) {
  if (gameState.npcStates && gameState.npcStates[npcName]) {
    delete gameState.npcStates[npcName];
    console.log('[NPC系統] ' + npcName + ' 已死亡，狀態資料清除。');
  }
}

// 4. NPC 微行動：自動進食
function processNpcMicroActions() {
  if (!gameState.npcStates) return;
  var activeNpcs = gameState.companions || [];
  
  for (var i = 0; i < activeNpcs.length; i++) {
    var npcName = activeNpcs[i];
    var npc = gameState.npcStates[npcName];
    if (!npc) continue;

    // 當飢餓度低於 40，且背包內有食物時，自動消耗一份
    if (npc.hunger < 40 && npc.inventory && npc.inventory.length > 0) {
      for (var j = 0; j < npc.inventory.length; j++) {
        var item = npc.inventory[j];
        if (isLikelyFood(item.name) && !isWaterOnly(item.name)) {
          var recovery = getFoodRecoveryAmount(item.name);
          applyInventoryChangesTo(npc.inventory, [{ name: item.name, quantity: 1, action: 'remove' }]);
          npc.hunger = Math.min(100, npc.hunger + recovery);
          console.log('[NPC微行動] ' + npcName + ' 自動消耗了 1 份 ' + item.name);
          break; // 每回合只吃一個
        }
      }
    }
  }
}
