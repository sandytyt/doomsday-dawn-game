'use strict';

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

  if (dom.npcSectionToggle) {
    var wmForVisibility = typeof WorldMemory !== 'undefined' ? WorldMemory.ensureShape(gameState.worldMemory) : (gameState.worldMemory || {});
    var npcCount = wmForVisibility.relationships ? Object.keys(wmForVisibility.relationships).length : 0;
    var npcSpan = dom.npcSectionToggle.querySelector('span');
    if (npcSpan) npcSpan.textContent = '📇 人物檔案（' + npcCount + '）';
  }

  if (dom.vehicleSectionToggle) {
    // 【防呆】確保載具陣列存在
    var safeVehicles = gameState.vehicles || [];
    var hasVehicle = safeVehicles.some(function (v) { return v && v.status !== 'lost'; });
    var vehicleCount = safeVehicles.filter(function (v) { return v && v.status !== 'lost'; }).length;
    var vSpan = dom.vehicleSectionToggle.querySelector('span');
    if (vSpan) vSpan.textContent = '🚗 載具（' + vehicleCount + '）';
  }

  // 渲染所有子面板
  if (typeof renderCharProfile === 'function') renderCharProfile();
  renderItemsAccordion();
  if (typeof renderNpcPanel === 'function') renderNpcPanel();
  renderVehiclePanel();

  // 更新動態視覺 (圖片切換)
  if (typeof updateDynamicVisuals === 'function') updateDynamicVisuals();
}

function appendGMText(text) {
  var el = document.createElement('div');
  
  // 預設樣式
  var classNames = 'narrative-entry gm-text';
  
  // 偵測開頭並加入專屬樣式
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
  
  // 1. 反推目前所在地屬於哪個大區域
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

  // 2. 圖片檔名對應字典 (大區域背景)
  var zoneBgMap = {
    "維爾赫姆市": "wilhelm_city.jpg",
    "灰堡": "greywall.jpg",
    "荒原鎮群": "ashfield.jpg",
    "靜默聖所": "sanctum.jpg",
    "深谷中繼站": "hollowreach.jpg",
    "方舟海上堡壘": "ark_fortress.jpg"
  };

  // 3. 圖片檔名對應字典 (具體小地點 - 可隨時擴充)
  var specificLocationBgMap = {
    // 開局常見地點
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
    
    // 大勢力標誌性地標
    "廢棄仁愛醫院": "hospital.jpg",
    "地下彈藥庫": "ammo_bunker.jpg",
    "拾荒者 গণতান্ত্রিক": "black_market.jpg", // 注意：如果你前面用的是 拾荒者黑市，確保這對應一致
    "懺悔地牢": "dungeon.jpg",
    "通訊雷達塔": "radar_dish.jpg",
    "核心拍賣所": "auction_hall.jpg"
  };
  
  // 決定最終背景：先找「具體地點」，找不到找「大區背景」，再沒有就「預設背景」
  var finalBgFileName = specificLocationBgMap[currentLoc] || zoneBgMap[currentZone] || "default.jpg";
  
  if (appContainer) {
    appContainer.style.backgroundImage = "url('images/bg/" + finalBgFileName + "')";
  }

  // 4. 處理主角頭像切換與覺醒發光特效
  var avatarBox = document.getElementById('player-avatar-box');
  if (avatarBox && gameState.charSetup) {
    var gender = (gameState.charSetup.gender === '女性') ? 'female' : 'male';
    var bgType = gameState.charSetup.backgroundType;
    
    // 【修改重點】：防呆機制，一般背景或無背景時，套用 survivor
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
  renderProfileExploredLocations();
}

function renderProfileProficiency() {
  if (!dom.charProfileBody) return;
  // 檢查是否已存在，避免重複建立
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

// 用來記憶玩家展開了哪些地區的手風琴狀態
var expandedLocationGroups = {};

function renderProfileExploredLocations() {
  var container = document.getElementById('profile-explored-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (!gameState.exploredLocations || gameState.exploredLocations.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'profile-subentity-empty';
    emptyEl.textContent = '尚未探索任何具體地點';
    container.appendChild(emptyEl);
    return;
  }

  // 1. 智能分組演算法：將地點依長度排序，最短的當作主區域基礎
  var sortedLocs = gameState.exploredLocations.slice().sort(function(a, b) {
    return a.length - b.length;
  });
  
  // 1. 定義遊戲中的「主要大區關鍵字」（你可以隨時自由擴充）
  var REGION_ANCHORS = [
    '沿海漁村', 
    '內陸荒原', 
    '荒原鎮群', 
    '荒原深處', 
    '廢棄村落', 
    '深谷中繼站', 
    '醫療站'
  ];
  
  var groups = {};
  
  // 2. 只要地點名稱「包含」大區關鍵字，就自動歸類進去
  gameState.exploredLocations.forEach(function(loc) {
    var matchedGroup = null;
    
    for (var i = 0; i < REGION_ANCHORS.length; i++) {
      // 使用 indexOf !== -1，代表只要字串中有出現該關鍵字就算數 (不限字首)
      if (loc.indexOf(REGION_ANCHORS[i]) !== -1) {
        matchedGroup = REGION_ANCHORS[i];
        break;
      }
    }
    
    // 如果有對應到大區，就放入該大區；如果沒有，就把自己當作獨立的群組
    var finalGroupName = matchedGroup ? matchedGroup : loc;
    
    if (!groups[finalGroupName]) {
      groups[finalGroupName] = [];
    }
    // 避免群組標題自己又重複出現在清單中 (可選)
    if (loc !== matchedGroup) {
       groups[finalGroupName].push(loc);
    } else if (groups[finalGroupName].length === 0) {
       groups[finalGroupName].push(loc);
    }
  });

  // 2. 限制容器高度並加入滾動條，防止撐爆畫面
  container.style.maxHeight = '350px';
  container.style.overflowY = 'auto';
  container.style.paddingRight = '5px'; // 預留滾動條空間

  // 3. 渲染分組介面
  for (var groupName in groups) {
    if (Object.prototype.hasOwnProperty.call(groups, groupName)) {
      (function(gName, locs) {
        var groupDiv = document.createElement('div');
        groupDiv.style.marginBottom = '8px';

        // 如果該群組只有 1 個地點，直接顯示單一按鈕
        if (locs.length === 1) {
          groupDiv.appendChild(createLocationButton(locs[0]));
        } else {
          // 如果有多個地點，建立手風琴摺疊標題
          var header = document.createElement('div');
          var isExpanded = expandedLocationGroups[gName] || false;
          
          header.style.display = 'flex';
          header.style.justifyContent = 'space-between';
          header.style.alignItems = 'center';
          header.style.padding = '8px 12px';
          header.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          header.style.borderLeft = '3px solid #4a90e2';
          header.style.borderRadius = '4px';
          header.style.cursor = 'pointer';
          header.style.color = '#e0e0e0';
          
          header.innerHTML = '<span style="font-weight:bold;">🗺️ ' + escapeHtml(gName) + ' 地區</span>' + 
                             '<span style="font-size: 0.8em; color: #888;">' + locs.length + ' 處 ' + (isExpanded ? '▼' : '▶') + '</span>';
          
          var body = document.createElement('div');
          body.style.display = isExpanded ? 'block' : 'none';
          body.style.paddingLeft = '12px';
          body.style.marginTop = '4px';

          locs.forEach(function(loc) {
            body.appendChild(createLocationButton(loc));
          });

          // 綁定點擊展開/收合事件
          header.addEventListener('click', function() {
            var willExpand = (body.style.display === 'none');
            body.style.display = willExpand ? 'block' : 'none';
            expandedLocationGroups[gName] = willExpand;
            header.innerHTML = '<span style="font-weight:bold;">🗺️ ' + escapeHtml(gName) + ' 地區</span>' + 
                               '<span style="font-size: 0.8em; color: #888;">' + locs.length + ' 處 ' + (willExpand ? '▼' : '▶') + '</span>';
          });

          groupDiv.appendChild(header);
          groupDiv.appendChild(body);
        }
        container.appendChild(groupDiv);
      })(groupName, groups[groupName]);
    }
  }
}

// 輔助函數：建立質感的單一地點按鈕 (取代原本的藍色底線)
function createLocationButton(locName) {
  var btn = document.createElement('div');
  
  // 使用 JavaScript 直接寫入樣式，無需額外修改 CSS 檔案
  btn.style.display = 'flex';
  btn.style.justifyContent = 'space-between';
  btn.style.alignItems = 'center';
  btn.style.padding = '10px 12px';
  btn.style.margin = '4px 0';
  btn.style.backgroundColor = 'rgba(255,255,255,0.03)';
  btn.style.border = '1px solid rgba(255,255,255,0.1)';
  btn.style.borderRadius = '6px';
  btn.style.cursor = 'pointer';
  btn.style.color = '#dcdcdc';
  btn.style.transition = 'all 0.2s ease';
  
  btn.innerHTML = '<span>📍 ' + escapeHtml(locName) + '</span>' +
                  '<span style="color:#4a90e2; font-weight:bold; font-size:1.1em; opacity:0.8;">➔</span>';

  // 模擬 CSS Hover 效果
  btn.addEventListener('mouseenter', function() {
    btn.style.backgroundColor = 'rgba(74, 144, 226, 0.15)';
    btn.style.borderColor = 'rgba(74, 144, 226, 0.5)';
    btn.style.color = '#ffffff';
  });
  btn.addEventListener('mouseleave', function() {
    btn.style.backgroundColor = 'rgba(255,255,255,0.03)';
    btn.style.borderColor = 'rgba(255,255,255,0.1)';
    btn.style.color = '#dcdcdc';
  });
  
  btn.addEventListener('click', function() {
    if (typeof requestTravelTo === 'function') requestTravelTo(locName); 
  });
  
  return btn;
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
    
    clone.querySelector('.profile-safezone-name').textContent = zone.name;
    
    // 【修改】：直接選取模板裡的按鈕並綁定事件
    var travelBtn = clone.querySelector('.safezone-travel-btn');
    if (travelBtn) {
      travelBtn.onclick = function() {
        if (typeof requestTravelTo === 'function') requestTravelTo(zone.name);
      };
    }

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

function renderVehiclePanel() {
  if (!dom.vehicleList) return;
  dom.vehicleList.innerHTML = '';
  
  // 【防呆】確保 gameState.vehicles 存在，若無則視為空陣列
  var safeVehicles = gameState.vehicles || [];
  var activeVehicles = safeVehicles.filter(function (v) { return v && v.status !== 'lost'; });
  
  // 【修復】把標題數字更新移進來，確保只要重繪清單就會同步更新標題
  if (dom.vehicleSectionToggle) {
    var vSpan = dom.vehicleSectionToggle.querySelector('span');
    if (vSpan) vSpan.textContent = '🚗 載具（' + activeVehicles.length + '）';
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
    
    // 【防呆】確保有名字，避免 undefined 報錯
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
    
    // 【防呆】確保貨艙存在
    var safeCargo = v.cargo || [];
    cargoRow.textContent = '貨艙（' + safeCargo.length + '/' + (v.cargoCapacity || 0) + '）：';
    
    if (safeCargo.length === 0) {
      cargoRow.textContent += '空';
    } else {
      safeCargo.forEach(function (it, index) {
        if (!it) return;
        var tag = document.createElement('span');
        tag.textContent = (it.name || '未知物') + ' x' + (it.quantity || 1);
        
        // 【階段3新增】轉移模式視覺與點擊事件
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

var expandedItemLocations = {}; // 記錄每個地點分類目前是否展開

function renderItemsAccordion() {
  if (!dom.itemsAccordion) return;
  dom.itemsAccordion.innerHTML = '';

  var locations = [];
  
  // 【防呆】確保背包陣列存在
  var safeInventory = gameState.inventory || [];
  locations.push({
    key: '__backpack__',
    label: '隨身背包',
    items: safeInventory,
    isBackpack: true
  });
  
  // 【防呆】確保暫存點陣列存在
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
    
    header.innerHTML =
      '<span class="location-name">' + escapeHtml(loc.label) + '</span>' +
      loadTagHtml +
      '<span class="location-count">' + itemsCount + '項</span>' +
      '<span class="item-location-arrow">▾</span>';

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

        // 【階段3與4整合】轉移模式與使用模式的分流
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
          // 【階段4新增】非轉移模式下，且物品在隨身背包，點擊彈出使用選單
          tag.style.cursor = 'pointer';
          // 微微改變背景色提示可點擊
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
  
  // 建立對象清單
  select.appendChild(new Option('自己 (' + (gameState.charSetup.name || '主角') + ')', 'player'));
  
  gameState.companions.forEach(function(npc) {
    select.appendChild(new Option('隊員：' + npc, 'npc_' + npc));
  });
  
  if (gameState.companions.length > 0) {
    select.appendChild(new Option('全體分配 (所有人)', 'all'));
  }
  
  modal.classList.remove('hidden');
}

/* STREAMING_CHUNK:Cleaned Travel Confirmation Logic... */
function openTravelConfirmModal(targetLocation, dist, costType, costValue, timeCost, canTravel, errorMsg, activeVehicle) {
  var modal = document.getElementById('travel-modal');
  var targetNameEl = document.getElementById('travel-target-name');
  var infoDiv = document.getElementById('travel-cost-info');
  var confirmBtn = document.getElementById('travel-confirm-btn');
  var cancelBtn = document.getElementById('travel-cancel-btn');

  // 防呆：確保 HTML 有載入
  if (!modal) return;

  // 1. 綁定取消按鈕 (防重複綁定，使用覆蓋 onclick 方式)
  cancelBtn.onclick = function() {
    modal.classList.add('hidden');
  };

  // 2. 注入資料
  targetNameEl.textContent = '目的地：' + targetLocation;

  var modeStr = costType === 'fuel' ? '<span style="color:#8fbc8f">🚗 載具駕駛</span>' : '<span style="color:#d4a017">🚶 徒步跋涉</span>';
  var html = '📍 預估距離：<span style="color:#fff">' + dist + ' 公里</span><br>';
  html += '⏱ 預估時間：<span style="color:#fff">' + Math.floor(timeCost/60) + ' 小時 ' + (timeCost%60) + ' 分鐘</span><br>';
  html += '移動方式：' + modeStr + '<br><hr style="border-color: var(--border-color); margin:8px 0;">';

  if (costType === 'fuel') {
    html += '⛽ 消耗燃油：<span style="color:#fff">' + costValue + ' 單位</span><br>';
    html += '🔧 消耗耐久：<span style="color:#fff">' + ((dist / 10) * 2).toFixed(1) + '</span>';
  } else {
    html += '⚡ 消耗體力：<span style="color:#fff">' + costValue + ' 點</span>';
  }

  // 3. 處理按鈕狀態與點擊事件
  if (!canTravel) {
    html += '<div style="color: #e57373; margin-top: 10px; font-weight:bold;">⚠️ ' + errorMsg + '</div>';
    confirmBtn.style.opacity = '0.5';
    confirmBtn.style.pointerEvents = 'none';
    confirmBtn.onclick = null;
  } else {
    confirmBtn.style.opacity = '1';
    confirmBtn.style.pointerEvents = 'auto';
    confirmBtn.onclick = function() {
      modal.classList.add('hidden');
      if (typeof executeTravel === 'function') {
        executeTravel(targetLocation, dist, costType, costValue, timeCost, activeVehicle);
      }
    };
  }

  infoDiv.innerHTML = html;
  modal.classList.remove('hidden');
}
