'use strict';

function renderAll() {
  var testTag = gameState.isTestMode ? '🧪 ' : '';
  dom.status.time.textContent = testTag + '⏱ 第' + gameState.time.day + '天 ' + pad2(gameState.time.hour) + ':' + pad2(gameState.time.minute);
  dom.status.location.textContent = '📍 ' + (gameState.location || '未知');

  var safeStamina = gameState.stamina || 0;
  var safeMaxStamina = gameState.maxStamina || 100;
  var staminaPct = (safeStamina / safeMaxStamina) * 100;
  dom.status.staminaFill.style.width = staminaPct + '%';
  dom.status.staminaValue.textContent = Math.floor(safeStamina);
  dom.status.staminaFill.classList.remove('low', 'critical');
  if (staminaPct <= CONFIG.STAMINA_CRITICAL_THRESHOLD) dom.status.staminaFill.classList.add('critical');
  else if (staminaPct <= CONFIG.STAMINA_LOW_THRESHOLD) dom.status.staminaFill.classList.add('low');

  var safeHunger = gameState.hunger || 0;
  var hungerPct = safeHunger;
  dom.status.hungerFill.style.width = hungerPct + '%';
  dom.status.hungerValue.textContent = Math.floor(safeHunger);
  dom.status.hungerFill.classList.remove('low', 'critical');
  if (hungerPct <= CONFIG.STAMINA_CRITICAL_THRESHOLD) dom.status.hungerFill.classList.add('critical');
  else if (hungerPct <= CONFIG.STAMINA_LOW_THRESHOLD) dom.status.hungerFill.classList.add('low');

  var dangerMap = { safe: '安全', warning: '警戒', critical: '危險' };
  var safeDanger = gameState.dangerLevel || 'safe';
  dom.status.danger.textContent = dangerMap[safeDanger] || '安全';
  dom.status.danger.className = 'danger-tag ' + safeDanger;

  var injuryMap = { none: '', minor: '輕傷', severe: '重傷' };
  var safeInjury = gameState.injuryStatus || 'none';
  var injuryText = injuryMap[safeInjury] || '';
  if (injuryText) {
    dom.status.injuryTag.textContent = injuryText;
    dom.status.injuryTag.className = 'injury-tag ' + safeInjury;
    dom.status.injuryTag.classList.remove('hidden');
  } else {
    dom.status.injuryTag.classList.add('hidden');
  }

  dom.status.humanity.textContent = gameState.humanity || 0;

  if (dom.status.awakening) {
    dom.status.awakening.textContent = (gameState.awakeningLevel && gameState.awakeningLevel > 0)
      ? ('Lv.' + gameState.awakeningLevel + ' ' + (gameState.awakeningAbility || '') + '（' + (gameState.abilityExp || 0) + '/' + getAbilityExpNeeded(gameState.awakeningLevel) + '）')
      : '未覺醒';
  }

  dom.status.weather.textContent = gameState.weather || '未知';

  var safeCompanions = gameState.companions || [];
  if (dom.status.companions) dom.status.companions.textContent = safeCompanions.length ? safeCompanions.join('、') : '無';

  var factionEntries = [];
  var safeFactionTrust = gameState.factionTrust || {};
  for (var k in safeFactionTrust) {
    if (Object.prototype.hasOwnProperty.call(safeFactionTrust, k)) {
      factionEntries.push(k + ':' + safeFactionTrust[k]);
    }
  }
  if (dom.status.faction) {
    dom.status.faction.textContent = factionEntries.length ? factionEntries.join(' / ') : '無接觸';
  }

  if (dom.infoPanelGroup.npcSectionToggle) {
    var wmForVisibility = typeof WorldMemory !== 'undefined' ? WorldMemory.ensureShape(gameState.worldMemory) : (gameState.worldMemory || {});
    var npcCount = wmForVisibility.relationships ? Object.keys(wmForVisibility.relationships).length : 0;
    var npcSpan = dom.infoPanelGroup.npcSectionToggle.querySelector('span');
    if (npcSpan) npcSpan.textContent = '📇 人物檔案（' + npcCount + '）';
  }
  if (dom.infoPanelGroup.vehicleSectionToggle) {
    // 【防呆】確保載具陣列存在
    var safeVehicles = gameState.vehicles || [];
    var hasVehicle = safeVehicles.some(function (v) { return v && v.status !== 'lost'; });
    var vehicleCount = safeVehicles.filter(function (v) { return v && v.status !== 'lost'; }).length;
    var vSpan = dom.infoPanelGroup.vehicleSectionToggle.querySelector('span');
    if (vSpan) vSpan.textContent = '🚗 載具（' + vehicleCount + '）';
  }

  // 渲染所有子面板
  if (typeof renderCharProfile === 'function') renderCharProfile();
  renderItemsAccordion();
  if (typeof renderNpcPanel === 'function') renderNpcPanel();
  renderVehiclePanel();

  // 更新動態視覺（圖片切換）
  if (typeof updateDynamicVisuals === 'function') updateDynamicVisuals();
}

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
  dom.narrative.content.appendChild(el);
  scrollToBottom();
}

function appendPlayerAction(text, riskLevel) {
  var el = document.createElement('div');
  el.className = 'narrative-entry player-action risk-' + (riskLevel || 'low');
  el.textContent = '▸ ' + text;
  dom.narrative.content.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(function () {
    dom.narrative.log.scrollTop = dom.narrative.log.scrollHeight;
  });
}

function showTyping(show) {
  dom.narrative.typingIndicator.classList.toggle('hidden', !show);
  if (show) scrollToBottom();
}

function renderOptions(options) {
  gameState.lastOptions = options || [];
  dom.narrative.optionsContainer.innerHTML = '';
  var list = options || [];
  for (var i = 0; i < list.length; i++) {
    var opt = list[i];
    var validLevels = ['low', 'medium', 'high'];
    var riskLevel = (validLevels.indexOf(opt.risk_level) !== -1) ? opt.risk_level : getRiskLevel(opt.risk_hint);
    var btn = document.createElement('button');
    btn.className = 'option-btn risk-' + riskLevel;
    btn.type = 'button';
    var riskHtml = opt.risk_hint ? ('<span class="option-risk">' + escapeHtml(opt.risk_hint) + '</span>') : '';
    btn.innerHTML = '<span class="option-id">' + opt.id + '.</span>' + escapeHtml(opt.label) + riskHtml;
    btn.addEventListener('click', makeOptionClickHandler(opt, riskLevel));
    dom.narrative.optionsContainer.appendChild(btn);
  }
  dom.narrative.optionsCollapseToggle.classList.toggle('hidden', list.length === 0);
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
  dom.narrative.optionsContainer.classList.toggle('hidden', optionsMiniMode);
  dom.narrative.freeInputToggle.classList.toggle('hidden', optionsMiniMode);
  dom.narrative.freeInputRow.classList.add('hidden');
  dom.narrative.optionsCollapseToggle.classList.toggle('hidden', optionsMiniMode);
  dom.narrative.optionsCollapseToggle.classList.toggle('expanded', !optionsMiniMode);
  dom.narrative.actionCollapsedBar.classList.toggle('hidden', !optionsMiniMode);
}

function showEventModal(icon, title, text) {
  dom.modal.eventIcon.textContent = icon;
  dom.modal.eventTitle.textContent = title;
  dom.modal.eventText.textContent = text;
  dom.modal.event.classList.remove('hidden');
}

function showDeathScreen(text) {
  dom.modal.event.classList.add('hidden');
  dom.narrative.optionsContainer.innerHTML = '';
  dom.narrative.optionsCollapseToggle.classList.add('hidden');
  dom.narrative.freeInputToggle.classList.add('hidden');
  dom.narrative.freeInputRow.classList.add('hidden');
  dom.modal.deathScreen.querySelector('.death-text').textContent = text;
  dom.modal.deathScreen.classList.remove('hidden');
}

function updateDynamicVisuals() {
  var appContainer = dom.app.root;
  var currentLoc = gameState.location || "未知";
  var currentZone = "未知";

  for (var poolId in MAP_PRESETS) {
    var pool = MAP_PRESETS[poolId];
    if (pool.name === currentLoc || pool.locations.some(function (l) { return l.name === currentLoc; })) {
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
    "體育館基地": "stadium.jpg",
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

  var avatarBox = dom.app.playerAvatarBox;

  if (avatarBox && gameState.charSetup) {
    var genderValue = String(gameState.charSetup.gender || '').trim();

    var gender = (
      genderValue === '女' ||
      genderValue === '女性' ||
      genderValue === 'female'
    )
      ? 'female'
      : 'male';

    var bgType = String(gameState.charSetup.backgroundType || '').trim();

    if (!bgType || bgType === 'generalist') {
      bgType = 'survivor';
    }

    var avatarFileName = gender + '_' + bgType + '.jpg';
    var fallbackFileName = gender + '_default.jpg';

    var avatarUrl = 'images/chars/' + avatarFileName;
    var fallbackUrl = 'images/chars/' + fallbackFileName;

    var avatarImage = new Image();

    avatarImage.onload = function () {
      avatarBox.style.backgroundImage = 'url("' + avatarUrl + '")';
    };

    avatarImage.onerror = function () {
      avatarBox.style.backgroundImage = 'url("' + fallbackUrl + '")';
    };

    avatarImage.src = avatarUrl;

    if (gameState.awakeningLevel && gameState.awakeningLevel > 0) {
      avatarBox.classList.add('awakened');
    } else {
      avatarBox.classList.remove('awakened');
    }
  }
}

function renderCharProfile() {
  var c = gameState.charSetup;
  if (dom.profile.gender) dom.profile.gender.textContent = c.gender || '未指定';
  if (dom.profile.occupation) dom.profile.occupation.textContent = c.occupation || '未知';
  renderProfileProficiency();
  renderProfileInjury();
  renderProfileAwakening();
  renderProfileSafezones();
  renderProfileFactions();
}

function renderProfileProficiency() {
  var existing = document.getElementById('profile-proficiency-section');
  if (existing) existing.remove();

  var anchor = dom.profile.proficiencyAnchor;
  if (!anchor) {
    console.warn('[UI警告] 找不到 #profile-proficiency-anchor，請確認 index.html 是否已新增此錨點元素。體格熟練度區塊將無法顯示。');
    return;
  }

  var container = document.createElement('div');
  container.id = 'profile-proficiency-section';
  var html = '<div class="char-profile-section-title">體格熟練度</div><div class="profile-awakening-card" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
  if (gameState.skillProficiency) {
    for (var k in PROFICIENCY_LABELS) {
      var exp = gameState.skillProficiency[k] || 0;
      var lv = getProficiencyLevel(exp);
      html += '<div style="font-size:0.9em;color:' + (lv > 1 ? '#4a90e2' : '#888') + ';">' + PROFICIENCY_LABELS[k] + ' Lv.' + lv + '</div>';
    }
  }
  html += '</div>';
  container.innerHTML = html;
  anchor.insertAdjacentElement('afterend', container);
}

function renderProfileInjury() {
  if (!dom.profile.injurySection) return;
  if (gameState.injuryStatus === 'none' || !gameState.injuryStatus) {
    dom.profile.injurySection.classList.add('hidden');
    return;
  }
  dom.profile.injurySection.classList.remove('hidden');
  var levelMap = { minor: '輕傷', severe: '重傷' };
  var levelText = levelMap[gameState.injuryStatus] || gameState.injuryStatus;
  if (dom.profile.injuryLevel) {
    dom.profile.injuryLevel.textContent = levelText;
    dom.profile.injuryLevel.className = 'profile-injury-level ' + gameState.injuryStatus;
  }
  if (dom.profile.injuryDetail) dom.profile.injuryDetail.textContent = gameState.injuryDetail;
}

var expandedFactionLocationGroups = {};

function renderProfileAwakening() {
  if (!dom.profile.awakeningSection) return;
  if (gameState.awakeningLevel <= 0) {
    dom.profile.awakeningSection.classList.add('hidden');
    return;
  }
  dom.profile.awakeningSection.classList.remove('hidden');
  if (dom.profile.awakeningLevel) dom.profile.awakeningLevel.textContent = 'Lv.' + gameState.awakeningLevel;

  var abilityText = gameState.awakenedElement
    ? gameState.awakenedElement + '屬性 · Lv.' + gameState.awakeningLevel
    : 'Lv.' + gameState.awakeningLevel;
  if (dom.profile.awakeningAbility) dom.profile.awakeningAbility.textContent = abilityText;

  if (dom.profile.awakeningExp) dom.profile.awakeningExp.textContent = gameState.abilityExp + '/' + getAbilityExpNeeded(gameState.awakeningLevel);
}

function renderProfileSafezones() {
  var container = dom.profile.safezoneList;
  if (!container) return;
  var worldMemory = gameState.worldMemory;
  var zones = worldMemory.safeZones;
  if (!Array.isArray(zones) && typeof zones === 'object') {
    var temp = [];
    for (var key in zones) {
      if (Object.prototype.hasOwnProperty.call(zones, key)) {
        var z = zones[key];
        if (!z.name) z.name = key;
        temp.push(z);
      }
    }
    zones = temp;
  }

  container.innerHTML = '';
  if (!zones || zones.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'profile-subentity-empty';
    emptyEl.textContent = '尚未建立任何基地';
    container.appendChild(emptyEl);
    return;
  }

  var template = dom.template.safezoneCard;
  if (!template) return;

  zones.forEach(function (zone) {
    var clone = template.content.cloneNode(true);
    clone.querySelector('.profile-safezone-name').textContent = zone.name;
    var travelBtn = clone.querySelector('.safezone-travel-btn');
    if (travelBtn) {
      travelBtn.onclick = function () {
        if (typeof requestTravelTo === 'function') requestTravelTo(zone.name);
      };
    }
    clone.querySelector('.profile-safezone-pop').textContent = '人口：' + (zone.population || 0);
    var facilitiesText = zone.facilities && zone.facilities.length
      ? (Array.isArray(zone.facilities) ? zone.facilities.join('、') : zone.facilities)
      : '無設施';
    clone.querySelector('.profile-safezone-facilities').textContent = (zone.location || '') + '｜' + facilitiesText;

    var relNote = zone.factionRelations && (zone.factionRelations.note || zone.factionRelations.backgroundNote);
    if (relNote) {
      var relNoteEl = clone.querySelector('.profile-safezone-relnote');
      if (relNoteEl) {
        relNoteEl.textContent = relNote;
        relNoteEl.classList.remove('hidden');
      }
    }
    container.appendChild(clone);
  });
}

function getRegionKeyForFaction(factionName) {
  for (var regionKey in FACTION_ALIASES) {
    if (
      Object.prototype.hasOwnProperty.call(FACTION_ALIASES, regionKey) &&
      FACTION_ALIASES[regionKey] === factionName
    ) {
      return regionKey;
    }
  }

  return null;
}

function isFactionRegionDiscovered(factionName) {
  var regionKey = getRegionKeyForFaction(factionName);

  if (!regionKey || !Array.isArray(gameState.discoveredRegions)) {
    return false;
  }

  return gameState.discoveredRegions.indexOf(regionKey) !== -1;
}

function renderProfileFactions() {
  if (!dom.profile.factionList) return;

  var worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
  var factionList = dom.profile.factionList;

  factionList.innerHTML = '';

  var factionNames = Object.keys(gameState.factionTrust || {});

  if (factionNames.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'profile-subentity-empty';
    emptyEl.textContent = '尚未接觸任何勢力';
    factionList.appendChild(emptyEl);
    return;
  }

  var recentHistory = (worldMemory.factionHistory || []).slice(-15);

  factionNames.forEach(function (factionName) {
    var trust = gameState.factionTrust[factionName] || 0;

    var trustClass = trust > 0
      ? 'trust-positive'
      : trust < 0
        ? 'trust-negative'
        : 'trust-neutral';

    var relatedEvents = recentHistory
      .filter(function (entry) {
        return entry.faction === factionName;
      })
      .slice(-3);

    var regionKey = getRegionKeyForFaction(factionName);
    var hasDiscoveredRegion = isFactionRegionDiscovered(factionName);

    var regionLocations = (
      regionKey &&
      MAP_PRESETS[regionKey] &&
      Array.isArray(MAP_PRESETS[regionKey].locations)
    )
      ? MAP_PRESETS[regionKey].locations
      : [];

    var card = document.createElement('div');
    card.className = 'profile-faction-card';

    var header = document.createElement('div');
    header.className = 'profile-faction-header';

    var nameEl = document.createElement('span');
    nameEl.className = 'profile-faction-name';
    nameEl.textContent = factionName;

    var rightSide = document.createElement('span');
    rightSide.style.display = 'flex';
    rightSide.style.alignItems = 'center';
    rightSide.style.gap = '8px';

    var trustEl = document.createElement('span');
    trustEl.className = 'profile-faction-trust ' + trustClass;
    trustEl.textContent = trust;

    rightSide.appendChild(trustEl);

    var locationsBody = null;
    var isExpanded = false;

    if (hasDiscoveredRegion) {
      isExpanded = !!expandedFactionLocationGroups[factionName];

      var arrowEl = document.createElement('span');
      arrowEl.className = 'profile-faction-location-arrow';
      arrowEl.textContent = isExpanded ? '▲' : '▼';
      arrowEl.style.fontSize = '11px';
      arrowEl.style.color = 'var(--text-dim)';

      rightSide.appendChild(arrowEl);

      header.style.cursor = 'pointer';
      header.setAttribute('role', 'button');
      header.setAttribute('aria-expanded', String(isExpanded));
    }

    header.appendChild(nameEl);
    header.appendChild(rightSide);
    card.appendChild(header);

    if (relatedEvents.length > 0) {
      relatedEvents.forEach(function (entry) {
        var eventEl = document.createElement('div');
        eventEl.className = 'profile-faction-history';
        eventEl.textContent =
          '第' +
          entry.turnRecorded +
          '回合：' +
          entry.eventText;

        card.appendChild(eventEl);
      });
    }

    if (hasDiscoveredRegion) {
      locationsBody = document.createElement('div');
      locationsBody.className = 'profile-faction-locations';
      locationsBody.style.display = isExpanded ? 'block' : 'none';
      locationsBody.style.marginTop = '8px';
      locationsBody.style.paddingTop = '8px';
      locationsBody.style.borderTop =
        '1px dashed var(--border-color)';

      regionLocations.forEach(function (location) {
        (function (locationName) {
          var locationRow = document.createElement('div');

          locationRow.style.display = 'flex';
          locationRow.style.alignItems = 'center';
          locationRow.style.justifyContent = 'space-between';
          locationRow.style.gap = '8px';
          locationRow.style.padding = '6px 0';

          var locationLabel = document.createElement('span');
          locationLabel.textContent = locationName;
          locationLabel.style.fontSize = '11.5px';
          locationLabel.style.color = 'var(--text-secondary)';
          locationLabel.style.minWidth = '0';
          locationLabel.style.overflow = 'hidden';
          locationLabel.style.textOverflow = 'ellipsis';
          locationLabel.style.whiteSpace = 'nowrap';

          var travelBtn = document.createElement('button');
          travelBtn.type = 'button';
          travelBtn.className = 'faction-location-travel-btn';
          travelBtn.textContent = '➔ 前往';

          travelBtn.addEventListener('click', function (event) {
            event.stopPropagation();

            if (typeof requestTravelTo === 'function') {
              requestTravelTo(locationName);
            }
          });

          locationRow.appendChild(locationLabel);
          locationRow.appendChild(travelBtn);
          locationsBody.appendChild(locationRow);
        })(location.name);
      });

      card.appendChild(locationsBody);

      header.addEventListener('click', function () {
        var willExpand = !expandedFactionLocationGroups[factionName];

        expandedFactionLocationGroups[factionName] = willExpand;
        locationsBody.style.display = willExpand ? 'block' : 'none';

        var currentArrow = header.querySelector(
          '.profile-faction-location-arrow'
        );

        if (currentArrow) {
          currentArrow.textContent = willExpand ? '▲' : '▼';
        }

        header.setAttribute('aria-expanded', String(willExpand));
      });
    }

    factionList.appendChild(card);
  });
}

function renderVehiclePanel() {
  if (!dom.infoPanelGroup.vehicleList) return;
  dom.infoPanelGroup.vehicleList.innerHTML = '';
  var safeVehicles = gameState.vehicles || [];
  var activeVehicles = safeVehicles.filter(function (v) { return v && v.status !== 'lost'; });

  if (dom.infoPanelGroup.vehicleSectionToggle) {
    var vSpan = dom.infoPanelGroup.vehicleSectionToggle.querySelector('span');
    if (vSpan) vSpan.textContent = activeVehicles.length;
  }

  if (activeVehicles.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'vehicle-empty';
    emptyEl.textContent = '尚未擁有任何載具';
    dom.infoPanelGroup.vehicleList.appendChild(emptyEl);
    return;
  }

  activeVehicles.forEach(function (v) {
    var card = document.createElement('div');
    card.className = 'vehicle-card' + (v.id === gameState.activeVehicleId ? ' vehicle-active' : '');
    var safeName = v.name || '未命名載具';
    card.innerHTML = '<div class="vehicle-card-header"><span class="vehicle-name">' + escapeHtml(safeName) + '</span>' + (v.id === gameState.activeVehicleId ? '<span class="vehicle-active-tag">使用中</span>' : '') + '</div><div class="vehicle-stat-row"><span>耐久 ' + (v.durability || 0) + '/' + (v.maxDurability || 0) + '</span><span>油量 ' + (v.fuel || 0) + '/' + (v.maxFuel || 0) + '</span></div>';

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
        tag.textContent = it.name + ' x' + it.quantity;
        if (typeof transferState !== 'undefined' && transferState.isTransferMode) {
          tag.style.cursor = 'pointer';
          tag.style.border = '1px dashed #4a90e2';
          tag.style.padding = '1px 4px';
          tag.addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof openTransferModal === 'function') openTransferModal('vehicle', v.id, it.name, it.quantity);
          });
        }
        cargoRow.appendChild(tag);
        if (index < safeCargo.length - 1) cargoRow.appendChild(document.createTextNode('、'));
      });
    }
    card.appendChild(cargoRow);
    dom.infoPanelGroup.vehicleList.appendChild(card);
  });
}

var expandedItemLocations = {};

function renderItemsAccordion() {
  if (!dom.infoPanelGroup.itemsAccordion) return;
  dom.infoPanelGroup.itemsAccordion.innerHTML = '';
  var locations = [];
  var safeInventory = gameState.inventory || [];
  locations.push({ key: 'backpack', label: '隨身背包', items: safeInventory, isBackpack: true });
  var safeStashes = gameState.stashes || [];
  safeStashes.forEach(function (s) {
    if (s) locations.push({ key: s.id, label: s.locationName, items: s.items, isBackpack: false });
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
    var itemsCount = loc.items ? loc.items.length : 0;
    header.innerHTML = '<span class="location-name">' + escapeHtml(loc.label) + '</span>' + loadTagHtml + '<span class="location-count">' + itemsCount + '</span><span class="item-location-arrow">▾</span>';

    var body = document.createElement('div');
    body.className = 'item-location-body' + (expandedItemLocations[loc.key] ? '' : ' hidden');
    if (itemsCount === 0) {
      var emptyTag = document.createElement('span');
      emptyTag.className = 'inventory-empty';
      emptyTag.textContent = '空無一物';
      body.appendChild(emptyTag);
    } else {
      loc.items.forEach(function (it) {
        if (!it) return;
        var tag = document.createElement('span');
        tag.className = 'inventory-item';
        tag.textContent = it.name + ' x' + it.quantity;
        if (typeof transferState !== 'undefined' && transferState.isTransferMode) {
          tag.style.cursor = 'pointer';
          tag.style.border = '1px dashed #4a90e2';
          tag.addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof openTransferModal === 'function') openTransferModal(loc.isBackpack ? 'backpack' : 'stash', loc.key, it.name, it.quantity);
          });
        } else if (loc.isBackpack) {
          tag.style.cursor = 'pointer';
          tag.addEventListener('mouseover', function () { tag.style.background = 'rgba(255,255,255,0.1)'; });
          tag.addEventListener('mouseout', function () { tag.style.background = 'transparent'; });
          tag.addEventListener('click', function (e) {
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
    dom.infoPanelGroup.itemsAccordion.appendChild(card);
  });
}

function openUseModal(itemName, qty) {
  useItemState.itemName = itemName;
  useItemState.maxQty = qty;

  var useModal = dom.modal && dom.modal.use;
  if (!useModal || !useModal.root || !useModal.itemName || !useModal.targetSelect) {
    console.warn('[UI警告] 物品使用彈窗快取不完整，無法開啟。請確認 cacheDom() 的 dom.modal.use 分組。');
    return;
  }

  useModal.itemName.textContent = itemName + '（可用 ' + qty + ' 份）';
  var select = useModal.targetSelect;
  select.innerHTML = '';
  select.appendChild(new Option(gameState.charSetup.name || '你', 'player'));
  gameState.companions.forEach(function (npc) {
    select.appendChild(new Option(npc, 'npc_' + npc));
  });
  if (gameState.companions.length > 0) {
    select.appendChild(new Option('全體人員', 'all'));
  }
  useModal.root.classList.remove('hidden');
}

function openTravelConfirmModal(targetLocation, dist, costType, costValue, timeCost, canTravel, errorMsg, activeVehicle) {
  var modal = dom.modal.travel.root;
  var targetNameEl = dom.modal.travel.targetName;
  var infoDiv = dom.modal.travel.costInfo;
  var confirmBtn = dom.modal.travel.confirmBtn;
  var cancelBtn = dom.modal.travel.cancelBtn;

  if (!modal || !targetNameEl || !infoDiv || !confirmBtn || !cancelBtn) {
    console.warn('[UI警告] 旅途確認視窗的 DOM 快取不完整，已取消開啟旅途確認視窗。');
    return;
  }

  cancelBtn.onclick = function () { modal.classList.add('hidden'); };

  targetNameEl.textContent = '目的地：' + targetLocation;
  var modeStr = costType === 'fuel' ? '<span style="color:#8fbc8f;">🚗 駕車前往</span>' : '<span style="color:#d4a017;">🚶 徒步前往</span>';
  var html = '<span style="color:#fff;">距離：' + dist + ' 公里</span><br>';
  html += '<span style="color:#fff;">預估耗時：' + Math.floor(timeCost / 60) + ' 時 ' + (timeCost % 60) + ' 分</span><br>';
  html += modeStr + '<hr style="border-color:var(--border-color);margin:8px 0;">';
  if (costType === 'fuel') {
    html += '<span style="color:#fff;">預估耗油：' + costValue + '</span><br>';
    html += '<span style="color:#fff;">耐久損耗：' + ((dist / 10) * 2).toFixed(1) + '</span>';
  } else {
    html += '<span style="color:#fff;">預估耗體力：' + costValue + '</span>';
  }

  if (!canTravel) {
    html += '<div style="color:#e57373;margin-top:10px;font-weight:bold;">' + errorMsg + '</div>';
    confirmBtn.style.opacity = 0.5;
    confirmBtn.style.pointerEvents = 'none';
    confirmBtn.onclick = null;
  } else {
    confirmBtn.style.opacity = 1;
    confirmBtn.style.pointerEvents = 'auto';
    confirmBtn.onclick = function () {
      modal.classList.add('hidden');
      if (typeof executeTravel === 'function') executeTravel(targetLocation, dist, costType, costValue, timeCost, activeVehicle);
    };
  }

  infoDiv.innerHTML = html;
  modal.classList.remove('hidden');
}
