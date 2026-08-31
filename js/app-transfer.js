'use strict';

var transferState = {
  isTransferMode: false,
  currentSource: null // { type, id, name, max }
};

document.addEventListener('DOMContentLoaded', function() {
  var toggle = document.getElementById('transfer-mode-toggle');
  if (toggle) {
    toggle.addEventListener('change', function(e) {
      transferState.isTransferMode = e.target.checked;
      // 刷新所有面板以切換可點擊狀態
      if (typeof renderItemsAccordion === 'function') renderItemsAccordion();
      if (typeof renderVehiclePanel === 'function') renderVehiclePanel();
      if (typeof renderNpcPanel === 'function') renderNpcPanel();
    });
  }

  var cancelBtn = document.getElementById('transfer-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      document.getElementById('transfer-modal').classList.add('hidden');
    });
  }

  var confirmBtn = document.getElementById('transfer-confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', executeTransferFromModal);
  }
});

function openTransferModal(sourceType, sourceId, itemName, maxQty) {
  if (!transferState.isTransferMode) return;
  transferState.currentSource = { type: sourceType, id: sourceId, name: itemName, max: maxQty };
  
  var modal = document.getElementById('transfer-modal');
  var nameEl = document.getElementById('transfer-item-name');
  var selectEl = document.getElementById('transfer-target-select');
  var qtyInput = document.getElementById('transfer-qty-input');
  
  nameEl.textContent = '物品：' + itemName + ' (最多 ' + maxQty + ' 個)';
  qtyInput.value = 1;
  qtyInput.max = maxQty;

  selectEl.innerHTML = ''; // 清空選單
  
  // 建立轉移目標清單
  //
  // 【物資來源類型設計說明，供未來擴充參考】
  // 目前系統有兩種來源類型：
  //   1. 單例類型（全域只有一份，不需要 id 區分）：
  //      - backpack（主角背包）→ 固定傳入空字串作為 id 佔位
  //   2. 多例類型（陣列中可能有多筆，必須用 id 精確定位）：
  //      - stash（暫存點）→ 使用 stash.id
  //      - vehicle（載具）→ 使用 vehicle.id
  //      - npc（隨行隊員）→ 使用 npcName 本身作為 id（因為 npcStates
  //        是以名字為 key 的物件，不是陣列，故用名字取代生成的 id）
  //
  // 若未來新增物資來源類型，請先判斷該類型在 gameState 中是否可能同時
  // 存在多筆：
  //   - 若「是」（例如未來若載具拆分成「駕駛座」「後車廂」兩個獨立儲存
  //     格），必須設計唯一 id 傳入 addOption 第二參數，並在
  //     getInventoryRef() 對應分支中使用該 id 查找。
  //   - 若「否」（例如未來若新增「主角個人保險箱」這種全域單例儲存），
  //     可比照 backpack 的作法傳入空字串佔位，並在 getInventoryRef()
  //     對應分支中直接回傳該全域物件，不使用 id 參數。
  function addOption(val, text) {
    if (val === sourceType + '_' + sourceId) return; // 排除來源自己
    var opt = document.createElement('option');
    opt.value = val;
    opt.textContent = text;
    selectEl.appendChild(opt);
  }

  // 【單例類型】背包：id 固定留空，getInventoryRef('backpack', id) 不使用 id 參數
  addOption('backpack_', '隨身背包');
  // 【多例類型】暫存點：使用 stash.id 精確定位
  gameState.stashes.forEach(function (s) { addOption('stash_' + s.id, '暫存點：' + s.locationName); });
  // 【多例類型】載具：使用 vehicle.id 精確定位
  gameState.vehicles.forEach(function (v) { if (v.status !== 'lost') addOption('vehicle_' + v.id, '載具：' + v.name); });
  // 【多例類型】NPC：npcStates 以名字為 key，故用名字本身作為 id
  gameState.companions.forEach(function (npcName) { addOption('npc_' + npcName, '隊員背包：' + npcName); });
  
  if (selectEl.options.length === 0) {
    alert('沒有其他可轉移的目標！');
    return;
  }
  
  modal.classList.remove('hidden');
}

function getInventoryRef(type, id) {
  if (type === 'backpack') return gameState.inventory;
  if (type === 'stash') {
    for (var i = 0; i < gameState.stashes.length; i++) {
      if (gameState.stashes[i].id === id) return gameState.stashes[i].items;
    }
  }
  if (type === 'vehicle') {
    for (var j = 0; j < gameState.vehicles.length; j++) {
      if (gameState.vehicles[j].id === id) return gameState.vehicles[j].cargo;
    }
  }
  if (type === 'npc') {
    if (gameState.npcStates && gameState.npcStates[id]) return gameState.npcStates[id].inventory;
  }
  return null;
}

function executeTransferFromModal() {
  if (!transferState.currentSource) return;
  var qty = parseInt(document.getElementById('transfer-qty-input').value, 10);
  if (isNaN(qty) || qty <= 0 || qty > transferState.currentSource.max) {
    alert('無效的數量');
    return;
  }
  
  var targetVal = document.getElementById('transfer-target-select').value;
  if (!targetVal) return;
  
  var parts = targetVal.split('_');
  var targetType = parts[0];
  var targetId = parts.slice(1).join('_');
  
  var sourceInv = getInventoryRef(transferState.currentSource.type, transferState.currentSource.id);
  var targetInv = getInventoryRef(targetType, targetId);
  
  if (!sourceInv || !targetInv) {
    alert('找不到來源或目標背包，轉移失敗。');
    return;
  }
  
  // 執行轉移（使用第一階段寫好的共用函式）
  applyInventoryChangesTo(sourceInv, [{ name: transferState.currentSource.name, quantity: qty, action: 'remove' }]);
  applyInventoryChangesTo(targetInv, [{ name: transferState.currentSource.name, quantity: qty, action: 'add' }]);
  
  document.getElementById('transfer-modal').classList.add('hidden');
  
  // 轉移後刷新所有 UI
  if (typeof renderItemsAccordion === 'function') renderItemsAccordion();
  if (typeof renderVehiclePanel === 'function') renderVehiclePanel();
  if (typeof renderNpcPanel === 'function') renderNpcPanel();
  
  console.log('[物資轉移] 成功將 ' + qty + ' 個 ' + transferState.currentSource.name + ' 從 ' + transferState.currentSource.type + ' 轉移至 ' + targetType);
}
