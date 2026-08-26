/* ============================================
   末日黎明：喪屍浩劫 — 物品與載具管理 (inventory.js)
   職責：背包物資增減、食物回復計算、載具與暫存點狀態更新、物品使用邏輯與專屬面板渲染
   ============================================ */

// --- 核心物資增減邏輯 ---
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
        var actualRemoved = Math.min(existing.quantity, change.quantity);
        existing.quantity = Math.max(0, existing.quantity - change.quantity);
        
        if (existing.quantity <= 0) {
          targetInventory.splice(existingIndex, 1);
        }
        
        if (isLikelyFood(change.name) && !isWaterOnly(change.name)) {
          autoHungerRecovery += getFoodRecoveryAmount(change.name) * actualRemoved;
        }
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

function applyInventoryChanges(changes) {
  return applyInventoryChangesTo(gameState.inventory, changes);
}

// --- 食物與屬性推算 ---
function getFoodRecoveryAmount(foodName) {
  if (typeof getFoodStats === 'function') {
    return getFoodStats(foodName).recovery;
  }
  return 20; // 預設值
}

function isLikelyFood(name) {
  var foodHints = ['糧', '餅', '肉', '罐頭', '零食', '飯', '菜', '果', '水', '餐', '煮', '野味'];
  for (var i = 0; i < foodHints.length; i++) {
    if (name.indexOf(foodHints[i]) !== -1) return true;
  }
  return false;
}

function isWaterOnly(name) {
  var WATER_ONLY_KEYWORDS = ['水', '飲用水', '礦泉水', '生理食鹽水'];
  var hasWaterWord = WATER_ONLY_KEYWORDS.some(function (w) { return name.indexOf(w) !== -1; });
  if (!hasWaterWord) return false;
  var foodExclusion = ['湯', '粥', '茶飲', '果汁'];
  return !foodExclusion.some(function (w) { return name.indexOf(w) !== -1; });
}

// --- 載具與暫存點邏輯 ---
function findVehicleByName(name) {
  for (var i = 0; i < gameState.vehicles.length; i++) {
    if (gameState.vehicles[i].name === name) return gameState.vehicles[i];
  }
  return null;
}

function applyVehicleUpdate(vu) {
  var action = vu.action;
  if (action === 'acquire') {
    var similarVehicle = null;
    for (var vi = 0; vi < gameState.vehicles.length; vi++) {
      var existingV = gameState.vehicles[vi];
      if (existingV.status === 'lost') continue;
      if (existingV.name === vu.vehicle_name || existingV.name.indexOf(vu.vehicle_name) !== -1 || vu.vehicle_name.indexOf(existingV.name) !== -1) {
        similarVehicle = existingV; break;
      }
    }
    if (similarVehicle) {
      if (vu.vehicle_name && vu.vehicle_name.length > similarVehicle.name.length) similarVehicle.name = vu.vehicle_name;
      return;
    }
    var preset = VEHICLE_TIER_PRESETS[vu.vehicle_tier] || VEHICLE_TIER_PRESETS.light_four_wheel;
    var newVehicle = {
      id: 'vehicle_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: vu.vehicle_name || '未命名載具',
      tier: vu.vehicle_tier || 'light_four_wheel',
      durability: preset.maxDurability, maxDurability: preset.maxDurability,
      fuel: preset.maxFuel, maxFuel: preset.maxFuel,
      cargoCapacity: preset.cargoCapacity, cargo: [],
      status: 'active', acquiredDay: gameState.time.day
    };
    gameState.vehicles.push(newVehicle);
    if (!gameState.activeVehicleId) gameState.activeVehicleId = newVehicle.id;
    return;
  }
  
  var vehicle = findVehicleByName(vu.vehicle_name);
  if (!vehicle) return;
  
  if (action === 'repair') {
    if (typeof vu.durability_change === 'number') vehicle.durability = clamp(vehicle.durability + Math.abs(vu.durability_change), 0, vehicle.maxDurability);
  } else if (action === 'refuel') {
    if (typeof vu.fuel_change === 'number') vehicle.fuel = clamp(vehicle.fuel + Math.abs(vu.fuel_change), 0, vehicle.maxFuel);
  } else if (action === 'damage') {
    if (typeof vu.durability_change === 'number') vehicle.durability = clamp(vehicle.durability - Math.abs(vu.durability_change), 0, vehicle.maxDurability);
    if (typeof vu.fuel_change === 'number') vehicle.fuel = clamp(vehicle.fuel - Math.abs(vu.fuel_change), 0, vehicle.maxFuel);
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
    if (s.locationName.indexOf(locationName) !== -1 || locationName.indexOf(s.locationName) !== -1) return s;
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
        locationName: su.location_name, items: [],
        createdDay: gameState.time.day, note: ''
      };
      gameState.stashes.push(stash);
    }
    for (var i = 0; i < su.items.length; i++) {
      var item = su.items[i];
      var existing = null;
      for (var j = 0; j < stash.items.length; j++) {
        if (stash.items[j].name === item.name) { existing = stash.items[j]; break; }
      }
      if (existing) existing.quantity += (item.quantity || 1);
      else stash.items.push({ name: item.name, quantity: item.quantity || 1 });
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
    if (stash.items.length === 0) {
      gameState.stashes = gameState.stashes.filter(function (s) { return s.id !== stash.id; });
    }
  }
}

function applyAbilityExpChange(delta) {
  if (gameState.awakeningLevel <= 0) return;
  gameState.abilityExp += delta;
  var needed = getAbilityExpNeeded(gameState.awakeningLevel);
  while (gameState.awakeningLevel < 10 && gameState.abilityExp >= needed) {
    gameState.abilityExp -= needed;
    gameState.awakeningLevel += 1;
    needed = getAbilityExpNeeded(gameState.awakeningLevel);
  }
}

// --- 專屬面板渲染邏輯 ---
function renderVehiclePanel() {
  if (!dom.vehicleList) return;
  dom.vehicleList.innerHTML = '';
  var activeVehicles = gameState.vehicles.filter(function (v) { return v.status !== 'lost'; });

  if (activeVehicles.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'vehicle-empty';
    emptyEl.textContent = '尚未擁有任何載具';
    dom.vehicleList.appendChild(emptyEl);
    return;
  }
  
  activeVehicles.forEach(function (v) {
    var card = document.createElement('div');
    card.className = 'vehicle-card' + (v.id === gameState.activeVehicleId ? ' vehicle-active' : '');
    card.innerHTML =
      '<div class="vehicle-card-header"><span class="vehicle-name">' + escapeHtml(v.name) + (v.id === gameState.activeVehicleId ? '（使用中）' : '') + '</span></div>' +
      '<div class="vehicle-stat-row"><span>耐久 ' + v.durability + '/' + v.maxDurability + '</span><span>油量 ' + v.fuel + '/' + v.maxFuel + '</span></div>';

    var cargoRow = document.createElement('div');
    cargoRow.className = 'vehicle-cargo-row';
    cargoRow.textContent = '貨艙（' + v.cargo.length + '/' + v.cargoCapacity + '）：';
    
    if (v.cargo.length === 0) {
      cargoRow.textContent += '空';
    } else {
      v.cargo.forEach(function (it, index) {
        var tag = document.createElement('span');
        tag.textContent = it.name + ' x' + it.quantity;
        if (typeof transferState !== 'undefined' && transferState.isTransferMode) {
          tag.style.cursor = 'pointer'; tag.style.border = '1px dashed #4a90e2'; tag.style.padding = '1px 4px';
          tag.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof openTransferModal === 'function') openTransferModal('vehicle', v.id, it.name, it.quantity);
          });
        }
        cargoRow.appendChild(tag);
        if (index < v.cargo.length - 1) cargoRow.appendChild(document.createTextNode('、'));
      });
    }
    card.appendChild(cargoRow);
    dom.vehicleList.appendChild(card);
  });
}

var expandedItemLocations = {};

function renderItemsAccordion() {
  if (!dom.itemsAccordion) return;
  dom.itemsAccordion.innerHTML = '';

  var locations = [];
  locations.push({ key: '__backpack__', label: '隨身背包', items: gameState.inventory, isBackpack: true });
  gameState.stashes.forEach(function (s) { locations.push({ key: s.id, label: s.locationName, items: s.items, isBackpack: false }); });

  locations.forEach(function (loc) {
    var card = document.createElement('div');
    card.className = 'item-location-card';
    var loadTagHtml = '';
    if (loc.isBackpack) {
      var loadLevel = getInventoryLoadLevel(gameState.inventory);
      loadTagHtml = '<span class="inventory-load-tag load-' + loadLevel + '">' + loadLevel + '</span>';
    }

    var header = document.createElement('button');
    header.type = 'button';
    header.className = 'item-location-header' + (expandedItemLocations[loc.key] ? ' expanded' : '');
    header.innerHTML = '<span class="location-name">' + escapeHtml(loc.label) + '</span>' + loadTagHtml + '<span class="location-count">' + loc.items.length + '項</span><span class="item-location-arrow">▾</span>';

    var body = document.createElement('div');
    body.className = 'item-location-body' + (expandedItemLocations[loc.key] ? '' : ' hidden');

    if (loc.items.length === 0) {
      var emptyTag = document.createElement('span');
      emptyTag.className = 'inventory-empty'; emptyTag.textContent = '空';
      body.appendChild(emptyTag);
    } else {
      loc.items.forEach(function (it) {
        var tag = document.createElement('span');
        tag.className = 'inventory-item'; tag.textContent = it.name + ' x' + it.quantity;

        if (typeof transferState !== 'undefined' && transferState.isTransferMode) {
          tag.style.cursor = 'pointer'; tag.style.border = '1px dashed #4a90e2';
          tag.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof openTransferModal === 'function') openTransferModal(loc.isBackpack ? 'backpack' : 'stash', loc.key, it.name, it.quantity);
          });
        } else if (loc.isBackpack) {
          tag.style.cursor = 'pointer';
          tag.addEventListener('mouseover', function() { tag.style.background = 'rgba(255,255,255,0.1)'; });
          tag.addEventListener('mouseout', function() { tag.style.background = 'transparent'; });
          tag.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof openUseModal === 'function') openUseModal(it.name, it.quantity);
          });
        }
        body.appendChild(tag);
      });
    }
    header.addEventListener('click', function () {
      expandedItemLocations[loc.key] = !expandedItemLocations[loc.key];
      header.classList.toggle('expanded', expandedItemLocations[loc.key]);
      body.classList.toggle('hidden', !expandedItemLocations[loc.key]);
    });
    card.appendChild(header); card.appendChild(body); dom.itemsAccordion.appendChild(card);
  });
}

// --- 物品使用邏輯 ---
var useItemState = { itemName: '', maxQty: 0 };

document.addEventListener('DOMContentLoaded', function() {
  var cancelBtn = document.getElementById('use-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', function() { document.getElementById('use-modal').classList.add('hidden'); });
  var confirmBtn = document.getElementById('use-confirm-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', executeUseItem);
});

function openUseModal(itemName, qty) {
  useItemState.itemName = itemName;
  useItemState.maxQty = qty;
  var modal = document.getElementById('use-modal');
  document.getElementById('use-item-name').textContent = '物品：' + itemName + ' (持有 ' + qty + ')';
  
  var select = document.getElementById('use-target-select');
  select.innerHTML = '';
  select.appendChild(new Option('自己 (' + (gameState.charSetup.name || '主角') + ')', 'player'));
  gameState.companions.forEach(function(npc) { select.appendChild(new Option('隊員：' + npc, 'npc_' + npc)); });
  if (gameState.companions.length > 0) select.appendChild(new Option('全體分配 (所有人)', 'all'));
  modal.classList.remove('hidden');
}

function executeUseItem() {
  var target = document.getElementById('use-target-select').value;
  var itemName = useItemState.itemName;
  
  var isFood = isLikelyFood(itemName) && !isWaterOnly(itemName);
  var isMed = itemName.indexOf('醫療包') !== -1 || itemName.indexOf('繃帶') !== -1 || itemName.indexOf('藥') !== -1;
  if (!isFood && !isMed) { alert('此物品目前無法直接使用。'); return; }
  
  var targets = [];
  if (target === 'player') targets.push('player');
  else if (target.startsWith('npc_')) targets.push(target.substring(4));
  else if (target === 'all') { targets.push('player'); targets = targets.concat(gameState.companions); }
  
  var shareType = 'individual';
  if (typeof getFoodStats === 'function') shareType = getFoodStats(itemName).shareType;
  var recovery = getFoodRecoveryAmount(itemName);
  var qtyToConsume = (target === 'all' && shareType === 'shared') ? 1 : targets.length;
  
  if (useItemState.maxQty < qtyToConsume) {
    alert('數量不足以分配！你需要 ' + qtyToConsume + ' 份，但背包只有 ' + useItemState.maxQty + ' 份。'); return;
  }
  
  applyInventoryChangesTo(gameState.inventory, [{ name: itemName, quantity: qtyToConsume, action: 'remove' }]);
  
  targets.forEach(function(t) {
    if (isFood) {
      if (t === 'player') gameState.hunger = Math.min(100, gameState.hunger + recovery);
      else if (gameState.npcStates && gameState.npcStates[t]) gameState.npcStates[t].hunger = Math.min(100, gameState.npcStates[t].hunger + recovery);
    }
    if (isMed) {
      if (t === 'player') gameState.injuryStatus = (gameState.injuryStatus === 'severe') ? 'minor' : 'none';
      else if (gameState.npcStates && gameState.npcStates[t]) gameState.npcStates[t].injuryStatus = (gameState.npcStates[t].injuryStatus === 'severe') ? 'minor' : 'none';
    }
  });
  
  document.getElementById('use-modal').classList.add('hidden');
  if (typeof renderAll === 'function') renderAll();
  var targetLabel = target === 'all' ? '全體人員' : (target === 'player' ? '自己' : target.substring(4));
  if (typeof appendGMText === 'function') appendGMText('[系統] 你將 ' + itemName + ' 分配給了 ' + targetLabel + ' (消耗 ' + qtyToConsume + ' 份)。');
}