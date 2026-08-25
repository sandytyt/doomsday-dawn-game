'use strict';

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

// 【階段2新增】已探索地點卡片，點擊觸發返回
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
  
  gameState.exploredLocations.forEach(function(loc) {
    var btn = document.createElement('button');
    btn.className = 'btn-secondary';
    btn.style.margin = '4px';
    btn.style.padding = '4px 8px';
    btn.style.fontSize = '0.9em';
    btn.textContent = '前往：' + loc;
    btn.type = 'button';
    btn.addEventListener('click', function() {
      toggleInfoPanel(false); // 關閉側邊面板
      requestNextTurn('我決定前往「' + loc + '」'); // 送出前往行動
    });
    container.appendChild(btn);
  });
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
  if (!dom.profileSafezoneList) return;
  var worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
  var zones = worldMemory.safeZones || [];
  dom.profileSafezoneList.innerHTML = '';
  if (zones.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'profile-subentity-empty';
    emptyEl.textContent = '尚未建立或發現任何安全區';
    dom.profileSafezoneList.appendChild(emptyEl);
    return;
  }
  zones.forEach(function (zone) {
    var card = document.createElement('div');
    card.className = 'profile-safezone-card';
    var facilitiesText = (zone.facilities && zone.facilities.length)
      ? zone.facilities.join('、') : '暫無已知設施';
    var relNote = zone.factionRelations &&
      (zone.factionRelations.note || zone.factionRelations.backgroundNote);
    card.innerHTML =
      '<div class="profile-safezone-header">' +
        '<span class="profile-safezone-name">' + escapeHtml(zone.name) + '</span>' +
        '<span class="profile-safezone-pop">人口 ' + (zone.population || 0) + '</span>' +
      '</div>' +
      '<div class="profile-safezone-facilities">📍 ' + escapeHtml(zone.location || '位置未知') +
      ' ・ 設施：' + escapeHtml(facilitiesText) + '</div>' +
      (relNote ? '<div class="profile-safezone-facilities">' + escapeHtml(relNote) + '</div>' : '');
    dom.profileSafezoneList.appendChild(card);
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

function renderNpcPanel() {
  if (!dom.npcList) return;
  var worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
  
  // 【修復】合併 relationships 與 npcStates 的名單，避免漏掉尚未有關係紀錄的隊員
  var namesSet = {};
  if (worldMemory.relationships) {
    for (var k in worldMemory.relationships) { namesSet[k] = true; }
  }
  if (gameState.npcStates) {
    for (var n in gameState.npcStates) { namesSet[n] = true; }
  }
  var names = Object.keys(namesSet);
  
  // 【修復】在這裡同步更新標題數字
  if (dom.npcSectionToggle) {
    var npcSpan = dom.npcSectionToggle.querySelector('span');
    if (npcSpan) npcSpan.textContent = '📇 人物檔案（' + names.length + '）';
  }

  dom.npcList.innerHTML = '';

  if (names.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'npc-empty';
    emptyEl.textContent = '尚未與任何人物建立深入接觸';
    dom.npcList.appendChild(emptyEl);
    return;
  }

  names.forEach(function (name) {
    // 【修復】若該 NPC 只有 npcStates 沒有 relationships 紀錄，給予預設值防呆
    var rel = worldMemory.relationships[name] || { 
      stage: 'unknown', trust: 0, closeness: 0, romanticTension: 0, 
      background: [], milestones: [], frozen: false, npcStatus: 'alive' 
    };
    
    var card = document.createElement('div');
    card.className = 'npc-card' + (rel.frozen ? ' npc-frozen' : '');

    var header = document.createElement('button');
    header.type = 'button';
    header.className = 'npc-card-header';
    
    var stageLabel = WorldMemory.STAGE_LABELS[rel.stage] || (rel.stage === 'unknown' ? '無關係紀錄' : rel.stage);
    var statusLabel = rel.frozen ? '（' + (WorldMemory.NPC_STATUS_LABELS[rel.npcStatus] || rel.npcStatus) + '）' : '';
    
    header.innerHTML = '<span class="npc-name">' + escapeHtml(name) + statusLabel + '</span>' +
      '<span class="npc-stage-tag stage-' + rel.stage + '">' + escapeHtml(stageLabel) + '</span>' +
      '<span class="npc-card-arrow">▾</span>';

    var body = document.createElement('div');
    body.className = 'npc-card-body hidden';

    var statsHtml = '<div class="npc-stats-row">' +
      (rel.gender ? '<span class="npc-stat-item">性別：' + escapeHtml(rel.gender) + '</span>' : '') +
      '<span class="npc-stat-item">信任 ' + rel.trust + '</span>' +
      '<span class="npc-stat-item">親密 ' + rel.closeness + '</span>' +
      '<span class="npc-stat-item">浪漫張力 ' + rel.romanticTension + '</span>' +
      '</div>';

    var backgroundHtml;
    if (rel.background && rel.background.length > 0) {
      backgroundHtml = '<div class="npc-background"><div class="npc-background-title">背景經歷</div>' +
        '<div class="npc-background-list">' +
        rel.background.map(function (b) {
          return '<p class="npc-background-entry"><span class="npc-background-day">第' + b.day + '天</span>' + escapeHtml(b.text) + '</p>';
        }).join('') +
        '</div></div>';
    } else {
      backgroundHtml = '<div class="npc-background"><p class="npc-background-empty">尚無已知背景資訊</p></div>';
    }

    var milestonesHtml = '';
    if (rel.milestones && rel.milestones.length > 0) {
      milestonesHtml = '<div class="npc-milestones"><div class="npc-background-title">關係事件</div>' +
        rel.milestones.slice(-8).map(function (m) {
          return '<p class="npc-background-entry"><span class="npc-background-day">第' + m.day + '天</span> ' + escapeHtml(m.text) + '</p>';
        }).join('') + '</div>';
    }

    // 【階段4補充】提前實作 NPC 狀態顯示，方便測試
    var npcState = (gameState.npcStates && gameState.npcStates[name]) ? gameState.npcStates[name] : null;
    var survivalStatsHtml = '';
    if (npcState) {
      var injuryText = npcState.injuryStatus === 'severe' ? '重傷' : (npcState.injuryStatus === 'minor' ? '輕傷' : '健康');
      survivalStatsHtml = '<div class="npc-stats-row" style="margin-top: 5px; color: #a0c0ff;">' +
        '<span class="npc-stat-item">體力 ' + npcState.stamina + '/100</span>' +
        '<span class="npc-stat-item">飽食 ' + Math.floor(npcState.hunger) + '/100</span>' +
        '<span class="npc-stat-item">狀態：' + injuryText + '</span>' +
        '</div>';
    }

    var profHtml = '<div class="npc-background-title" style="margin-top:10px;">體格熟練度</div><div style="display:grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px;">';
    for (var pk in PROFICIENCY_LABELS) {
      var pexp = (npcState && npcState.proficiency && npcState.proficiency[pk]) ? npcState.proficiency[pk] : 0;
      var plv = typeof getProficiencyLevel === 'function' ? getProficiencyLevel(pexp) : 1;
      profHtml += '<div style="font-size: 0.85em; color: ' + (plv > 1 ? '#a0c0ff' : '#666') + ';">' + PROFICIENCY_LABELS[pk] + ' Lv.' + plv + '</div>';
    }
    profHtml += '</div>';

    // 更新組合邏輯，把 profHtml 塞進去
    body.innerHTML = statsHtml + survivalStatsHtml + profHtml + backgroundHtml + milestonesHtml;

    // 階段3動態渲染 NPC 獨立背包的邏輯 (保留你剛才在階段3新增的程式碼)
    var invDiv = document.createElement('div');
    invDiv.className = 'npc-background'; 
    var invTitle = document.createElement('div');
    invTitle.className = 'npc-background-title';
    invTitle.textContent = '背包物品';
    invDiv.appendChild(invTitle);

    var npcState = (gameState.npcStates && gameState.npcStates[name]) ? gameState.npcStates[name] : null;
    if (npcState && npcState.inventory && npcState.inventory.length > 0) {
      npcState.inventory.forEach(function(it, index) {
        var tag = document.createElement('span');
        tag.textContent = it.name + ' x' + it.quantity;
        
        if (typeof transferState !== 'undefined' && transferState.isTransferMode) {
          tag.style.cursor = 'pointer';
          tag.style.border = '1px dashed #4a90e2';
          tag.style.padding = '1px 4px';
          tag.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof openTransferModal === 'function') openTransferModal('npc', name, it.name, it.quantity);
          });
        }
        invDiv.appendChild(tag);
        if (index < npcState.inventory.length - 1) invDiv.appendChild(document.createTextNode('、'));
      });
    } else {
      var emptyP = document.createElement('p');
      emptyP.className = 'npc-background-empty';
      emptyP.textContent = '空';
      invDiv.appendChild(emptyP);
    }
    body.appendChild(invDiv);

    header.addEventListener('click', function () {
      body.classList.toggle('hidden');
      header.classList.toggle('expanded');
    });

    card.appendChild(header);
    card.appendChild(body);
    dom.npcList.appendChild(card);
  });
}
