'use strict';

var statusExpanded = false;
var optionsMiniMode = false;
var inventoryExpanded = false;
var npcExpanded = false;
var vehicleExpanded = false;
var stashExpanded = false;

/* ---------- 安全事件綁定工具 ---------- */

function bindSafe(element, eventType, handler, label) {
  if (!element) {
    console.warn('[UI警告] 找不到元素「' + (label || '(未命名)') + '」，已略過 ' + eventType + ' 事件綁定。請確認 index.html 對應的 id 是否存在。');
    return false;
  }
  element.addEventListener(eventType, handler);
  return true;
}

function bindEvents() {
  bindSafe(dom.setup.providerSelect, 'change', handleProviderChange, 'setup.providerSelect');
  bindSafe(dom.setup.startBtn, 'click', handleStartGame, 'setup.startBtn');
  bindSafe(dom.setup.testModeBtn, 'click', handleStartTestMode, 'setup.testModeBtn');
  bindSafe(dom.setup.importSaveBtn, 'click', function () { dom.setup.importSaveFile.click(); }, 'setup.importSaveBtn');
  bindSafe(dom.setup.importSaveFile, 'change', handleImportFile, 'setup.importSaveFile');
  bindSafe(dom.setup.charSetupToggle, 'click', function () { toggleCollapse(dom.setup.charSetupToggle, dom.setup.charSetupFields); }, 'setup.charSetupToggle');
  bindSafe(dom.status.expandBtn, 'click', handleStatusExpandClick, 'status.expandBtn');
  bindSafe(dom.menu.toggleBtn, 'click', handleMenuToggleClick, 'menu.toggleBtn');
  bindSafe(dom.menu.backdrop, 'click', function () { toggleSideMenu(false); }, 'menu.backdrop');
  bindSafe(dom.menu.closeBtn, 'click', function () { toggleSideMenu(false); }, 'menu.closeBtn');
  bindSafe(dom.menu.exportBtn, 'click', handleExportSave, 'menu.exportBtn');
  bindSafe(dom.menu.importBtn, 'click', handleMenuImportClick, 'menu.importBtn');
  bindSafe(dom.menu.namedSaveBtn, 'click', handleOpenNamedSave, 'menu.namedSaveBtn');
  bindSafe(dom.menu.saveManagerBtn, 'click', handleOpenSaveManager, 'menu.saveManagerBtn');
  bindSafe(dom.modal.namedSaveClose, 'click', function () { dom.modal.namedSave.classList.add('hidden'); }, 'modal.namedSaveClose');
  bindSafe(dom.modal.saveTabLocal, 'click', function () { switchSaveTab('local'); }, 'modal.saveTabLocal');
  bindSafe(dom.modal.saveTabNotion, 'click', function () { switchSaveTab('notion'); }, 'modal.saveTabNotion');
  bindSafe(dom.menu.restartBtn, 'click', handleRestart, 'menu.restartBtn');
  bindSafe(dom.menu.apikeyBtn, 'click', handleChangeApiKey, 'menu.apikeyBtn');

  // 【綁定開啟手冊】
  bindSafe(dom.setup.rulesLinkBtn, 'click', function () { toggleManualModal(true); }, 'setup.rulesLinkBtn');
  bindSafe(dom.menu.rulesBtn, 'click', function () { toggleSideMenu(false); setTimeout(function () { toggleManualModal(true); }, 200); }, 'menu.rulesBtn');
 
  bindSafe(dom.menu.notionSetupToggle, 'click', function () { toggleCollapse(dom.menu.notionSetupToggle, dom.menu.notionSetupFields); }, 'menu.notionSetupToggle');
  bindSafe(dom.menu.notionSaveBtn, 'click', handleSaveNotionConfig, 'menu.notionSaveBtn');
  bindSafe(dom.menu.notionSyncNowBtn, 'click', handleNotionSyncNow, 'menu.notionSyncNowBtn');
  bindSafe(dom.narrative.optionsCollapseToggle, 'click', handleOptionsCollapseClick, 'narrative.optionsCollapseToggle');
  bindSafe(dom.narrative.actionCollapsedBar, 'click', handleOptionsCollapseClick, 'narrative.actionCollapsedBar');
  bindSafe(dom.narrative.freeInputToggle, 'click', handleFreeInputToggleClick, 'narrative.freeInputToggle');
  bindSafe(dom.narrative.freeInputCancel, 'click', handleFreeInputCancelClick, 'narrative.freeInputCancel');
  bindSafe(dom.narrative.freeInputSend, 'click', handleFreeInputSend, 'narrative.freeInputSend');
  bindSafe(dom.narrative.freeInputText, 'keypress', handleFreeInputKeypress, 'narrative.freeInputText');
  bindSafe(dom.modal.eventClose, 'click', handleEventModalClose, 'modal.eventClose');

  // 【終端機 UI 綁定】
  bindSafe(dom.infoPanelGroup.toggleBtn, 'click', function () { toggleInfoPanel(true); }, 'infoPanelGroup.toggleBtn');
  bindSafe(dom.infoPanelGroup.backdrop, 'click', function () { toggleInfoPanel(false); }, 'infoPanelGroup.backdrop');
  bindSafe(dom.infoPanelGroup.close, 'click', function () { toggleInfoPanel(false); }, 'infoPanelGroup.close');

  var infoTabBtns = document.querySelectorAll('.info-tab-btn');
  var infoPanes = document.querySelectorAll('.info-pane');

  if (infoTabBtns.length > 0) {
    infoTabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // 移除所有啟動狀態
        infoTabBtns.forEach(function (b) { b.classList.remove('active'); });
        infoPanes.forEach(function (p) { p.classList.add('hidden'); });

        // 啟動當前點擊的頁籤
        btn.classList.add('active');
        var targetId = btn.getAttribute('data-target');
        var targetPane = document.getElementById(targetId);
        if (targetPane) {
          targetPane.classList.remove('hidden');
        }
      });
    });
  }

  // 【階段5新增：背景類型與自訂配點，含雙重警告】
  bindSafe(dom.setup.bgSelect, 'change', handleBackgroundTypeChange, 'setup.bgSelect');
  if (dom.setup.generalistDiv) {
    var pointInputs = dom.setup.generalistDiv.querySelectorAll('.gen-point-input');
    if (pointInputs.length === 0) {
      console.warn('[UI警告] 在「setup.generalistDiv」內找不到任何「.gen-point-input」元素，已略過自訂配點欄位的 input 事件綁定。請確認 index.html 對應結構是否存在。');
    }
    for (var j = 0; j < pointInputs.length; j++) {
      pointInputs[j].addEventListener('input', handleGeneralistPointChange);
    }
  } else {
    console.warn('[UI警告] 找不到元素「setup.generalistDiv」，已略過自訂配點欄位的 input 事件綁定。請確認 index.html 對應的 id 是否存在。');
  }
}

function handleProviderChange() {
  var provider = dom.setup.providerSelect.value;
  localStorage.setItem(PROVIDER_KEY, provider);
  var savedKey = localStorage.getItem(APIKEY_KEY_PREFIX + provider);
  dom.setup.apiKeyInput.value = savedKey || '';
}

function handleStatusExpandClick() {
  statusExpanded = !statusExpanded;
  dom.status.panelFull.classList.toggle('hidden', !statusExpanded);
  dom.status.expandBtn.classList.toggle('expanded', statusExpanded);
}

function handleMenuToggleClick(e) {
  e.stopPropagation();
  toggleSideMenu(true);
}

function handleMenuImportClick() {
  toggleSideMenu(false);
  setTimeout(function () { dom.setup.importSaveFile.click(); }, 200);
}

function handleOptionsCollapseClick() {
  optionsMiniMode = !optionsMiniMode;
  applyOptionsDisplayMode();
}

function handleFreeInputToggleClick() {
  dom.narrative.freeInputRow.classList.remove('hidden');
  dom.narrative.freeInputToggle.classList.add('hidden');
  dom.narrative.freeInputText.focus();
}

function handleFreeInputCancelClick() {
  dom.narrative.freeInputRow.classList.add('hidden');
  dom.narrative.freeInputToggle.classList.remove('hidden');
  dom.narrative.freeInputText.value = '';
}

function handleFreeInputKeypress(e) {
  if (e.key === 'Enter') handleFreeInputSend();
}

function handleFreeInputSend() {
  var text = dom.narrative.freeInputText.value.trim();
  if (!text) return;

  // 開發者作弊指令攔截：若為合法指令且已處理，直接中斷，不送給 AI。
  // 指令定義集中於 app-devtools.js，並受 CONFIG.DEV_MODE 開關保護。
  if (typeof tryHandleDevCommand === 'function' && tryHandleDevCommand(text)) {
    return;
  }

  // 原本正常的發送邏輯
  dom.narrative.freeInputText.value = '';
  dom.narrative.freeInputRow.classList.add('hidden');
  dom.narrative.freeInputToggle.classList.remove('hidden');
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
  dom.menu.sideMenu.classList.toggle('hidden', !show);
}

function toggleInfoPanel(show) {
  if (!dom.infoPanelGroup.panel) return;
  dom.infoPanelGroup.panel.classList.toggle('hidden', !show);
  // 打開終端機時，一次性渲染所有資料
  if (show) {
    renderCharProfile();
    renderItemsAccordion();
    renderNpcPanel();
    renderVehiclePanel();
  }
}

function toggleManualModal(show) {
  if (!dom.modal || !dom.modal.manual) {
    console.warn('[UI警告] 找不到元素「modal.manual」，無法切換手冊彈窗。請確認 cacheDom() 是否已完成，以及 index.html 是否有 id="manual-modal"。');
    return;
  }

  dom.modal.manual.classList.toggle('hidden', !show);
}

function setupManualTabs() {
  var tabBtns = document.querySelectorAll('.manual-tab-btn');
  if (tabBtns.length === 0) return;

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      // 移除所有按鈕的 active 狀態
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      // 隱藏所有分頁內容
      document.querySelectorAll('.manual-pane').forEach(function (pane) { pane.classList.add('hidden'); });

      // 顯示被點擊的內容
      this.classList.add('active');
      var targetId = this.getAttribute('data-target');
      var targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.remove('hidden');
    });
  });
}

function handleBackgroundTypeChange() {
  if (dom.setup.bgSelect.value === 'generalist') {
    dom.setup.generalistDiv.classList.remove('hidden');
  } else {
    dom.setup.generalistDiv.classList.add('hidden');
  }
}

function handleGeneralistPointChange(e) {
  var inputs = dom.setup.generalistDiv.querySelectorAll('.gen-point-input');
  var total = 0;
  for (var i = 0; i < inputs.length; i++) {
    total += parseInt(inputs[i].value, 10) || 0;
  }

  if (total > 3) {
    e.target.value = parseInt(e.target.value, 10) - (total - 3);
    total = 3;
    alert('點數上限為 3 點'); // 提示用語精簡
  }

  var leftSpan = dom.setup.generalistPointsLeft;
  if (leftSpan) leftSpan.textContent = (3 - total);
}
