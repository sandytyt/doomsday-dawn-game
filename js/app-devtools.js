/* ============================================================
   app-devtools.js（新檔案）
   職責：集中管理所有開發者作弊指令，從 app-events.js 搬移過來。

   【本次變更內容】
   - #give：搬移，內容不變。
   - #makesafe：搬移，並延續上一輪已修正的版本（改走
     WorldMemory.applyWorldMemoryUpdate() 正規入口）。
   - #delfaction：依使用者指示，本次「移除」此指令（不再搬移）。
     若未來需要清除誤植的陣營資料，建議改用瀏覽器 console 直接操作
     gameState.factionTrust，或日後在此檔案重新設計更安全的版本。
   - 新增 CONFIG.DEV_MODE 開關：關閉時，所有 # 開頭的指令會被當成
     一般劇情輸入直接送給 AI，不會被攔截，避免正式上線後玩家意外
     或惡意觸發開發者功能。

   【載入順序要求】此檔案依賴 dom、gameState、WorldMemory、
   appendGMText、renderAll、applyInventoryChangesTo，
   建議放在 app-events.js 之前、app-ui.js 之後載入。
   ============================================================ */

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

  if (typeof appendGMText === 'function') {
    appendGMText('[開發者權限] 虛空扭曲，已強制將此地註冊為基地「' + zoneName + '」，並開闢專屬物資庫。');
  }

  resetFreeInputUI();
  if (typeof renderAll === 'function') renderAll();
}

// 共用的輸入框重置邏輯（原本每個作弊指令都各自重複這三行）
function resetFreeInputUI() {
  dom.freeInputText.value = '';
  dom.freeInputRow.classList.add('hidden');
  dom.freeInputToggle.classList.remove('hidden');
}
