'use strict';

// 【接線】從 app-events.js 的 handleFreeInputSend() 呼叫，
// 若回傳 true 代表指令已被攔截處理，呼叫端不應再把該文字送給 AI。
function tryHandleDevCommand(text) {
  if (!CONFIG.DEV_MODE) return false;

  if (text.startsWith('#give ')) {
    handleGiveCommand(text);
    return true;
  }

  if (text.startsWith('#makesafe ')) {
    handleMakeSafeCommand(text);
    return true;
  }

  return false;
}

function handleGiveCommand(text) {
  var parts = text.split(' ');
  if (parts.length >= 2) {
    var cheatItemName = parts[1];
    var cheatQty = parts.length > 2 ? parseInt(parts[2], 10) : 1;
    if (isNaN(cheatQty)) cheatQty = 1;

    if (typeof applyInventoryChangesTo === 'function') {
      applyInventoryChangesTo(gameState.inventory, [{ name: cheatItemName, quantity: cheatQty, action: 'add' }]);
    }
    if (typeof appendGMText === 'function') {
      appendGMText('[開發者權限] 虛空扭曲，已將 ' + cheatItemName + ' x' + cheatQty + ' 加入背包。');
    }
    if (typeof renderAll === 'function') renderAll();

    console.log('作弊成功：已獲得 ' + cheatItemName + ' x' + cheatQty);
  }

  resetFreeInputUI();
}

function handleMakeSafeCommand(text) {
  var zoneName = text.replace('#makesafe ', '').trim();
  if (!zoneName) zoneName = '銅礦基地';

  // 改為呼叫 WorldMemory 正規入口，統一走座標分配（PREDEFINED_COORDS）、
  // 數量上限（capList）與自動建倉庫邏輯。
  gameState.worldMemory = WorldMemory.applyWorldMemoryUpdate(
    gameState.worldMemory,
    {
      new_safe_zone: {
        name: zoneName,
        location: gameState.location || '未知地點',
        population: 2,
        facilities: ['基礎防禦', '物資儲藏櫃']
      }
    },
    gameState.turnCount
  );

  var createdZone = gameState.worldMemory.safeZones.find(function (zone) {
    return zone && zone.name === zoneName;
  });

  if (
    createdZone &&
    typeof createdZone.x === 'number' &&
    typeof createdZone.y === 'number'
  ) {
    gameState.location = zoneName;

    gameState.exploredLocations = Array.isArray(gameState.exploredLocations)
      ? gameState.exploredLocations
      : [];

    if (gameState.exploredLocations.indexOf(zoneName) === -1) {
      gameState.exploredLocations.push(zoneName);
    }
  } else {
    console.warn(
      '[開發者權限] 基地「' +
      zoneName +
      '」沒有有效座標，未變更玩家位置。'
    );
  }

  if (typeof appendGMText === 'function') {
    appendGMText('[開發者權限] 虛空扭曲，已強制將此地註冊為基地「' + zoneName + '」，並開闢專屬物資庫。');
  }

  resetFreeInputUI();
  if (typeof renderAll === 'function') renderAll();
}

// 共用的輸入框重置邏輯（原本每個作弊指令都各自重複這三行）
function resetFreeInputUI() {
  dom.narrative.freeInputText.value = '';
  dom.narrative.freeInputRow.classList.add('hidden');
  dom.narrative.freeInputToggle.classList.remove('hidden');
}
