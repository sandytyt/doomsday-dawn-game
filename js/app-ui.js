'use strict';

/* STREAMING_CHUNK:Rendering main status UI... */
function renderAll() {
  var testTag = gameState.isTestMode ? '🧪 ' : '';
  dom.statusTime.textContent = testTag + '⏱ 第' + gameState.time.day + '天 ' + pad2(gameState.time.hour) + ':' + pad2(gameState.time.minute);
  dom.statusLocation.textContent = '📍 ' + (gameState.location || '未知');

  var safeStamina = gameState.stamina || 0;
  var safeMaxStamina = gameState.maxStamina || 100;
  var staminaPct = (safeStamina / safeMaxStamina) * 100;
  dom.staminaFill.style.width = staminaPct + '%';
  dom.staminaValue.textContent = Math.floor(safeStamina);
  dom.staminaFill.classList.remove('low', 'critical');
  if (staminaPct <= CONFIG.STAMINA_CRITICAL_THRESHOLD) dom.staminaFill.classList.add('critical');
  else if (staminaPct <= CONFIG.STAMINA_LOW_THRESHOLD) dom.staminaFill.classList.add('low');

  var safeHunger = gameState.hunger || 0;
  var hungerPct = safeHunger;
  dom.hungerFill.style.width = hungerPct + '%';
  dom.hungerValue.textContent = Math.floor(safeHunger);
  dom.hungerFill.classList.remove('low', 'critical');
  if (hungerPct <= CONFIG.STAMINA_CRITICAL_THRESHOLD) dom.hungerFill.classList.add('critical');
  else if (hungerPct <= CONFIG.STAMINA_LOW_THRESHOLD) dom.hungerFill.classList.add('low');

  var dangerMap = { safe: '安全', warning: '警戒', critical: '危險' };
  var safeDanger = gameState.dangerLevel || 'safe';
  dom.statusDanger.textContent = dangerMap[safeDanger] || '安全';
  dom.statusDanger.className = 'danger-tag ' + safeDanger;

  var injuryMap = { none: '', minor: '輕傷', severe: '重傷' };
  var safeInjury = gameState.injuryStatus || 'none';
  var injuryText = injuryMap[safeInjury] || '';
  if (injuryText) {
    dom.injuryTag.textContent = injuryText;
    dom.injuryTag.className = 'injury-tag ' + safeInjury;
    dom.injuryTag.classList.remove('hidden');
  } else {
    dom.injuryTag.classList.add('hidden');
  }

  dom.statHumanity.textContent = gameState.humanity || 0;

  if (dom.statAwakening) {
    dom.statAwakening.textContent = (gameState.awakeningLevel && gameState.awakeningLevel > 0)
      ? ('Lv.' + gameState.awakeningLevel + ' ' + (gameState.awakeningAbility || '') + '（' + (gameState.abilityExp || 0) + '/' + getAbilityExpNeeded(gameState.awakeningLevel) + '）')
      : '未覺醒';
  }

  dom.statWeather.textContent = gameState.weather || '未知';
  
  var safeCompanions = gameState.companions || [];
  if (dom.statCompanions) dom.statCompanions.textContent = safeCompanions.length ? safeCompanions.join('、') : '無';

  var factionEntries = [];
  var safeFactionTrust = gameState.factionTrust || {};
  for (var k in safeFactionTrust) {
    if (Object.prototype.hasOwnProperty.call(safeFactionTrust, k)) {
      factionEntries.push(k + ':' + safeFactionTrust[k]);
    }
  }

  if (dom.statFaction) {
    dom.statFaction.textContent = factionEntries.length ? factionEntries.join(' / ') : '無接觸';
  }

  if (dom.panelItemAwakening) {
    dom.panelItemAwakening.classList.toggle('hidden', !gameState.awakeningLevel || gameState.awakeningLevel <= 0);
  }
  if (dom.panelItemFaction) {
    var hasFactionContact = Object.keys(safeFactionTrust).length > 0;
    dom.panelItemFaction.classList.toggle('hidden', !hasFactionContact);
  }

  /* STREAMING_CHUNK:Updating Tab badges... */
  var npcTabBtn = document.querySelector('.info-tab-btn[data-target="info-npcs"]');
  if (npcTabBtn) {
    var wmForVisibility = typeof WorldMemory !== 'undefined' ? WorldMemory.ensureShape(gameState.worldMemory) : (gameState.worldMemory || {});
    var npcCount = wmForVisibility.relationships ? Object.keys(wmForVisibility.relationships).length : 0;
    npcTabBtn.textContent = '隊友(' + npcCount + ')';
  }

  var vehicleTabBtn = document.querySelector('.info-tab-btn[data-target="info-vehicles"]');
  if (vehicleTabBtn) {
    var safeVehicles = gameState.vehicles || [];
    var vehicleCount = safeVehicles.filter(function (v) { return v && v.status !== 'lost'; }).length;
    vehicleTabBtn.textContent = '載具(' + vehicleCount + ')';
  }

  if (typeof renderCharProfile === 'function') renderCharProfile();
  renderItemsAccordion();
  if (typeof renderNpcPanel === 'function') renderNpcPanel();
  renderVehiclePanel();

  if (typeof updateDynamicVisuals === 'function') updateDynamicVisuals();
}

/* STREAMING_CHUNK:Appending text elements... */
function appendGMText(text) {
  var el = document.createElement('div');
  var classNames = 'narrative-entry gm-text';
  
  if (text.startsWith('[系統]')) {
    classNames += ' system-text';
  } else if (text.startsWith('[開發者權限]')) {
    classNames += ' developer-text';
  }
  
  el.className = classNames;
  el.textContent = text;
  dom.narrativeContent.appendChild(el);
  scrollToBottom();
}

function appendPlayerAction(text, riskLevel) {
  var el = document.createElement('div');
  el.className = 'narrative-entry player-action risk-' + (riskLevel || 'low');
  el.textContent = '▸ ' + text;
  dom.narrativeContent.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(function () {
    dom.narrativeLog.scrollTop = dom.narrativeLog.scrollHeight;
  });
}

function showTyping(show) {
  dom.typingIndicator.classList.toggle('hidden', !show);
  if (show) scrollToBottom();
}

/* STREAMING_CHUNK:Rendering interaction options... */
function renderOptions(options) {
  gameState.lastOptions = options || [];
  dom.optionsContainer.innerHTML = '';
  var list = options || [];
  for (var i = 0; i < list.length; i++) {
    var opt = list[i];
    var validLevels = ['low', 'medium', 'high'];
    var riskLevel = (validLevels.indexOf(opt.risk_level) !== -1)
      ? opt.risk_level
      : getRiskLevel(opt.risk_hint);
    var btn = document.createElement('button');
    btn.className = 'option-btn risk-' + riskLevel;
    btn.type = 'button';
    var riskHtml = opt.risk_hint ? ('<span class="option-risk">' + escapeHtml(opt.risk_hint) + '</span>') : '';
    btn.innerHTML = '<span class="option-id">' + opt.id + '.</span>' + escapeHtml(opt.label) + riskHtml;
    btn.addEventListener('click', makeOptionClickHandler(opt, riskLevel));
    dom.optionsContainer.appendChild(btn);
  }
  dom.optionsCollapseToggle.classList.toggle('hidden', list.length === 0);
  applyOptionsDisplayMode();
}

function makeOptionClickHandler(opt, riskLevel) {
  return function () {
    if (opt.id === 'RETRY') {
      requestNextTurn(gameState.lastPlayerAction || '__START__');
    } else {
      gameState.lastActionRiskLevel = riskLevel;
      requestNextTurn(opt.label);
    }
  };
}

function applyOptionsDisplayMode() {
  dom.optionsContainer.classList.toggle('hidden', optionsMiniMode);
  dom.freeInputToggle.classList.toggle('hidden', optionsMiniMode);
  dom.freeInputRow.classList.add('hidden');
  dom.optionsCollapseToggle.classList.toggle('hidden', optionsMiniMode);
  dom.optionsCollapseToggle.classList.toggle('expanded', !optionsMiniMode);
  dom.actionCollapsedBar.classList.toggle('hidden', !optionsMiniMode);
}

/* STREAMING_CHUNK:Modal dialogs... */
function showEventModal(icon, title, text) {
  dom.eventModalIcon.textContent = icon;
  dom.eventModalTitle.textContent = title;
  dom.eventModalText.textContent = text;
  dom.eventModal.classList.remove('hidden');
}

function showDeathScreen(text) {
  dom.eventModal.classList.add('hidden');
  dom.optionsContainer.innerHTML = '';
  dom.optionsCollapseToggle.classList.add('hidden');
  dom.freeInputToggle.classList.add('hidden');
  dom.freeInputRow.classList.add('hidden');
  dom.deathScreen.querySelector('.death-text').textContent = text;
  dom.deathScreen.classList.remove('hidden');
}

function updateDynamicVisuals() {
  var appContainer = document.getElementById('app');
  var currentLoc = gameState.location || "未知";
  var currentZone = "未知";
  
  for (var poolId in MAP_PRESETS) {
    var pool = MAP_PRESETS[poolId];
    if (pool.name === currentLoc || pool.locations.some(function(l) { return l.name === currentLoc; })) {
      currentZone = poolId;
      break;
    }
  }
  if (currentZone === "未知" && gameState.currentMapPresetId) {
     currentZone = gameState.currentMapPresetId;
  }

  var zoneBgMap = {
    "維爾赫姆市": "wilhelm_city.jpg",
    "灰堡": "greywall.jpg",
    "荒原鎮群": "ashfield.jpg",
    "靜默聖所": "sanctum.jpg",
    "深谷中繼站": "hollowreach.jpg",
    "方舟海上堡壘": "ark_fortress.jpg"
  };

  var specificLocationBgMap = {
    "荒廢鐵路": "railway.jpg",
    "荒廢公路": "highway.jpg",
    "市郊工業區": "industrial.jpg",
    "舊城區公寓": "apartment.jpg",
    "沿海漁村": "fishing_village.jpg",
    "大學宿舍": "dormitory.jpg",
    "郊區農場": "farm.jpg",
    "市中心辦公大樓": "office.jpg",
    "山區小鎮": "mountain_town.jpg",
    "港口貨運站": "port.jpg",
    "廢棄地鐵隧道": "subway.jpg",
    "大型購物中心廢墟": "mall.jpg",
    "警局軍械庫": "armory.jpg",
    "體育館避難所": "stadium.jpg",
    "自來水處理廠": "water_plant.jpg",
    "荒野廣播電台": "radio_tower.jpg",
    "廢棄仁愛醫院": "hospital.jpg",
    "地下彈藥庫": "ammo_bunker.jpg",
    "拾荒者黑市": "black_market.jpg", 
    "懺悔地牢": "dungeon.jpg",
    "通訊雷達塔": "radar_dish.jpg",
    "核心拍賣所": "auction_hall.jpg"
  };
  
  var finalBgFileName = specificLocationBgMap[currentLoc] || zoneBgMap[currentZone] || "default.jpg";
  
  if (appContainer) {
    appContainer.style.backgroundImage = "url('images/bg/" + finalBgFileName + "')";
  }

  var avatarBox = document.getElementById('player-avatar-box');
  if (avatarBox && gameState.charSetup) {
    var gender = (gameState.charSetup.gender === '女性') ? 'female' : 'male';
    var bgType = gameState.charSetup.backgroundType;
    
    if (!bgType || bgType === 'generalist') {
      bgType = 'survivor';
    }
    
    var avatarFileName = gender + '_' + bgType + '.jpg';
    avatarBox.style.backgroundImage = "url('images/chars/" + avatarFileName + "')";
    
    if (gameState.awakeningLevel && gameState.awakeningLevel > 0) {
       avatarBox.classList.add('awakened');
    } else {
       avatarBox.classList.remove('awakened');
    }
  }
}

/* STREAMING_CHUNK:Rendering character profile... */
function renderCharProfile() {
  var c = gameState.charSetup;
  if (dom.profileName) dom.profileName.textContent = c.name || '未命名';
  if (dom.profileGender) dom.profileGender.textContent = c.gender || '未指定';
  if (dom.profileLocation) dom.profileLocation.textContent = c.location || '未知';
  if (dom.profileOccupation) dom.profileOccupation.textContent = c.occupation || '未知';

  renderProfileProficiency();
  renderProfileInjury();
  renderProfileAwakening();
  renderProfileSafezones();
  renderProfileFactions();
}

function renderProfileProficiency() {
  if (!dom.charProfileBody) return;
  var existing = document.getElementById('profile-proficiency-section');
  if (existing) existing.remove();

  var container = document.createElement('div');
  container.id = 'profile-proficiency-section';
  var html = '<div class="char-profile-section-title">體格熟練度</div><div class="profile-awakening-card" style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">';
  
  if (gameState.skillProficiency) {
    for (var k in PROFICIENCY_LABELS) {
      var exp = gameState.skillProficiency[k] || 0;
      var lv = getProficiencyLevel(exp);
      html += '<div style="font-size: 0.9em; color: ' + (lv > 1 ? '#4a90e2' : '#888') + ';">' + PROFICIENCY_LABELS[k] + ' Lv.' + lv + '</div>';
    }
  }
  html += '</div>';
  container.innerHTML = html;
  
  dom.charProfileBody.insertBefore(container, dom.profileSafezoneList.previousElementSibling);
}

function renderProfileInjury() {
  if (!dom.profileInjurySection) return;
  if (gameState.injuryStatus === 'none' || !gameState.injuryStatus) {
    dom.profileInjurySection.classList.add('hidden');
    return;
  }
  dom.profileInjurySection.classList.remove('hidden');
  var levelMap = { minor: '輕度受傷', severe: '重度受傷' };
  var levelText = levelMap[gameState.injuryStatus] || gameState.injuryStatus;
  if (dom.profileInjuryLevel) {
    dom.profileInjuryLevel.textContent = levelText;
    dom.profileInjuryLevel.className = 'profile-injury-level ' + gameState.injuryStatus;
  }
  if (dom.profileInjuryDetail) {
    dom.profileInjuryDetail.textContent = gameState.injuryDetail || '傷勢細節未知';
  }
}

function renderProfileAwakening() {
  if (!dom.profileAwakeningSection) return;
  if (gameState.awakeningLevel <= 0) {
    dom.profileAwakeningSection.classList.add('hidden');
    return;
  }
  dom.profileAwakeningSection.classList.remove('hidden');
  if (dom.profileAwakeningLevel) {
    dom.profileAwakeningLevel.textContent = 'Lv.' + gameState.awakeningLevel;
  }
  if (dom.profileAwakeningAbility) {
    dom.profileAwakeningAbility.textContent = gameState.awakeningAbility || '尚未顯現';
  }
  if (dom.profileAwakeningExp) {
    dom.profileAwakeningExp.textContent = gameState.abilityExp + ' / ' + getAbilityExpNeeded(gameState.awakeningLevel);
  }
}

/* STREAMING_CHUNK:Rendering Safezones & Fast Travel... */
function renderProfileSafezones() {
  var container = document.getElementById('profile-safezone-list');
  if (!container) return;
  
  var worldMemory = gameState.worldMemory || {}; 
  var zones = worldMemory.safeZones || [];

  if (!Array.isArray(zones) && typeof zones === 'object') {
    var temp = [];
    for (var key in zones) {
      if (Object.prototype.hasOwnProperty.call(zones, key)) {
        var z = zones[key];
        z.name = z.name || key; 
        temp.push(z);
      }
    }
    zones = temp;
  }

  container.innerHTML = ''; 
  if (zones.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'profile-subentity-empty';
    emptyEl.textContent = '尚未建立或發現任何安全區';
    container.appendChild(emptyEl);
    return;
  }

  var template = document.getElementById('safezone-card-template');
  if (!template) return;

  zones.forEach(function (zone) {
    var clone = template.content.cloneNode(true); 
    
    var nameSpan = clone.querySelector('.profile-safezone-name');
    nameSpan.textContent = zone.name;
    
    // 在安全區加上「前往」按鈕
    var travelBtn = document.createElement('button');
    travelBtn.className = 'icon-btn';
    travelBtn.innerHTML = '➔ 前往';
    travelBtn.style.fontSize = '12px';
    travelBtn.style.color = '#4a90e2';
    travelBtn.style.marginLeft = '8px';
    travelBtn.style.padding = '0 6px';
    travelBtn.onclick = function() {
      if (typeof requestTravelTo === 'function') requestTravelTo(zone.name);
    };
    nameSpan.appendChild(travelBtn);

    clone.querySelector('.profile-safezone-pop').textContent = '人口 ' + (zone.population || 0);
    
    var facilitiesText = (zone.facilities && zone.facilities.length)
      ? (Array.isArray(zone.facilities) ? zone.facilities.join('、') : zone.facilities) 
      : '暫無已知設施';
    clone.querySelector('.profile-safezone-facilities').textContent = '📍 ' + (zone.location || '位置未知') + ' ・ 設施：' + facilitiesText;

    var relNote = zone.factionRelations && (zone.factionRelations.note || zone.factionRelations.backgroundNote);
    if (relNote) {
      var relNoteEl = clone.querySelector('.profile-safezone-relnote');
      relNoteEl.textContent = relNote;
      relNoteEl.classList.remove('hidden');
    }
    
    container.appendChild(clone);
  });
}

function renderProfileFactions() {
  if (!dom.profileFactionList) return;
  var worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
  dom.profileFactionList.innerHTML = '';
  var factionNames = Object.keys(gameState.factionTrust || {});
  if (factionNames.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'profile-subentity-empty';
    emptyEl.textContent = '尚未與任何勢力建立聯繫';
    dom.profileFactionList.appendChild(emptyEl);
    return;
  }
  var recentHistory = (worldMemory.factionHistory || []).slice(-15);
  factionNames.forEach(function (faction) {
    var trust = gameState.factionTrust[faction] || 0;
    var trustClass = trust > 0 ? 'trust-positive' : (trust < 0 ? 'trust-negative' : 'trust-neutral');
    var relatedEvents = recentHistory.filter(function (f) { return f.faction === faction; }).slice(-3);
    var eventsHtml = relatedEvents.map(function (e) {
      return '<div class="profile-faction-history">第' + e.turnRecorded + '回合： ' + escapeHtml(e.eventText) + '</div>';
    }).join('');
    var card = document.createElement('div');
    card.className = 'profile-faction-card';
    card.innerHTML =
      '<div class="profile-faction-header">' +
        '<span class="profile-faction-name">' + escapeHtml(faction) + '</span>' +
        '<span class="profile-faction-trust ' + trustClass + '">信任度 ' + trust + '</span>' +
      '</div>' + eventsHtml;
    dom.profileFactionList.appendChild(card);
  });
}

/* STREAMING_CHUNK:Rendering Vehicles... */
function renderVehiclePanel() {
  if (!dom.vehicleList) return;
  dom.vehicleList.innerHTML = '';
  
  var safeVehicles = gameState.vehicles || [];
  var activeVehicles = safeVehicles.filter(function (v) { return v && v.status !== 'lost'; });
  
  var vehicleTabBtn = document.querySelector('.info-tab-btn[data-target="info-vehicles"]');
  if (vehicleTabBtn) {
    vehicleTabBtn.textContent = '載具(' + activeVehicles.length + ')';
  }

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
    
    var safeName = v.name || '未知載具';
    
    card.innerHTML =
      '<div class="vehicle-card-header">' +
        '<span class="vehicle-name">' + escapeHtml(safeName) + (v.id === gameState.activeVehicleId ? '（使用中）' : '') + '</span>' +
      '</div>' +
      '<div class="vehicle-stat-row">' +
        '<span>耐久 ' + (v.durability || 0) + '/' + (v.maxDurability || 0) + '</span>' +
        '<span>油量 ' + (v.fuel || 0) + '/' + (v.maxFuel || 0) + '</span>' +
      '</div>';

    var cargoRow = document.createElement('div');
    cargoRow.className = 'vehicle-cargo-row';
    
    var safeCargo = v.cargo || [];
    cargoRow.textContent = '貨艙（' + safeCargo.length + '/' + (v.cargoCapacity || 0) + '）：';
    
    if (safeCargo.length === 0) {
      cargoRow.textContent += '空';
    } else {
      safeCargo.forEach(function (it, index) {
        if (!it) return;
        var tag = document.createElement('span');
        tag.textContent = (it.name || '未知物') + ' x' + (it.quantity || 1);
        
        if (typeof transferState !== 'undefined' && transferState.isTransferMode) {
          tag.style.cursor = 'pointer';
          tag.style.border = '1px dashed #4a90e2';
          tag.style.padding = '1px 4px';
          tag.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof openTransferModal === 'function') openTransferModal('vehicle', v.id, it.name, it.quantity);
          });
        }
        cargoRow.appendChild(tag);
        if (index < safeCargo.length - 1) cargoRow.appendChild(document.createTextNode('、'));
      });
    }
    card.appendChild(cargoRow);
    dom.vehicleList.appendChild(card);
  });
}

var expandedItemLocations = {}; 

/* STREAMING_CHUNK:Rendering Items Accordion... */
function renderItemsAccordion() {
  if (!dom.itemsAccordion) return;
  dom.itemsAccordion.innerHTML = '';

  var locations = [];
  
  var safeInventory = gameState.inventory || [];
  locations.push({
    key: '__backpack__',
    label: '隨身背包',
    items: safeInventory,
    isBackpack: true
  });
  
  var safeStashes = gameState.stashes || [];
  safeStashes.forEach(function (s) {
    if (s) {
      locations.push({
        key: s.id,
        label: s.locationName || '未知暫存點',
        items: s.items || [],
        isBackpack: false
      });
    }
  });

  locations.forEach(function (loc) {
    var card = document.createElement('div');
    card.className = 'item-location-card';

    var loadTagHtml = '';
    if (loc.isBackpack) {
      var loadLevel = getInventoryLoadLevel(safeInventory);
      loadTagHtml = '<span class="inventory-load-tag load-' + loadLevel + '">' + loadLevel + '</span>';
    }

    var header = document.createElement('button');
    header.type = 'button';
    header.className = 'item-location-header' + (expandedItemLocations[loc.key] ? ' expanded' : '');
    
    var itemsCount = (loc.items && loc.items.length) ? loc.items.length : 0;
    
    // 渲染標題 (為非背包的暫存點加入前往按鈕)
    var headerHtml = '<span class="location-name">' + escapeHtml(loc.label) + '</span>';
    if (!loc.isBackpack) {
      headerHtml += '<button type="button" class="icon-btn stash-travel-btn" style="font-size: 11px; color: #4a90e2; margin-right: 8px; border: 1px solid rgba(74, 144, 226, 0.4); border-radius: 4px; padding: 2px 6px;">➔ 前往</button>';
    }
    headerHtml += loadTagHtml + '<span class="location-count">' + itemsCount + '項</span><span class="item-location-arrow">▾</span>';
    header.innerHTML = headerHtml;

    // 綁定前往按鈕事件
    var travelBtn = header.querySelector('.stash-travel-btn');
    if (travelBtn) {
      travelBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 防止點擊按鈕時觸發手風琴展開
        if (typeof requestTravelTo === 'function') requestTravelTo(loc.label);
      });
    }

    var body = document.createElement('div');
    body.className = 'item-location-body' + (expandedItemLocations[loc.key] ? '' : ' hidden');

    if (itemsCount === 0) {
      var emptyTag = document.createElement('span');
      emptyTag.className = 'inventory-empty';
      emptyTag.textContent = '空';
      body.appendChild(emptyTag);
    } else {
      loc.items.forEach(function (it) {
        if (!it) return;
        var tag = document.createElement('span');
        tag.className = 'inventory-item';
        tag.textContent = (it.name || '未知物') + ' x' + (it.quantity || 1);

        if (typeof transferState !== 'undefined' && transferState.isTransferMode) {
          tag.style.cursor = 'pointer';
          tag.style.border = '1px dashed #4a90e2';
          tag.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof openTransferModal === 'function') {
              openTransferModal(loc.isBackpack ? 'backpack' : 'stash', loc.key, it.name, it.quantity);
            }
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

    card.appendChild(header);
    card.appendChild(body);
    dom.itemsAccordion.appendChild(card);
  });
}

function openUseModal(itemName, qty) {
  useItemState.itemName = itemName;
  useItemState.maxQty = qty;
  
  var modal = document.getElementById('use-modal');
  document.getElementById('use-item-name').textContent = '物品：' + itemName + ' (持有 ' + qty + ')';
  
  var select = document.getElementById('use-target-select');
  select.innerHTML = '';
  
  select.appendChild(new Option('自己 (' + (gameState.charSetup.name || '主角') + ')', 'player'));
  
  gameState.companions.forEach(function(npc) {
    select.appendChild(new Option('隊員：' + npc, 'npc_' + npc));
  });
  
  if (gameState.companions.length > 0) {
    select.appendChild(new Option('全體分配 (所有人)', 'all'));
  }
  
  modal.classList.remove('hidden');
}
