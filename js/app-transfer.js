'use strict';

var transferState = {
  isTransferMode: false,
  currentSource: null // { type, id, name, max }
};

function initTransferUI() {
  var toggle = dom.infoPanelGroup && dom.infoPanelGroup.transferModeToggle;
  if (toggle) {
    toggle.addEventListener('change', function (e) {
      transferState.isTransferMode = e.target.checked;
      // 刷新所有面板以切換可點擊狀態
      if (typeof renderItemsAccordion === 'function') renderItemsAccordion();
      if (typeof renderVehiclePanel === 'function') renderVehiclePanel();
      if (typeof renderNpcPanel === 'function') renderNpcPanel();
    });
  } else {
    console.warn('[UI警告] 找不到元素「infoPanelGroup.transferModeToggle」，已略過物資轉移模式開關事件綁定。請確認 index.html 是否有 id="transfer-mode-toggle"。');
  }

  var transferModal = dom.modal && dom.modal.transfer;
  if (!transferModal) {
    console.warn('[UI警告] 找不到「modal.transfer」分組，已略過物資轉移彈窗按鈕事件綁定。請確認 cacheDom() 是否已新增轉移彈窗快取。');
    return;
  }

  if (transferModal.cancelBtn) {
    transferModal.cancelBtn.addEventListener('click', function () {
      transferModal.root.classList.add('hidden');
    });
  } else {
    console.warn('[UI警告] 找不到元素「modal.transfer.cancelBtn」，無法綁定轉移彈窗取消按鈕。');
  }

  if (transferModal.confirmBtn) {
    transferModal.confirmBtn.addEventListener('click', executeTransferFromModal);
  } else {
    console.warn('[UI警告] 找不到元素「modal.transfer.confirmBtn」，無法綁定轉移彈窗確認按鈕。');
  }
};

function openTransferModal(sourceType, sourceId, itemName, maxQty) {
  if (!transferState.isTransferMode) return;
  transferState.currentSource = { type: sourceType, id: sourceId, name: itemName, max: maxQty };

  var transferModal = dom.modal && dom.modal.transfer;
  if (!transferModal || !transferModal.root || !transferModal.itemName || !transferModal.targetSelect || !transferModal.quantityInput) {
    console.warn('[UI警告] 物資轉移彈窗快取不完整，無法開啟。請確認 cacheDom() 的 dom.modal.transfer 分組包含 root、itemName、targetSelect、quantityInput。');
    return;
  }

  var modal = transferModal.root;
  var nameEl = transferModal.itemName;
  var selectEl = transferModal.targetSelect;
  var qtyInput = transferModal.quantityInput;

  nameEl.textContent = '物品：' + itemName + ' (最多 ' + maxQty + ' 個)';
  qtyInput.value = 1;
  qtyInput.max = maxQty;

  // 【既有 Bug 修復保留】每次打開彈窗前，先清空舊選項，避免重複累積。
  selectEl.innerHTML = '';

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
  // 存在多筆：多筆類型須有唯一 id 並於 getInventoryRef() 內用 id 查找；
  // 單例類型可比照 backpack 傳入空字串佔位，並直接回傳全域物件。
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

  var transferModal = dom.modal && dom.modal.transfer;
  if (!transferModal || !transferModal.root || !transferModal.targetSelect || !transferModal.quantityInput) {
    console.warn('[UI警告] 物資轉移彈窗快取不完整，無法確認轉移。');
    return;
  }

  var qty = parseInt(transferModal.quantityInput.value, 10);
  if (isNaN(qty) || qty <= 0 || qty > transferState.currentSource.max) {
    alert('無效的數量');
    return;
  }

  var targetVal = transferModal.targetSelect.value;
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

  // 執行轉移（使用共用物資處理函式）
  applyInventoryChangesTo(sourceInv, [{ name: transferState.currentSource.name, quantity: qty, action: 'remove' }]);
  applyInventoryChangesTo(targetInv, [{ name: transferState.currentSource.name, quantity: qty, action: 'add' }]);

  transferModal.root.classList.add('hidden');

  // 轉移後刷新所有 UI
  if (typeof renderItemsAccordion === 'function') renderItemsAccordion();
  if (typeof renderVehiclePanel === 'function') renderVehiclePanel();
  if (typeof renderNpcPanel === 'function') renderNpcPanel();

  console.log('[物資轉移] 成功將 ' + qty + ' 個 ' + transferState.currentSource.name + ' 從 ' + transferState.currentSource.type + ' 轉移至 ' + targetType);
}
