'use strict';

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
  for (var key in FOOD_HUNGER_RECOVERY) {
    if (foodName.indexOf(key) !== -1) return FOOD_HUNGER_RECOVERY[key];
  }
  return DEFAULT_FOOD_RECOVERY;
}

function isLikelyFood(name) {
  var foodHints = ['糧', '餅', '肉', '罐頭', '零食', '飯', '菜', '果', '水', '餐'];
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
  } else if (action === 'cargo_change' && Array.isArray(vu.cargo_changes)) {
    for (var i = 0; i < vu.cargo_changes.length; i++) {
      var change = vu.cargo_changes[i];
      var existing = null;
      for (var j = 0; j < vehicle.cargo.length; j++) {
        if (vehicle.cargo[j].name === change.name) { existing = vehicle.cargo[j]; break; }
      }
      if (change.action === 'remove') {
        if (existing) {
          existing.quantity -= (change.quantity || 1);
          if (existing.quantity <= 0) {
            vehicle.cargo = vehicle.cargo.filter(function (it) { return it.name !== change.name; });
          }
        }
      } else {
        if (existing) {
          existing.quantity += (change.quantity || 1);
        } else {
          vehicle.cargo.push({ name: change.name, quantity: change.quantity || 1 });
        }
      }
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
    var cargoText = v.cargo.length
      ? v.cargo.map(function (it) { return it.name + ' x' + it.quantity; }).join('、')
      : '空';
    card.innerHTML =
      '<div class="vehicle-card-header">' +
        '<span class="vehicle-name">' + escapeHtml(v.name) + (v.id === gameState.activeVehicleId ? '（使用中）' : '') + '</span>' +
      '</div>' +
      '<div class="vehicle-stat-row">' +
        '<span>耐久 ' + v.durability + '/' + v.maxDurability + '</span>' +
        '<span>油量 ' + v.fuel + '/' + v.maxFuel + '</span>' +
      '</div>' +
      '<div class="vehicle-cargo-row">貨艙（' + v.cargo.length + '/' + v.cargoCapacity + '）：' + escapeHtml(cargoText) + '</div>';
    dom.vehicleList.appendChild(card);
  });
}

var expandedItemLocations = {}; // 記錄每個地點分類目前是否展開

function renderItemsAccordion() {
  if (!dom.itemsAccordion) return;
  dom.itemsAccordion.innerHTML = '';

  var locations = [];
  locations.push({
    key: '__backpack__',
    label: '隨身背包',
    items: gameState.inventory,
    isBackpack: true
  });
  gameState.stashes.forEach(function (s) {
    locations.push({
      key: s.id,
      label: s.locationName,
      items: s.items,
      isBackpack: false
    });
  });

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
    header.innerHTML =
      '<span class="location-name">' + escapeHtml(loc.label) + '</span>' +
      loadTagHtml +
      '<span class="location-count">' + loc.items.length + '項</span>' +
      '<span class="item-location-arrow">▾</span>';

    var body = document.createElement('div');
    body.className = 'item-location-body' + (expandedItemLocations[loc.key] ? '' : ' hidden');

    if (loc.items.length === 0) {
      var emptyTag = document.createElement('span');
      emptyTag.className = 'inventory-empty';
      emptyTag.textContent = '空';
      body.appendChild(emptyTag);
    } else {
      loc.items.forEach(function (it) {
        var tag = document.createElement('span');
        tag.className = 'inventory-item';
        tag.textContent = it.name + ' x' + it.quantity;
        body.appendChild(tag);
      });
    }

    header.addEventListener('click', function () {
      expandedItemLocations[loc.key] = !expandedItemLocations[loc.key];
      header.classList.toggle('expanded', expandedItemLocations[loc.key]);
      body.classList.toggle('hidden', !expandedItemLocations[loc.key]);
    });

    card.appendChild(header);
    card.appendChild(body);
    dom.itemsAccordion.appendChild(card);
  });
}
