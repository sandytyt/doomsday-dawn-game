'use strict';

// ─── 基地設施藍圖字典 (Global Blueprints) ───
// cost: 建設所需材料
// minPop: 每日運作需要綁定的最少人口 (未達人數則停工)
// defValue: 防禦值 (抵抗襲擊用)
window.FACILITY_BLUEPRINTS = {
  '農場': { cost: { '木材': 2, '廢鐵': 1 }, minPop: 1, type: 'food' },
  '水培': { cost: { '電子零件': 1, '廢鐵': 2, '雜物': 1 }, minPop: 1, type: 'food' },
  '溫室': { cost: { '木材': 3, '廢鐵': 1 }, minPop: 1, type: 'food' },
  '雨水過濾器': { cost: { '木材': 2, '雜物': 1 }, minPop: 1, type: 'water' },
  '集水': { cost: { '木材': 1, '雜物': 1 }, minPop: 1, type: 'water' },
  '淨水': { cost: { '電子零件': 1, '廢鐵': 2 }, minPop: 1, type: 'water' },
  '拾荒隊': { cost: {}, minPop: 2, type: 'scavenge' }, // 規定至少需2人組隊
  '伐木場': { cost: { '廢鐵': 2 }, minPop: 1, type: 'lumber' },
  '誘捕陣': { cost: { '廢鐵': 3, '木材': 2 }, minPop: 1, type: 'core' },
  '拒馬': { cost: { '木材': 3, '廢鐵': 1 }, minPop: 0, type: 'defense', defValue: 10 },
  '哨塔': { cost: { '木材': 5, '廢鐵': 3 }, minPop: 1, type: 'defense', defValue: 20 },
  '巡邏隊': { cost: {}, minPop: 1, type: 'defense', defValue: 15 } // 消耗1人，不產出，專職防禦
};

// ─── 基地模擬引擎 (Colony Simulation Engine) ───

window.runDailyBaseSimulation = function(daysPassed) {
  var worldMemory = gameState.worldMemory || {};
  var safeZones = worldMemory.safeZones || [];
  gameState.stashes = gameState.stashes || [];
  
  if (safeZones.length === 0) return;

  var allReports = [];

  for (var d = 0; d < daysPassed; d++) {
    safeZones.forEach(function(zone) {
      if (!zone.population || zone.population <= 0) return;
      
      var stash = gameState.stashes.find(function(s) { return s.locationName === zone.name; });
      if (!stash) {
        stash = { id: 'base_' + Date.now() + '_' + Math.floor(Math.random()*1000), locationName: zone.name, items: [] };
        gameState.stashes.push(stash);
      }

      var report = processSingleDayForZone(zone, stash);
      
      if (d === daysPassed - 1 || report.starvationDeaths > 0 || report.raidEvent) {
        allReports.push(report);
      }
    });
  }

  if (allReports.length > 0) {
    renderDailyReportModal(allReports, daysPassed);
  }
};

function processSingleDayForZone(zone, stash) {
  var pop = zone.population;
  var report = {
    name: zone.name,
    population: pop,
    produced: {},
    consumed: {},
    warnings: [],
    starvationDeaths: 0,
    raidEvent: false
  };

  var laborAvailable = pop;
  var defenseScore = 0;
  var totalItemsCount = stash.items.reduce(function(acc, item) { return acc + item.quantity; }, 0);
  var threatScore = Math.floor(totalItemsCount / 10); // 每10件物品 = 1點威脅度

  var activeFacilities = [];
  var idleFacilities = [];

  // 1. 【勞動力與防禦分配階段】
  // 優先啟動需要防禦與人數要求的設施
  zone.facilities.forEach(function(fName) {
    var bp = window.FACILITY_BLUEPRINTS[fName];
    if (!bp) bp = { minPop: 1, type: 'unknown' }; // 若無藍圖，預設需1人

    // 累積被動與主動防禦值
    if (bp.type === 'defense') {
      if (laborAvailable >= bp.minPop) {
        defenseScore += (bp.defValue || 0);
        laborAvailable -= bp.minPop;
        activeFacilities.push(fName);
      } else {
        idleFacilities.push(fName);
      }
    } else {
      // 一般生產設施
      if (laborAvailable >= bp.minPop) {
        laborAvailable -= bp.minPop;
        activeFacilities.push(fName);
      } else {
        idleFacilities.push(fName);
      }
    }
  });

  if (idleFacilities.length > 0) {
    report.warnings.push('勞動力不足，以下設施停工：' + idleFacilities.join(', '));
  }

  // 2. 【治安與掠奪判定階段】
  if (threatScore > defenseScore && stash.items.length > 0) {
    // 威脅大於防禦，最高有 40% 機率遇襲
    var raidChance = Math.min(0.4, (threatScore - defenseScore) * 0.05);
    if (Math.random() < raidChance) {
      report.raidEvent = true;
      report.warnings.push('🔴 基地遭掠奪！(威脅值 ' + threatScore + ' > 治安值 ' + defenseScore + ')');
      
      // 隨機失去 10%~20% 的物資
      stash.items.forEach(function(item) {
        if (Math.random() < 0.6) {
          var stealQty = Math.max(1, Math.floor(item.quantity * (0.1 + Math.random() * 0.1)));
          item.quantity -= stealQty;
          report.consumed[item.name] = (report.consumed[item.name] || 0) + stealQty; // 記錄在消耗欄作為損失
        }
      });
      // 清除數量為0的物品
      stash.items = stash.items.filter(function(i) { return i.quantity > 0; });
    }
  }

  // 3. 【生產階段】(已調高產出以平衡1人經濟)
  activeFacilities.forEach(function(f) {
    var outName = '';
    var outQty = 0;
    
    // 根據藍圖產出
    if (f.indexOf('農場') !== -1) { outName = '生肉'; outQty = 4; }
    else if (f.indexOf('水培') !== -1) { outName = '新鮮蔬菜'; outQty = 4; }
    else if (f.indexOf('溫室') !== -1) { outName = '水果'; outQty = 4; }
    else if (/(集水|淨水|水井|雨水)/.test(f)) { outName = '過濾水'; outQty = 4; }
    else if (f.indexOf('拾荒') !== -1) { outName = Math.random() > 0.5 ? '電子零件' : '廢鐵'; outQty = 3; }
    else if (f.indexOf('伐木') !== -1) { outName = '木材'; outQty = 3; }
    else if (/(誘捕|分離)/.test(f)) { outName = '透明晶核'; outQty = 1; }

    if (outName) {
      applyInventoryChangesTo(stash.items, [{ name: outName, quantity: outQty, action: 'add' }]);
      report.produced[outName] = (report.produced[outName] || 0) + outQty;
    }
  });

  // 4. 【居民消耗與飢餓階段】(1人需1食1水)
  var foodNeeded = pop;
  var waterNeeded = pop;

  var availableFood = stash.items.filter(function(i) { return typeof isLikelyFood === 'function' && isLikelyFood(i.name) && !isWaterOnly(i.name); })
                                 .sort(function(a, b) { return getConsumePriority(a.name) - getConsumePriority(b.name); });
                                 
  var availableWater = stash.items.filter(function(i) { return typeof isWaterOnly === 'function' && isWaterOnly(i.name); })
                                  .sort(function(a, b) { return getConsumePriority(a.name) - getConsumePriority(b.name); });

  for (var i = 0; i < availableFood.length && foodNeeded > 0; i++) {
    var item = availableFood[i];
    var take = Math.min(item.quantity, foodNeeded);
    applyInventoryChangesTo(stash.items, [{ name: item.name, quantity: take, action: 'remove' }]);
    report.consumed[item.name] = (report.consumed[item.name] || 0) + take;
    foodNeeded -= take;
  }
  
  for (var j = 0; j < availableWater.length && waterNeeded > 0; j++) {
    var wItem = availableWater[j];
    var wTake = Math.min(wItem.quantity, waterNeeded);
    applyInventoryChangesTo(stash.items, [{ name: wItem.name, quantity: wTake, action: 'remove' }]);
    report.consumed[wItem.name] = (report.consumed[wItem.name] || 0) + wTake;
    waterNeeded -= wTake;
  }

  var missing = foodNeeded + waterNeeded;
  if (missing > 0) {
    report.warnings.push('庫存枯竭！缺少 ' + missing + ' 份基本飲食。');
    for (var k = 0; k < missing; k++) {
      if (Math.random() < 0.3) {
        report.starvationDeaths++;
        zone.population = Math.max(0, zone.population - 1);
      }
    }
    if (report.starvationDeaths > 0) {
      report.warnings.push('嚴重飢荒：失去了 ' + report.starvationDeaths + ' 名居民。');
      if (typeof appendGMText === 'function') {
         appendGMText('[系統警告] ' + zone.name + ' 發生嚴重飢荒或襲擊，導致人口流失，請盡速返回處理！');
      }
    }
  }

  return report;
}

function getConsumePriority(name) {
  if (/(野果|生肉|蔬菜|水果)/.test(name)) return 1;    
  if (/(髒水|半瓶)/.test(name)) return 1;           
  if (/(過濾水|湯|飯|菜)/.test(name)) return 2;     
  if (/(餅乾|糖|零食)/.test(name)) return 3;        
  if (/(電子零件|木材|廢鐵|晶核)/.test(name)) return 100; // 絕對不可食用
  if (/(軍用罐頭|能量棒|純水|醫療包)/.test(name)) return 99; 
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
    
    var prodKeys = Object.keys(r.produced);
    if (prodKeys.length > 0) {
      html += '<div class="report-log-positive">🟩 今日產出：';
      var pStr = prodKeys.map(function(k) { return k + ' x' + r.produced[k]; }).join(', ');
      html += pStr + '</div>';
    } else {
      html += '<div class="report-log-neutral">🟩 今日產出：無</div>';
    }

    var consKeys = Object.keys(r.consumed);
    if (consKeys.length > 0) {
      // 根據是否有襲擊改變用詞
      var consumeLabel = r.raidEvent ? '🔻 消耗與被劫物資：' : '🔻 居民消耗：';
      html += '<div class="' + (r.raidEvent ? 'report-log-negative' : 'report-log-neutral') + '">' + consumeLabel;
      var cStr = consKeys.map(function(k) { return k + ' x' + r.consumed[k]; }).join(', ');
      html += cStr + '</div>';
    }

    if (r.warnings.length > 0) {
      r.warnings.forEach(function(w) {
        var warnClass = (w.indexOf('飢荒') !== -1 || w.indexOf('掠奪') !== -1) ? 'report-log-negative' : 'report-log-warning';
        html += '<div class="' + warnClass + '">⚠️ ' + w + '</div>';
      });
    }
    html += '</div>';
  });

  content.innerHTML = html;
  
  document.getElementById('daily-report-close-btn').onclick = function() {
    modal.classList.add('hidden');
    if (typeof renderAll === 'function') renderAll(); 
  };

  modal.classList.remove('hidden');
}