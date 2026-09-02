'use strict';

function initManualSystem() {
  var modal = dom.modal && dom.modal.manual;
  var closeBtn = dom.modal && dom.modal.manualClose;

  if (!modal) {
    console.warn('[UI警告] 找不到元素「modal.manual」，已略過手冊事件初始化。請確認 index.html 是否有 id="manual-modal"。');
    return;
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      modal.classList.add('hidden');
    });
  } else {
    console.warn('[UI警告] 找不到元素「modal.manualClose」，無法綁定手冊關閉按鈕。');
  }

  var tabBtns = modal.querySelectorAll('.manual-tab-btn');
  var panes = modal.querySelectorAll('.manual-pane');

  if (tabBtns.length === 0) {
    console.warn('[UI警告] 在「modal.manual」內找不到任何「.manual-tab-btn」元素，已略過手冊頁籤事件綁定。');
    return;
  }

  if (panes.length === 0) {
    console.warn('[UI警告] 在「modal.manual」內找不到任何「.manual-pane」元素，已略過手冊頁籤事件綁定。');
    return;
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      panes.forEach(function (pane) { pane.classList.add('hidden'); });

      btn.classList.add('active');
      var targetId = btn.getAttribute('data-target');
      var targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.remove('hidden');
      } else {
        console.warn('[UI警告] 手冊頁籤目標不存在：#' + targetId);
      }
    });
  });
}
