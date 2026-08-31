var statusExpanded = false;
var optionsMiniMode = false;
var inventoryExpanded = false;
var npcExpanded = false;
var vehicleExpanded = false;
var stashExpanded = false;

/* ---------- 安全事件綁定工具 ---------- */

// 統一的安全綁定入口：element 為 null/undefined 時只警告，不拋錯。
// label 用於 console 訊息，方便直接定位是哪一個 dom.xxx 缺失。
function bindSafe(element, eventType, handler, label) {
  if (!element) {
    console.warn('[UI警告] 找不到元素「' + (label || '(未命名)') + '」，已略過 ' + eventType + ' 事件綁定。請確認 index.html 對應的 id 是否存在。');
    return false;
  }
  element.addEventListener(eventType, handler);
  return true;
}

function bindEvents() {
  bindSafe(dom.providerSelect, 'change', handleProviderChange, 'providerSelect');
  bindSafe(dom.startBtn, 'click', handleStartGame, 'startBtn');
  bindSafe(dom.testModeBtn, 'click', handleStartTestMode, 'testModeBtn');
  bindSafe(dom.importSaveBtn, 'click', function () { dom.importSaveFile.click(); }, 'importSaveBtn');
  bindSafe(dom.importSaveFile, 'change', handleImportFile, 'importSaveFile');
  bindSafe(dom.charSetupToggle, 'click', function () { toggleCollapse(dom.charSetupToggle, dom.charSetupFields); }, 'charSetupToggle');
  bindSafe(dom.statusExpandBtn, 'click', handleStatusExpandClick, 'statusExpandBtn');
  bindSafe(dom.menuToggleBtn, 'click', handleMenuToggleClick, 'menuToggleBtn');
  bindSafe(dom.sideMenuBackdrop, 'click', function () { toggleSideMenu(false); }, 'sideMenuBackdrop');
  bindSafe(dom.menuCloseBtn, 'click', function () { toggleSideMenu(false); }, 'menuCloseBtn');
  bindSafe(dom.menuExportBtn, 'click', handleExportSave, 'menuExportBtn');
  bindSafe(dom.menuImportBtn, 'click', handleMenuImportClick, 'menuImportBtn');
  bindSafe(dom.menuNamedSaveBtn, 'click', handleOpenNamedSave, 'menuNamedSaveBtn');
  bindSafe(dom.menuSaveManagerBtn, 'click', handleOpenSaveManager, 'menuSaveManagerBtn');
  bindSafe(dom.namedSaveClose, 'click', function () { dom.namedSaveModal.classList.add('hidden'); }, 'namedSaveClose');
  bindSafe(dom.saveTabLocal, 'click', function () { switchSaveTab('local'); }, 'saveTabLocal');
  bindSafe(dom.saveTabNotion, 'click', function () { switchSaveTab('notion'); }, 'saveTabNotion');
  bindSafe(dom.menuRestartBtn, 'click', handleRestart, 'menuRestartBtn');
  bindSafe(dom.menuApikeyBtn, 'click', handleChangeApiKey, 'menuApikeyBtn');

  // 【綁定開啟手冊】
  bindSafe(dom.rulesLinkBtn, 'click', function () { toggleManualModal(true); }, 'rulesLinkBtn');
  bindSafe(dom.menuRulesBtn, 'click', function () { toggleSideMenu(false); setTimeout(function () { toggleManualModal(true); }, 200); }, 'menuRulesBtn');
  bindSafe(dom.manualCloseBtn, 'click', function () { toggleManualModal(false); }, 'manualCloseBtn');

  bindSafe(dom.notionSetupToggle, 'click', function () { toggleCollapse(dom.notionSetupToggle, dom.notionSetupFields); }, 'notionSetupToggle');
  bindSafe(dom.notionSaveBtn, 'click', handleSaveNotionConfig, 'notionSaveBtn');
  bindSafe(dom.notionSyncNowBtn, 'click', handleNotionSyncNow, 'notionSyncNowBtn');
  bindSafe(dom.optionsCollapseToggle, 'click', handleOptionsCollapseClick, 'optionsCollapseToggle');
  bindSafe(dom.actionCollapsedBar, 'click', handleOptionsCollapseClick, 'actionCollapsedBar');
  bindSafe(dom.freeInputToggle, 'click', handleFreeInputToggleClick, 'freeInputToggle');
  bindSafe(dom.freeInputCancel, 'click', handleFreeInputCancelClick, 'freeInputCancel');
  bindSafe(dom.freeInputSend, 'click', handleFreeInputSend, 'freeInputSend');
  bindSafe(dom.freeInputText, 'keypress', handleFreeInputKeypress, 'freeInputText');
  bindSafe(dom.eventModalClose, 'click', handleEventModalClose, 'eventModalClose');

  // 【終端機 UI 綁定】
  bindSafe(dom.panelsToggleBtn, 'click', function () { toggleInfoPanel(true); }, 'panelsToggleBtn');
  bindSafe(dom.infoPanelBackdrop, 'click', function () { toggleInfoPanel(false); }, 'infoPanelBackdrop');
  bindSafe(dom.infoPanelClose, 'click', function () { toggleInfoPanel(false); }, 'infoPanelClose');

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
  bindSafe(dom.bgSelect, 'change', handleBackgroundTypeChange, 'bgSelect');
  if (dom.generalistDiv) {
    var pointInputs = dom.generalistDiv.querySelectorAll('.gen-point-input');
    if (pointInputs.length === 0) {
      console.warn('[UI警告] 在「generalistDiv」內找不到任何「.gen-point-input」元素，已略過自訂配點欄位的 input 事件綁定。請確認 index.html 對應結構是否存在。');
    }
    for (var j = 0; j < pointInputs.length; j++) {
      pointInputs[j].addEventListener('input', handleGeneralistPointChange);
    }
  } else {
    console.warn('[UI警告] 找不到元素「generalistDiv」，已略過自訂配點欄位的 input 事件綁定。請確認 index.html 對應的 id 是否存在。');
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

  // 開發者作弊指令攔截：若為合法指令且已處理，直接中斷，不送給 AI。
  // 指令定義集中於 app-devtools.js，並受 CONFIG.DEV_MODE 開關保護。
  if (typeof tryHandleDevCommand === 'function' && tryHandleDevCommand(text)) {
    return;
  }

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
  // 打開終端機時，一次性渲染所有資料
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
