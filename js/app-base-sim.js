'use strict';

// ─── 基地模擬引擎 (Colony Simulation Engine) ───

// 啟動每日結算 (支援玩家一次出門多天的快速運算)
window.runDailyBaseSimulation = function(daysPassed) {
  var worldMemory = gameState.worldMemory || {};
  var safeZones = worldMemory.safeZones || [];
  gameState.stashes = gameState.stashes || [];
  
  if (safeZones.length === 0) return;

  var allReports = [];

  for (var d = 0; d < daysPassed; d++) {
    safeZones.forEach(function(zone) {
      if (!zone.population || zone.population <= 0) return;
      
      // 【修復核心】：如果找不到這個避難所的倉庫，就自動初始化一個空的，絕對不要 return！
      var stash = gameState.stashes.find(function(s) { return s.locationName === zone.name; });
      if (!stash) {
        stash = { id: 'base_' + Date.now() + '_' + Math.floor(Math.random()*1000), locationName: zone.name, items: [] };
        gameState.stashes.push(stash);
      }

      var report = processSingleDayForZone(zone, stash);
      
      if (d === daysPassed - 1 || report.starvationDeaths > 0) {
        allReports.push(report);
      }
    });
  }

  if (allReports.length > 0) {
    renderDailyReportModal(allReports, daysPassed);
  }
};

// 單一安全區的單日運算邏輯
function processSingleDayForZone(zone, stash) {
  var pop = zone.population;
  var report = {
    name: zone.name,
    population: pop,
    produced: {},
    consumed: {},
    warnings: [],
    starvationDeaths: 0
  };

  // 1. 【生產階段】：勞動力限制 (1人最多運作1設施)
  var facilities = zone.facilities || [];
  var activeFacilities = facilities.slice(0, pop); // 截取等同於人口數量的設施
  
  if (facilities.length > pop) {
    report.warnings.push('勞動力不足：有 ' + (facilities.length - pop) + ' 座設施停工。');
  }

  activeFacilities.forEach(function(f) {
    var outName = '';
    var outQty = 0;
    
    if (f.indexOf('農場') !== -1) { outName = '生肉'; outQty = 2; }
    else if (f.indexOf('水培') !== -1) { outName = '新鮮蔬菜'; outQty = 2; }
    else if (f.indexOf('溫室') !== -1) { outName = '水果'; outQty = 2; }
    else if (/(集水|淨水|水井|雨水)/.test(f)) { outName = '過濾水'; outQty = 2; }
    else if (f.indexOf('拾荒') !== -1) { outName = Math.random() > 0.5 ? '廢鐵' : '木材'; outQty = 2; }
    else if (/(誘捕|分離)/.test(f)) { outName = '透明晶核'; outQty = 1; }

    if (outName) {
      applyInventoryChangesTo(stash.items, [{ name: outName, quantity: outQty, action: 'add' }]);
      report.produced[outName] = (report.produced[outName] || 0) + outQty;
    }
  });

  // 2. 【消耗階段】：智能進食優先權
  var foodNeeded = pop;
  var waterNeeded = pop;

  // 過濾並排序倉庫物資 (數值越小，越優先被吃掉)
  var availableFood = stash.items.filter(function(i) { return typeof isLikelyFood === 'function' && isLikelyFood(i.name) && !isWaterOnly(i.name); })
                                 .sort(function(a, b) { return getConsumePriority(a.name) - getConsumePriority(b.name); });
                                 
  var availableWater = stash.items.filter(function(i) { return typeof isWaterOnly === 'function' && isWaterOnly(i.name); })
                                  .sort(function(a, b) { return getConsumePriority(a.name) - getConsumePriority(b.name); });

  // 扣除食物
  for (var i = 0; i < availableFood.length && foodNeeded > 0; i++) {
    var item = availableFood[i];
    var take = Math.min(item.quantity, foodNeeded);
    applyInventoryChangesTo(stash.items, [{ name: item.name, quantity: take, action: 'remove' }]);
    report.consumed[item.name] = (report.consumed[item.name] || 0) + take;
    foodNeeded -= take;
  }
  
  // 扣除水分
  for (var j = 0; j < availableWater.length && waterNeeded > 0; j++) {
    var wItem = availableWater[j];
    var wTake = Math.min(wItem.quantity, waterNeeded);
    applyInventoryChangesTo(stash.items, [{ name: wItem.name, quantity: wTake, action: 'remove' }]);
    report.consumed[wItem.name] = (report.consumed[wItem.name] || 0) + wTake;
    waterNeeded -= wTake;
  }

  // 3. 【危機階段】：飢荒與死亡判定
  var missing = foodNeeded + waterNeeded;
  if (missing > 0) {
    report.warnings.push('庫存枯竭！缺少 ' + missing + ' 份基本飲食。');
    
    // 每個缺少的食物/水，帶來 30% 的人口流失機率
    for (var k = 0; k < missing; k++) {
      if (Math.random() < 0.3) {
        report.starvationDeaths++;
        zone.population = Math.max(0, zone.population - 1);
      }
    }
    
    if (report.starvationDeaths > 0) {
      report.warnings.push('嚴重飢荒：失去了 ' + report.starvationDeaths + ' 名居民。');
      if (typeof appendGMText === 'function') {
         appendGMText('[系統警告] ' + zone.name + ' 發生嚴重飢荒，導致人口流失與暴動，請盡速返回處理！');
      }
    }
  }

  return report;
}

// 智能消耗權重 (1=最優先, 99=絕對捨不得吃)
function getConsumePriority(name) {
  if (/(野果|生肉|蔬菜|水果)/.test(name)) return 1;    // 容易腐壞的生鮮最先吃
  if (/(髒水|半瓶)/.test(name)) return 1;           // 劣質水先喝
  if (/(過濾水|湯|飯|菜)/.test(name)) return 2;     // 一般產出物
  if (/(餅乾|糖|零食)/.test(name)) return 3;        // 零食類
  if (/(軍用罐頭|能量棒|純水|醫療包)/.test(name)) return 99; // 高價值物資絕對保留
  return 10;
}

// ─── UI 報表渲染 ───
function renderDailyReportModal(reports, daysPassed) {
  var modal = document.getElementById('daily-report-modal');
  var content = document.getElementById('daily-report-content');
  if (!modal || !content) return;

  var html = '';
  if (daysPassed > 1) {
    html += '<div style="color: #888; margin-bottom: 15px;">(歷經 ' + daysPassed + ' 天的時間流逝，以下為最終日結算狀態)</div>';
  }

  reports.forEach(function(r) {
    html += '<div style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px dashed #444;">';
    html += '<div class="report-log-title">📍 ' + r.name + ' (目前人口: ' + r.population + ')</div>';
    
    // 渲染產出
    var prodKeys = Object.keys(r.produced);
    if (prodKeys.length > 0) {
      html += '<div class="report-log-positive">🟩 設施產出：';
      var pStr = prodKeys.map(function(k) { return k + ' x' + r.produced[k]; }).join(', ');
      html += pStr + '</div>';
    } else {
      html += '<div class="report-log-neutral">🟩 設施產出：無</div>';
    }

    // 渲染消耗
    var consKeys = Object.keys(r.consumed);
    if (consKeys.length > 0) {
      html += '<div class="report-log-neutral">🔻 居民消耗：';
      var cStr = consKeys.map(function(k) { return k + ' x' + r.consumed[k]; }).join(', ');
      html += cStr + '</div>';
    }

    // 渲染警告與飢荒
    if (r.warnings.length > 0) {
      r.warnings.forEach(function(w) {
        var warnClass = w.indexOf('嚴重飢荒') !== -1 ? 'report-log-negative' : 'report-log-warning';
        html += '<div class="' + warnClass + '">⚠️ ' + w + '</div>';
      });
    }
    html += '</div>';
  });

  content.innerHTML = html;
  
  // 綁定關閉按鈕
  document.getElementById('daily-report-close-btn').onclick = function() {
    modal.classList.add('hidden');
    if (typeof renderAll === 'function') renderAll(); // 關閉報表後刷新整體UI(包含避難所卡片)
  };

  modal.classList.remove('hidden');
}
