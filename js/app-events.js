'use strict';

var statusExpanded = false;
var optionsMiniMode = false;
var inventoryExpanded = false;
var npcExpanded = false;
var vehicleExpanded = false;
var stashExpanded = false;

function bindEvents() {
  dom.providerSelect.addEventListener('change', handleProviderChange);
  dom.startBtn.addEventListener('click', handleStartGame);
  if (dom.testModeBtn) dom.testModeBtn.addEventListener('click', handleStartTestMode);
  dom.importSaveBtn.addEventListener('click', function () { dom.importSaveFile.click(); });
  dom.importSaveFile.addEventListener('change', handleImportFile);
  dom.charSetupToggle.addEventListener('click', function () { toggleCollapse(dom.charSetupToggle, dom.charSetupFields); });
  dom.statusExpandBtn.addEventListener('click', handleStatusExpandClick);
  dom.menuToggleBtn.addEventListener('click', handleMenuToggleClick);
  dom.sideMenuBackdrop.addEventListener('click', function () { toggleSideMenu(false); });
  dom.menuCloseBtn.addEventListener('click', function () { toggleSideMenu(false); });
  dom.menuExportBtn.addEventListener('click', handleExportSave);
  dom.menuImportBtn.addEventListener('click', handleMenuImportClick);
  dom.menuNamedSaveBtn.addEventListener('click', handleOpenNamedSave);
  dom.menuSaveManagerBtn.addEventListener('click', handleOpenSaveManager);
  dom.namedSaveClose.addEventListener('click', function () { dom.namedSaveModal.classList.add('hidden'); });
  dom.saveTabLocal.addEventListener('click', function () { switchSaveTab('local'); });
  dom.saveTabNotion.addEventListener('click', function () { switchSaveTab('notion'); });
  dom.menuRestartBtn.addEventListener('click', handleRestart);
  dom.menuApikeyBtn.addEventListener('click', handleChangeApiKey);
  
  // 【綁定開啟手冊】
  if (dom.rulesLinkBtn) dom.rulesLinkBtn.addEventListener('click', function () { toggleManualModal(true); });
  if (dom.menuRulesBtn) dom.menuRulesBtn.addEventListener('click', function () { toggleSideMenu(false); setTimeout(function () { toggleManualModal(true); }, 200); });
  if (dom.manualCloseBtn) dom.manualCloseBtn.addEventListener('click', function () { toggleManualModal(false); });
  
  dom.notionSetupToggle.addEventListener('click', function () { toggleCollapse(dom.notionSetupToggle, dom.notionSetupFields); });
  dom.notionSaveBtn.addEventListener('click', handleSaveNotionConfig);
  dom.notionSyncNowBtn.addEventListener('click', handleNotionSyncNow);
  dom.optionsCollapseToggle.addEventListener('click', handleOptionsCollapseClick);
  dom.actionCollapsedBar.addEventListener('click', handleOptionsCollapseClick);
  dom.freeInputToggle.addEventListener('click', handleFreeInputToggleClick);
  dom.freeInputCancel.addEventListener('click', handleFreeInputCancelClick);
  dom.freeInputSend.addEventListener('click', handleFreeInputSend);
  dom.freeInputText.addEventListener('keypress', handleFreeInputKeypress);
  dom.eventModalClose.addEventListener('click', handleEventModalClose);
  if (dom.panelsToggleBtn) dom.panelsToggleBtn.addEventListener('click', function () { toggleInfoPanel(true); });
  if (dom.infoPanelBackdrop) dom.infoPanelBackdrop.addEventListener('click', function () { toggleInfoPanel(false); });
  if (dom.infoPanelClose) dom.infoPanelClose.addEventListener('click', function () { toggleInfoPanel(false); });
  if (dom.itemsSectionToggle) dom.itemsSectionToggle.addEventListener('click', function () { toggleCollapse(dom.itemsSectionToggle, dom.itemsSectionBody); });
  if (dom.npcSectionToggle) dom.npcSectionToggle.addEventListener('click', function () { toggleCollapse(dom.npcSectionToggle, dom.npcSectionBody); renderNpcPanel(); });
  if (dom.charProfileToggle) dom.charProfileToggle.addEventListener('click', function () { toggleCollapse(dom.charProfileToggle, dom.charProfileBody); renderCharProfile(); });
  if (dom.vehicleSectionToggle) dom.vehicleSectionToggle.addEventListener('click', function () { toggleCollapse(dom.vehicleSectionToggle, dom.vehicleSectionBody); });

  // 【階段5新增】
  if (dom.bgSelect) dom.bgSelect.addEventListener('change', handleBackgroundTypeChange);
  if (dom.generalistDiv) {
    var pointInputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
    for (var j = 0; j < pointInputs.length; j++) {
      pointInputs[j].addEventListener('input', handleGeneralistPointChange);
    }
  }
}

function handleProviderChange() {
  var provider = dom.providerSelect.value;
  localStorage.setItem(PROVIDER_KEY, provider);
  var savedKey = localStorage.getItem(APIKEY_KEY_PREFIX + provider);
  dom.apiKeyInput.value = savedKey || '';
}

function handleStatusExpandClick() {
  statusExpanded = !statusExpanded;
  dom.statusPanelFull.classList.toggle('hidden', !statusExpanded);
  dom.statusExpandBtn.classList.toggle('expanded', statusExpanded);
}

function handleMenuToggleClick(e) {
  e.stopPropagation();
  toggleSideMenu(true);
}

function handleMenuImportClick() {
  toggleSideMenu(false);
  setTimeout(function () { dom.importSaveFile.click(); }, 200);
}

function handleOptionsCollapseClick() {
  optionsMiniMode = !optionsMiniMode;
  applyOptionsDisplayMode();
}

function handleFreeInputToggleClick() {
  dom.freeInputRow.classList.remove('hidden');
  dom.freeInputToggle.classList.add('hidden');
  dom.freeInputText.focus();
}

function handleFreeInputCancelClick() {
  dom.freeInputRow.classList.add('hidden');
  dom.freeInputToggle.classList.remove('hidden');
  dom.freeInputText.value = '';
}

function handleFreeInputKeypress(e) {
  if (e.key === 'Enter') handleFreeInputSend();
}

function handleFreeInputSend() {
  var text = dom.freeInputText.value.trim();
  if (!text) return;

  // ─── 開發者專屬作弊系統攔截 ───
  if (text.startsWith('#give ')) {
    var parts = text.split(' ');
    if (parts.length >= 2) {
      var cheatItemName = parts[1];
      var cheatQty = parts.length > 2 ? parseInt(parts[2], 10) : 1;
      if (isNaN(cheatQty)) cheatQty = 1;
      
      // 呼叫新增物品
      if (typeof applyInventoryChangesTo === 'function') {
        applyInventoryChangesTo(gameState.inventory, [{ name: cheatItemName, quantity: cheatQty, action: 'add' }]);
        
        if (typeof appendGMText === 'function') {
          appendGMText('[開發者權限] 虛空扭曲，已將 ' + cheatItemName + ' x' + cheatQty + ' 加入背包。');
        }
        if (typeof renderAll === 'function') renderAll();
        
        console.log('作弊成功：已獲得 ' + cheatItemName + ' x' + cheatQty);
      }
      
      // 恢復 UI 狀態並中斷，不把這句話傳給 AI
      dom.freeInputText.value = '';
      dom.freeInputRow.classList.add('hidden');
      dom.freeInputToggle.classList.remove('hidden');
      return; 
    }
  }
  // 【新增】：刪除錯誤勢力的作弊指令
  if (text.startsWith('#delfaction ')) {
    var factionToDel = text.replace('#delfaction ', '').trim();
    
    if (gameState.factionTrust && typeof gameState.factionTrust[factionToDel] !== 'undefined') {
      delete gameState.factionTrust[factionToDel]; // 刪除該勢力
      
      if (typeof appendGMText === 'function') {
         appendGMText('[開發者權限] 虛空扭曲，已將錯誤勢力「' + factionToDel + '」從系統記憶中徹底抹除。');
      }
      if (typeof renderAll === 'function') renderAll();
    } else {
      if (typeof appendGMText === 'function') {
         appendGMText('[系統] 找不到名為「' + factionToDel + '」的勢力紀錄。');
      }
    }
    
    // 恢復 UI 狀態並中斷，不把這句話傳給 AI
    dom.freeInputText.value = '';
    dom.freeInputRow.classList.add('hidden');
    dom.freeInputToggle.classList.remove('hidden');
    return;
  }
  // ────────────────────────────────

  // 原本正常的發送邏輯
  dom.freeInputText.value = '';
  dom.freeInputRow.classList.add('hidden');
  dom.freeInputToggle.classList.remove('hidden');
  requestNextTurn(text);
}

function toggleCollapse(btn, body) {
  var isHidden = body.classList.contains('hidden');
  if (isHidden) {
    body.classList.remove('hidden');
    btn.classList.add('expanded');
  } else {
    body.classList.add('hidden');
    btn.classList.remove('expanded');
  }
}

function toggleSideMenu(show) {
  dom.sideMenu.classList.toggle('hidden', !show);
}

function toggleInfoPanel(show) {
  if (!dom.infoPanel) return;
  dom.infoPanel.classList.toggle('hidden', !show);
  if (show) {
    renderCharProfile();
    renderItemsAccordion();
    renderNpcPanel();
    renderVehiclePanel();
  }
}

function toggleManualModal(show) {
  // 動態抓取確保不報錯
  if (!dom.manualModal) {
    dom.manualModal = document.getElementById('manual-modal');
    dom.manualCloseBtn = document.getElementById('manual-close-btn');
    if (dom.manualCloseBtn) dom.manualCloseBtn.addEventListener('click', function () { toggleManualModal(false); });
  }

  // 真的抓不到就報錯警告
  if (!dom.manualModal) {
    console.error("找不到手冊 UI！請確認 index.html 中是否有 id='manual-modal'");
    return;
  }
  
  dom.manualModal.classList.toggle('hidden', !show);
}

function setupManualTabs() {
  var tabBtns = document.querySelectorAll('.manual-tab-btn');
  if (tabBtns.length === 0) return;
  
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      // 移除所有按鈕的 active 狀態
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      // 隱藏所有分頁內容
      document.querySelectorAll('.manual-pane').forEach(function(pane) { pane.classList.add('hidden'); });
      
      // 顯示被點擊的內容
      this.classList.add('active');
      var targetId = this.getAttribute('data-target');
      var targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.remove('hidden');
    });
  });
}

function handleBackgroundTypeChange() {
  if (dom.bgSelect.value === 'generalist') {
    dom.generalistDiv.classList.remove('hidden');
  } else {
    dom.generalistDiv.classList.add('hidden');
  }
}

function handleGeneralistPointChange(e) {
  var inputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
  var total = 0;
  for (var i = 0; i < inputs.length; i++) {
    total += parseInt(inputs[i].value, 10) || 0;
  }
  
  if (total > 3) {
    e.target.value = parseInt(e.target.value, 10) - (total - 3);
    total = 3;
    alert('點數上限為 3 點'); // 提示用語精簡
  }
  
  var leftSpan = document.getElementById('generalist-points-left');
  if (leftSpan) leftSpan.textContent = (3 - total);
}