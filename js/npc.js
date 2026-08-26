/* ============================================
   末日黎明：喪屍浩劫 — 角色與 NPC 模組 (npc.js)
   職責：管理 NPC 的生成、死亡、自動進食微行動，以及渲染主角和 NPC 的屬性面板
   ============================================ */
'use strict';

// ==========================================
// 第一部分：NPC 狀態與邏輯運算
// ==========================================

function createNpcStateSkeleton(npcName) {
  if (!gameState.npcStates) gameState.npcStates = {};
  if (!gameState.npcStates[npcName]) {
    gameState.npcStates[npcName] = {
      hunger: 100, stamina: 100, injuryStatus: 'none', inventory: [], awakeningLevel: 0, lastLeftTurn: -1,
      proficiency: { combat: 0, shooting: 0, agility: 0, scouting: 0, medical: 0, negotiation: 0, searching: 0, mechanics: 0 }
    };
  }
}

function correctNpcStateOnRejoin(npcName, currentTurn) {
  var npc = gameState.npcStates[npcName];
  if (!npc) return;
  if (npc.lastLeftTurn !== -1 && (currentTurn - npc.lastLeftTurn >= 15)) {
    // 離隊超過 15 回合，進行狀態校正（模擬 NPC 自己在外求生）
    npc.hunger = Math.max(50, npc.hunger);
    npc.stamina = Math.max(50, npc.stamina);
    npc.injuryStatus = 'none';
    console.log('[NPC系統] ' + npcName + ' 離隊過久，狀態已校正。');
  }
  npc.lastLeftTurn = -1;
}

function clearNpcStateOnDeath(npcName) {
  if (gameState.npcStates && gameState.npcStates[npcName]) {
    delete gameState.npcStates[npcName];
    console.log('[NPC系統] ' + npcName + ' 已死亡，狀態資料清除。');
  }
}

function processNpcMicroActions() {
  if (!gameState.npcStates) return;
  var activeNpcs = gameState.companions || [];
  for (var i = 0; i < activeNpcs.length; i++) {
    var npcName = activeNpcs[i];
    var npc = gameState.npcStates[npcName];
    if (!npc) continue;

    // 當飢餓度低於 40，且背包內有食物時，自動消耗一份
    if (npc.hunger < 40 && npc.inventory && npc.inventory.length > 0) {
      for (var j = 0; j < npc.inventory.length; j++) {
        var item = npc.inventory[j];
        if (typeof isLikelyFood === 'function' && isLikelyFood(item.name) && !isWaterOnly(item.name)) {
          var recovery = typeof getFoodRecoveryAmount === 'function' ? getFoodRecoveryAmount(item.name) : 20;
          if (typeof applyInventoryChangesTo === 'function') {
            applyInventoryChangesTo(npc.inventory, [{ name: item.name, quantity: 1, action: 'remove' }]);
          }
          npc.hunger = Math.min(100, npc.hunger + recovery);
          console.log('[NPC微行動] ' + npcName + ' 自動消耗了 1 份 ' + item.name);
          break; // 每回合只吃一個
        }
      }
    }
  }
}

// ==========================================
// 第二部分：主角 (Player) 面板渲染
// ==========================================

function renderCharProfile() {
  var c = gameState.charSetup || {};
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
  var existing = document.getElementById('profile-proficiency-section');
  if (existing) existing.remove();

  var container = document.createElement('div');
  container.id = 'profile-proficiency-section';
  var html = '<div class="char-profile-section-title">體格熟練度</div><div class="profile-awakening-card" style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">';
  
  if (gameState.skillProficiency) {
    for (var k in PROFICIENCY_LABELS) {
      var exp = gameState.skillProficiency[k] || 0;
      var lv = typeof getProficiencyLevel === 'function' ? getProficiencyLevel(exp) : 1;
      html += '<div style="font-size: 0.9em; color: ' + (lv > 1 ? '#4a90e2' : '#888') + ';">' + PROFICIENCY_LABELS[k] + ' Lv.' + lv + '</div>';
    }
  }
  html += '</div>';
  container.innerHTML = html;
  
  if (dom.profileSafezoneList) {
    dom.charProfileBody.insertBefore(container, dom.profileSafezoneList.previousElementSibling);
  }
}

function renderProfileInjury() {
  if (!dom.profileInjurySection) return;
  if (gameState.injuryStatus === 'none' || !gameState.injuryStatus) {
    dom.profileInjurySection.classList.add('hidden'); return;
  }
  dom.profileInjurySection.classList.remove('hidden');
  var levelMap = { minor: '輕度受傷', severe: '重度受傷' };
  if (dom.profileInjuryLevel) {
    dom.profileInjuryLevel.textContent = levelMap[gameState.injuryStatus] || gameState.injuryStatus;
    dom.profileInjuryLevel.className = 'profile-injury-level ' + gameState.injuryStatus;
  }
  if (dom.profileInjuryDetail) {
    dom.profileInjuryDetail.textContent = gameState.injuryDetail || '傷勢細節未知';
  }
}

function renderProfileExploredLocations() {
  var container = document.getElementById('profile-explored-list');
  if (!container) return;
  container.innerHTML = '';
  
  if (!gameState.exploredLocations || gameState.exploredLocations.length === 0) {
    var emptyEl = document.createElement('div'); emptyEl.className = 'profile-subentity-empty'; emptyEl.textContent = '尚未探索任何具體地點';
    container.appendChild(emptyEl); return;
  }
  
  gameState.exploredLocations.forEach(function(loc) {
    var div = document.createElement('div');
    div.className = 'char-profile-item';
    div.style.cursor = 'pointer'; div.style.color = '#4a90e2'; div.style.textDecoration = 'underline'; div.style.marginBottom = '6px';
    div.innerHTML = '<span>📍 ' + escapeHtml(loc) + '</span><span style="font-size:0.9em; color:#888; margin-left:8px;">(點擊前往)</span>';
    div.addEventListener('click', function() {
      if (typeof requestTravelTo === 'function') requestTravelTo(loc); 
    });
    container.appendChild(div);
  });
}

function renderProfileAwakening() {
  if (!dom.profileAwakeningSection) return;
  if (gameState.awakeningLevel <= 0) {
    dom.profileAwakeningSection.classList.add('hidden'); return;
  }
  dom.profileAwakeningSection.classList.remove('hidden');
  if (dom.profileAwakeningLevel) dom.profileAwakeningLevel.textContent = 'Lv.' + gameState.awakeningLevel;
  if (dom.profileAwakeningAbility) dom.profileAwakeningAbility.textContent = gameState.awakeningAbility || '尚未顯現';
  if (dom.profileAwakeningExp) dom.profileAwakeningExp.textContent = gameState.abilityExp + ' / ' + (typeof getAbilityExpNeeded === 'function' ? getAbilityExpNeeded(gameState.awakeningLevel) : '?');
}

function renderProfileSafezones() {
  if (!dom.profileSafezoneList || typeof WorldMemory === 'undefined') return;
  var worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
  var zones = worldMemory.safeZones || [];
  dom.profileSafezoneList.innerHTML = '';
  if (zones.length === 0) {
    var emptyEl = document.createElement('div'); emptyEl.className = 'profile-subentity-empty'; emptyEl.textContent = '尚未建立或發現任何安全區';
    dom.profileSafezoneList.appendChild(emptyEl); return;
  }
  zones.forEach(function (zone) {
    var card = document.createElement('div'); card.className = 'profile-safezone-card';
    var facilitiesText = (zone.facilities && zone.facilities.length) ? zone.facilities.join('、') : '暫無已知設施';
    var relNote = zone.factionRelations && (zone.factionRelations.note || zone.factionRelations.backgroundNote);
    card.innerHTML =
      '<div class="profile-safezone-header"><span class="profile-safezone-name">' + escapeHtml(zone.name) + '</span><span class="profile-safezone-pop">人口 ' + (zone.population || 0) + '</span></div>' +
      '<div class="profile-safezone-facilities">📍 ' + escapeHtml(zone.location || '位置未知') + ' ・ 設施：' + escapeHtml(facilitiesText) + '</div>' +
      (relNote ? '<div class="profile-safezone-facilities">' + escapeHtml(relNote) + '</div>' : '');
    dom.profileSafezoneList.appendChild(card);
  });
}

function renderProfileFactions() {
  if (!dom.profileFactionList || typeof WorldMemory === 'undefined') return;
  var worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
  dom.profileFactionList.innerHTML = '';
  var factionNames = Object.keys(gameState.factionTrust || {});
  if (factionNames.length === 0) {
    var emptyEl = document.createElement('div'); emptyEl.className = 'profile-subentity-empty'; emptyEl.textContent = '尚未與任何勢力建立聯繫';
    dom.profileFactionList.appendChild(emptyEl); return;
  }
  var recentHistory = (worldMemory.factionHistory || []).slice(-15);
  factionNames.forEach(function (faction) {
    var trust = gameState.factionTrust[faction] || 0;
    var trustClass = trust > 0 ? 'trust-positive' : (trust < 0 ? 'trust-negative' : 'trust-neutral');
    var relatedEvents = recentHistory.filter(function (f) { return f.faction === faction; }).slice(-3);
    var eventsHtml = relatedEvents.map(function (e) { return '<div class="profile-faction-history">第' + e.turnRecorded + '回合： ' + escapeHtml(e.eventText) + '</div>'; }).join('');
    var card = document.createElement('div'); card.className = 'profile-faction-card';
    card.innerHTML = '<div class="profile-faction-header"><span class="profile-faction-name">' + escapeHtml(faction) + '</span><span class="profile-faction-trust ' + trustClass + '">信任度 ' + trust + '</span></div>' + eventsHtml;
    dom.profileFactionList.appendChild(card);
  });
}

// ==========================================
// 第三部分：NPC 隊友面板渲染
// ==========================================

function renderNpcPanel() {
  if (!dom.npcList || typeof WorldMemory === 'undefined') return;
  var worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
  
  var namesSet = {};
  if (worldMemory.relationships) { for (var k in worldMemory.relationships) { namesSet[k] = true; } }
  if (gameState.npcStates) { for (var n in gameState.npcStates) { namesSet[n] = true; } }
  var names = Object.keys(namesSet);
  
  if (dom.npcSectionToggle) {
    var npcSpan = dom.npcSectionToggle.querySelector('span');
    if (npcSpan) npcSpan.textContent = '📇 人物檔案（' + names.length + '）';
  }

  dom.npcList.innerHTML = '';

  if (names.length === 0) {
    var emptyEl = document.createElement('div'); emptyEl.className = 'npc-empty'; emptyEl.textContent = '尚未與任何人物建立深入接觸';
    dom.npcList.appendChild(emptyEl); return;
  }

  names.forEach(function (name) {
    var rel = worldMemory.relationships[name] || { stage: 'unknown', trust: 0, closeness: 0, romanticTension: 0, background: [], milestones: [], frozen: false, npcStatus: 'alive' };
    var card = document.createElement('div'); card.className = 'npc-card' + (rel.frozen ? ' npc-frozen' : '');
    var header = document.createElement('button'); header.type = 'button'; header.className = 'npc-card-header';
    
    var stageLabel = WorldMemory.STAGE_LABELS[rel.stage] || (rel.stage === 'unknown' ? '無關係紀錄' : rel.stage);
    var statusLabel = rel.frozen ? '（' + (WorldMemory.NPC_STATUS_LABELS[rel.npcStatus] || rel.npcStatus) + '）' : '';
    
    // =========================================================
    // ✏️ 新增：包含改名與合併按鈕的標頭邏輯
    // =========================================================
    var nameSpan = document.createElement('span');
    nameSpan.className = 'npc-name';
    nameSpan.textContent = name + statusLabel;
    
    var editBtn = document.createElement('span');
    editBtn.innerHTML = ' ✏️';
    editBtn.style.cursor = 'pointer';
    editBtn.style.fontSize = '12px';
    editBtn.style.marginLeft = '6px';
    editBtn.title = "修改姓名或合併檔案";
    
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // 防止點擊按鈕時不小心收合面板
      var newName = prompt('請輸入【' + name + '】的真實姓名：\n(若輸入已有名字，系統將自動合併兩者的紀錄與背包)', name);
      if (newName && newName.trim() !== '' && newName !== name) {
        if (typeof renameOrMergeNpc === 'function') {
          renameOrMergeNpc(name, newName.trim());
          renderNpcPanel(); // 立即重新渲染畫面
          if (typeof saveGame === 'function') saveGame(); // 觸發自動存檔
        } else {
          alert('找不到改名邏輯，請確認已將 renameOrMergeNpc 函數貼到 npc.js 最下方！');
        }
      }
    });

    nameSpan.appendChild(editBtn);

    header.innerHTML = '';
    header.appendChild(nameSpan);
    header.innerHTML += '<span class="npc-stage-tag stage-' + rel.stage + '">' + escapeHtml(stageLabel) + '</span><span class="npc-card-arrow">▾</span>';
    // =========================================================

    var body = document.createElement('div'); body.className = 'npc-card-body hidden';

    var statsHtml = '<div class="npc-stats-row">' +
      (rel.gender ? '<span class="npc-stat-item">性別：' + escapeHtml(rel.gender) + '</span>' : '') +
      '<span class="npc-stat-item">信任 ' + rel.trust + '</span><span class="npc-stat-item">親密 ' + rel.closeness + '</span><span class="npc-stat-item">浪漫張力 ' + rel.romanticTension + '</span></div>';

    var backgroundHtml = (rel.background && rel.background.length > 0)
      ? '<div class="npc-background"><div class="npc-background-title">背景經歷</div><div class="npc-background-list">' + rel.background.map(function (b) { return '<p class="npc-background-entry"><span class="npc-background-day">第' + b.day + '天</span>' + escapeHtml(b.text) + '</p>'; }).join('') + '</div></div>'
      : '<div class="npc-background"><p class="npc-background-empty">尚無已知背景資訊</p></div>';

    var milestonesHtml = (rel.milestones && rel.milestones.length > 0)
      ? '<div class="npc-milestones"><div class="npc-background-title">關係事件</div>' + rel.milestones.slice(-8).map(function (m) { return '<p class="npc-background-entry"><span class="npc-background-day">第' + m.day + '天</span> ' + escapeHtml(m.text) + '</p>'; }).join('') + '</div>'
      : '';

    var npcState = (gameState.npcStates && gameState.npcStates[name]) ? gameState.npcStates[name] : null;
    var survivalStatsHtml = '';
    if (npcState) {
      var injuryText = npcState.injuryStatus === 'severe' ? '重傷' : (npcState.injuryStatus === 'minor' ? '輕傷' : '健康');
      var awkText = (npcState.awakeningLevel && npcState.awakeningLevel > 0) ? 'Lv.' + npcState.awakeningLevel : '未覺醒';
      survivalStatsHtml = '<div class="npc-stats-row" style="margin-top: 5px; color: #a0c0ff; display: flex; flex-wrap: wrap; gap: 8px;">' +
        '<span class="npc-stat-item">體力 ' + Math.floor(npcState.stamina) + '/100</span><span class="npc-stat-item">飽食 ' + Math.floor(npcState.hunger) + '/100</span>' +
        '<span class="npc-stat-item">狀態：' + injuryText + '</span><span class="npc-stat-item" style="color: #f5a623;">異能：' + awkText + '</span></div>';
    }

    var profHtml = '<div class="npc-background-title" style="margin-top:10px;">體格熟練度</div><div style="display:grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px;">';
    for (var pk in PROFICIENCY_LABELS) {
      var pexp = (npcState && npcState.proficiency && npcState.proficiency[pk]) ? npcState.proficiency[pk] : 0;
      var plv = typeof getProficiencyLevel === 'function' ? getProficiencyLevel(pexp) : 1;
      profHtml += '<div style="font-size: 0.85em; color: ' + (plv > 1 ? '#a0c0ff' : '#666') + ';">' + PROFICIENCY_LABELS[pk] + ' Lv.' + plv + '</div>';
    }
    profHtml += '</div>';

    body.innerHTML = statsHtml + survivalStatsHtml + profHtml + backgroundHtml + milestonesHtml;

    // NPC 獨立背包
    var invDiv = document.createElement('div'); invDiv.className = 'npc-background'; 
    var invTitle = document.createElement('div'); invTitle.className = 'npc-background-title'; invTitle.textContent = '背包物品';
    invDiv.appendChild(invTitle);

    if (npcState && npcState.inventory && npcState.inventory.length > 0) {
      npcState.inventory.forEach(function(it, index) {
        var tag = document.createElement('span'); tag.textContent = it.name + ' x' + it.quantity;
        if (typeof transferState !== 'undefined' && transferState.isTransferMode) {
          tag.style.cursor = 'pointer'; tag.style.border = '1px dashed #4a90e2'; tag.style.padding = '1px 4px';
          tag.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof openTransferModal === 'function') openTransferModal('npc', name, it.name, it.quantity);
          });
        }
        invDiv.appendChild(tag);
        if (index < npcState.inventory.length - 1) invDiv.appendChild(document.createTextNode('、'));
      });
    } else {
      var emptyP = document.createElement('p'); emptyP.className = 'npc-background-empty'; emptyP.textContent = '空';
      invDiv.appendChild(emptyP);
    }
    body.appendChild(invDiv);

    header.addEventListener('click', function () { body.classList.toggle('hidden'); header.classList.toggle('expanded'); });
    card.appendChild(header); card.appendChild(body); dom.npcList.appendChild(card);
  });
}

// ==========================================
// NPC 改名與資料合併引擎
// ==========================================
function renameOrMergeNpc(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return;

  var wm = typeof WorldMemory !== 'undefined' ? WorldMemory.ensureShape(gameState.worldMemory) : gameState.worldMemory;

  // 1. 轉移/合併 npcStates (體力、飽食、背包、熟練度、異能等)
  if (gameState.npcStates && gameState.npcStates[oldName]) {
    if (!gameState.npcStates[newName]) {
      gameState.npcStates[newName] = gameState.npcStates[oldName];
    } else {
      // 若新名字已存在，將舊背包物品塞進新背包
      var oldInv = gameState.npcStates[oldName].inventory || [];
      var newInv = gameState.npcStates[newName].inventory || [];
      gameState.npcStates[newName].inventory = newInv.concat(oldInv);
    }
    delete gameState.npcStates[oldName];
  }

  // 2. 轉移/合併 WorldMemory relationships (信任度、背景故事、關係階段)
  if (wm.relationships && wm.relationships[oldName]) {
    if (!wm.relationships[newName]) {
      wm.relationships[newName] = wm.relationships[oldName];
    } else {
      // 若新名字已存在，合併背景與里程碑
      var oldBg = wm.relationships[oldName].background || [];
      var newBg = wm.relationships[newName].background || [];
      wm.relationships[newName].background = newBg.concat(oldBg);

      var oldMs = wm.relationships[oldName].milestones || [];
      var newMs = wm.relationships[newName].milestones || [];
      wm.relationships[newName].milestones = newMs.concat(oldMs);

      // 信任度取兩者之間較高的
      wm.relationships[newName].trust = Math.max(wm.relationships[newName].trust || 0, wm.relationships[oldName].trust || 0);
    }
    delete wm.relationships[oldName];
  }

  // 3. 更新隊伍清單 companions (如果他剛好在隊伍中)
  if (gameState.companions) {
    var idx = gameState.companions.indexOf(oldName);
    if (idx !== -1) {
      gameState.companions.splice(idx, 1); // 移除舊名
      if (gameState.companions.indexOf(newName) === -1) {
        gameState.companions.push(newName); // 加入新名
      }
    }
  }

  console.log('[NPC系統] 成功將 ' + oldName + ' 改名/合併為 ' + newName);
}
