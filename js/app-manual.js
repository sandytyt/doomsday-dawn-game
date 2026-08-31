'use strict';

window.initManualSystem = function () {
  var modal = document.getElementById('manual-modal');
  if (!modal) return;

  // 綁定右上角關閉按鈕
  var closeBtn = document.getElementById('manual-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      modal.classList.add('hidden');
    });
  }

  // 綁定頁籤切換邏輯
  var tabBtns = modal.querySelectorAll('.manual-tab-btn');
  var panes = modal.querySelectorAll('.manual-pane');

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      // 移除所有啟動狀態
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      panes.forEach(function (p) { p.classList.add('hidden'); });

      // 啟動當前點擊的頁籤
      btn.classList.add('active');
      var targetId = btn.getAttribute('data-target');
      var targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.remove('hidden');
      }
    });
  });
};

// 確保網頁載入後，自動執行初始化
document.addEventListener('DOMContentLoaded', window.initManualSystem);document.addEventListener('DOMContentLoaded', window.initManualSystem);
