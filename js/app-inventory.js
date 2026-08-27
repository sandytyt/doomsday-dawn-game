'use strict';

var VEHICLE_TIER_PRESETS = {
  light_two_wheel: { label: '輕型二輪', cargoCapacity: 5, maxDurability: 60, maxFuel: 40 },
  light_four_wheel: { label: '輕型四輪', cargoCapacity: 15, maxDurability: 80, maxFuel: 60 },
  medium: { label: '中型車輛', cargoCapacity: 30, maxDurability: 100, maxFuel: 75 },
  heavy: { label: '重型車輛', cargoCapacity: 55, maxDurability: 130, maxFuel: 100 },
  special_military: { label: '特種/軍規車輛', cargoCapacity: 45, maxDurability: 160, maxFuel: 90 }
};

// 【階段1修改】通用版背包物資增減與食物回復計算
function applyInventoryChangesTo(targetInventory, changes) {
  var autoHungerRecovery = 0;
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    var existing = null;
    var existingIndex = -1;

    for (var j = 0; j < targetInventory.length; j++) {
      if (targetInventory[j].name === change.name) {
        existing = targetInventory[j];
        existingIndex = j;
        break;
      }
    }

    if (change.action === 'remove') {
      if (existing) {
        if (existing.quantity < change.quantity) {
          console.warn('[物資警告] 嘗試移除超過庫存的數量：' + change.name);
        }
        var actualRemoved = Math.min(existing.quantity, change.quantity);
        existing.quantity = Math.max(0, existing.quantity - change.quantity);
        
        if (existing.quantity <= 0) {
          // 直接對傳入的陣列進行修改，確保參考一致
          targetInventory.splice(existingIndex, 1);
        }
        
        if (isLikelyFood(change.name) && !isWaterOnly(change.name)) {
          autoHungerRecovery += getFoodRecoveryAmount(change.name) * actualRemoved;
        }
      } else {
        console.warn('[物資警告] 嘗試移除背包中不存在的物品：' + change.name);
      }
    } else {
      if (existing) {
        existing.quantity += change.quantity || 1;
      } else {
        targetInventory.push({ name: change.name, quantity: change.quantity || 1 });
      }
    }
  }
  return autoHungerRecovery;
}

// 保留給主角原本的呼叫接口，轉接給通用函式
function applyInventoryChanges(changes) {
  return applyInventoryChangesTo(gameState.inventory, changes);
}

function getFoodRecoveryAmount(foodName) {
  // 直接呼叫你寫好的智慧食物推算系統
  if (typeof getFoodStats === 'function') {
    return getFoodStats(foodName).recovery;
  }
  // 防呆：如果找不到該系統，預設回傳 10
  return 10; 
}

function isLikelyFood(name) {
  var foodHints = ['糧', '餅', '肉', '罐頭', '零食', '飯', '菜', '果', '水', '餐', '煮', '野味', '麵', '包', '湯'];
  for (var i = 0; i < foodHints.length; i++) {
    if (name.indexOf(foodHints[i]) !== -1) return true;
  }
  return false;
}

function findVehicleByName(name) {
  for (var i = 0; i < gameState.vehicles.length; i++) {
    if (gameState.vehicles[i].name === name) return gameState.vehicles[i];
  }
  return null;
}

function applyVehicleUpdate(vu) {
  var action = vu.action;
  if (action === 'acquire') {
    // 防止同一輛車因AI措辭不同的名稱被重複新增：
    // 若已存在名稱高度相似（去除空白、包含關係）的未報廢載具，視為同一輛車，僅更新名稱不新增。
    var similarVehicle = null;
    for (var vi = 0; vi < gameState.vehicles.length; vi++) {
      var existingV = gameState.vehicles[vi];
      if (existingV.status === 'lost') continue;
      if (existingV.name === vu.vehicle_name ||
          existingV.name.indexOf(vu.vehicle_name) !== -1 ||
          vu.vehicle_name.indexOf(existingV.name) !== -1) {
        similarVehicle = existingV;
        break;
      }
    }
    if (similarVehicle) {
      // 視為對同一輛車的重複描述，僅同步較完整的名稱，不新增載具
      if (vu.vehicle_name && vu.vehicle_name.length > similarVehicle.name.length) {
        similarVehicle.name = vu.vehicle_name;
      }
      return;
    }
    var preset = VEHICLE_TIER_PRESETS[vu.vehicle_tier] || VEHICLE_TIER_PRESETS.light_four_wheel;
    var newVehicle = {
      id: 'vehicle_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: vu.vehicle_name || '未命名載具',
      tier: vu.vehicle_tier || 'light_four_wheel',
      durability: preset.maxDurability,
      maxDurability: preset.maxDurability,
      fuel: preset.maxFuel,
      maxFuel: preset.maxFuel,
      cargoCapacity: preset.cargoCapacity,
      cargo: [],
      status: 'active',
      acquiredDay: gameState.time.day
    };
    gameState.vehicles.push(newVehicle);
    if (!gameState.activeVehicleId) gameState.activeVehicleId = newVehicle.id;
    return;
  }
  var vehicle = findVehicleByName(vu.vehicle_name);
  if (!vehicle) return;
  if (action === 'repair') {
    if (typeof vu.durability_change === 'number') {
      vehicle.durability = clamp(vehicle.durability + Math.abs(vu.durability_change), 0, vehicle.maxDurability);
    }
  } else if (action === 'refuel') {
    if (typeof vu.fuel_change === 'number') {
      vehicle.fuel = clamp(vehicle.fuel + Math.abs(vu.fuel_change), 0, vehicle.maxFuel);
    }
  } else if (action === 'damage') {
    if (typeof vu.durability_change === 'number') {
      vehicle.durability = clamp(vehicle.durability - Math.abs(vu.durability_change), 0, vehicle.maxDurability);
    }
    if (typeof vu.fuel_change === 'number') {
      vehicle.fuel = clamp(vehicle.fuel - Math.abs(vu.fuel_change), 0, vehicle.maxFuel);
    }
    if (vehicle.durability <= 0) {
      vehicle.status = 'lost';
      if (gameState.activeVehicleId === vehicle.id) gameState.activeVehicleId = null;
    }
  } else if (action === 'lose') {
    vehicle.status = 'lost';
    if (gameState.activeVehicleId === vehicle.id) gameState.activeVehicleId = null;
  } else if (action === 'set_active') {
    if (vehicle.status !== 'lost') gameState.activeVehicleId = vehicle.id;
  }
}

function findStashByLocation(locationName) {
  for (var i = 0; i < gameState.stashes.length; i++) {
    var s = gameState.stashes[i];
    if (s.locationName === locationName ||
        s.locationName.indexOf(locationName) !== -1 ||
        locationName.indexOf(s.locationName) !== -1) {
      return s;
    }
  }
  return null;
}

function applyStashUpdate(su) {
  if (!su.location_name || !Array.isArray(su.items)) return;
  var stash = findStashByLocation(su.location_name);

  if (su.action === 'store') {
    if (!stash) {
      stash = {
        id: 'stash_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        locationName: su.location_name,
        items: [],
        createdDay: gameState.time.day,
        note: ''
      };
      gameState.stashes.push(stash);
    }
    for (var i = 0; i < su.items.length; i++) {
      var item = su.items[i];
      var existing = null;
      for (var j = 0; j < stash.items.length; j++) {
        if (stash.items[j].name === item.name) { existing = stash.items[j]; break; }
      }
      if (existing) {
        existing.quantity += (item.quantity || 1);
      } else {
        stash.items.push({ name: item.name, quantity: item.quantity || 1 });
      }
    }
  } else if (su.action === 'retrieve') {
    if (!stash) return;
    for (var k = 0; k < su.items.length; k++) {
      var ritem = su.items[k];
      var existingR = null;
      for (var m = 0; m < stash.items.length; m++) {
        if (stash.items[m].name === ritem.name) { existingR = stash.items[m]; break; }
      }
      if (existingR) {
        existingR.quantity -= (ritem.quantity || 1);
        if (existingR.quantity <= 0) {
          stash.items = stash.items.filter(function (it) { return it.name !== ritem.name; });
        }
      }
    }
    // 若暫存點已清空，移除該暫存點記錄
    if (stash.items.length === 0) {
      gameState.stashes = gameState.stashes.filter(function (s) { return s.id !== stash.id; });
    }
  }
}

function getInventoryLoadLevel(invArray) {
  var count = (invArray || []).length;
  if (count <= 5) return '輕裝';
  if (count <= 10) return '標準';
  return '超載';
}

// ==========================================
// 【階段4新增】物品使用與分配邏輯 (shareType)
// ==========================================

var useItemState = {
  itemName: '',
  maxQty: 0
};

document.addEventListener('DOMContentLoaded', function() {
  var cancelBtn = document.getElementById('use-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', function() {
    document.getElementById('use-modal').classList.add('hidden');
  });

  var confirmBtn = document.getElementById('use-confirm-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', executeUseItem);
});

function executeUseItem() {
  var target = document.getElementById('use-target-select').value;
  var itemName = useItemState.itemName;
  
  // 1. 【修復喝水 Bug】將食物與水合併視為「可飲食消耗品」
  var isWater = (typeof isWaterOnly === 'function') ? isWaterOnly(itemName) : false;
  // 把 && !isWater 拿掉，只要是食物或是水，都允許使用！
  var isConsumable = isLikelyFood(itemName) || isWater; 
  var isMed = itemName.indexOf('醫療包') !== -1 || itemName.indexOf('繃帶') !== -1 || itemName.indexOf('藥') !== -1 || itemName.indexOf('紗布') !== -1;
  var isCore = itemName.indexOf('晶核') !== -1;
  
  if (!isConsumable && !isMed && !isCore) {
    alert('此物品目前無法直接使用（可能是材料或無法食用的物品）。');
    return;
  }
  
  // 晶核專屬檢查：通常晶核只能由主角自己吸收
  if (isCore && target !== 'player') {
    alert('晶核目前只能由主角自己吸收轉化！');
    return;
  }

  var targets = [];
  if (target === 'player') targets.push('player');
  else if (target.startsWith('npc_')) targets.push(target.substring(4));
  else if (target === 'all') {
    targets.push('player');
    targets = targets.concat(gameState.companions || []);
  }
  
  // ─── 完美對接你的智慧食物系統 ───
  var shareType = 'individual';
  var recovery = 10;
  var staminaRecovery = 0;

  if (typeof getFoodStats === 'function') {
    var stats = getFoodStats(itemName);
    shareType = stats.shareType;
    recovery = stats.recovery;
    staminaRecovery = stats.stamina || 0;
  }
  // ────────────────────────────
  
  var qtyToConsume = 0;
  
  if (target === 'all' && shareType === 'shared') {
    qtyToConsume = 1;
  } else {
    qtyToConsume = targets.length;
  }
  
  if (isCore) {
    qtyToConsume = 1; 
  }
  
  if (useItemState.maxQty < qtyToConsume) {
    alert('數量不足！你需要 ' + qtyToConsume + ' 份，但背包只有 ' + useItemState.maxQty + ' 份。');
    return;
  }
  
  // 1. 扣除物品
  applyInventoryChangesTo(gameState.inventory, [{ name: itemName, quantity: qtyToConsume, action: 'remove' }]);
  
  // 2. 應用效果
  if (isCore) {
    var expGained = (typeof getCoreExpGained === 'function') ? getCoreExpGained(itemName) : 10;
    
    if (typeof applyAbilityExpChange === 'function') {
      applyAbilityExpChange(expGained); 
    }
    if (typeof advanceTime === 'function') {
      advanceTime(10); 
    } else {
      gameState.time.minute += 10;
      if(gameState.time.minute >= 60) {
        gameState.time.minute -= 60;
        gameState.time.hour += 1;
      }
    }
    appendGMText('[系統] 你吸收了 ' + itemName + '，獲得 ' + expGained + ' 點熟練度，時間過去了 10 分鐘。');
  } else {
    // 食物與藥品效果
    targets.forEach(function(t) {
      // 2. 【修復體力 Bug】讓水跟食物都能進入恢復迴圈，並加上 Number 防呆確保數值相加正確
      if (isConsumable) { 
        if (t === 'player') {
          gameState.hunger = Math.min(100, gameState.hunger + recovery);
          gameState.stamina = Math.min(gameState.maxStamina || 100, (Number(gameState.stamina) || 0) + staminaRecovery);
        }
        else if (gameState.npcStates && gameState.npcStates[t]) {
          gameState.npcStates[t].hunger = Math.min(100, gameState.npcStates[t].hunger + recovery);
          gameState.npcStates[t].stamina = Math.min(100, (Number(gameState.npcStates[t].stamina) || 0) + staminaRecovery);
        }
      }
      if (isMed) {
        if (t === 'player') {
           gameState.injuryStatus = (gameState.injuryStatus === 'severe') ? 'minor' : 'none';
           if (gameState.injuryStatus === 'none') gameState.injuryDetail = ''; 
        } else if (gameState.npcStates && gameState.npcStates[t]) {
           var npc = gameState.npcStates[t];
           npc.injuryStatus = (npc.injuryStatus === 'severe') ? 'minor' : 'none';
           if (npc.injuryStatus === 'none') npc.injuryDetail = '';
        }
      }
    });
    
    var targetLabel = target === 'all' ? '全體人員' : (target === 'player' ? '自己' : target.substring(4));
    
    // 讓日誌清楚顯示喝水/吃東西後恢復了體力
    if (isConsumable && !isMed) {
       appendGMText('[系統] 你將 ' + itemName + ' 分配給了 ' + targetLabel + ' (消耗 ' + qtyToConsume + ' 份)，恢復了飽食度與體力。');
    } else {
       appendGMText('[系統] 你將 ' + itemName + ' 分配給了 ' + targetLabel + ' (消耗 ' + qtyToConsume + ' 份)。');
    }
  }
  
  // 3. 收尾與日誌提示
  document.getElementById('use-modal').classList.add('hidden');
  if (typeof renderAll === 'function') renderAll(); 
}

function isWaterOnly(itemName) {
  // 檢查是否包含水的關鍵字，且不包含湯、麵等有熱量的字眼
  var waterHints = ['水', '礦泉水', '純水', '熱水', '髒水', '冰塊'];
  for (var i = 0; i < waterHints.length; i++) {
    if (itemName.indexOf(waterHints[i]) !== -1) {
      // 如果是「湯」或是「藥水」，就不算純水
      if (itemName.indexOf('湯') === -1 && itemName.indexOf('藥') === -1) {
        return true;
      }
    }
  }
  return false;
}
