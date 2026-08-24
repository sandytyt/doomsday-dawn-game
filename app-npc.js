'use strict';

function renderCharProfile() {
  var c = gameState.charSetup;
  if (dom.profileName) dom.profileName.textContent = c.name || '未命名';
  if (dom.profileGender) dom.profileGender.textContent = c.gender || '未指定';
  if (dom.profileLocation) dom.profileLocation.textContent = c.location || '未知';
  if (dom.profileOccupation) dom.profileOccupation.textContent = c.occupation || '未知';
  renderProfileSafezones();
  renderProfileFactions();
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
  var names = Object.keys(worldMemory.relationships);
  dom.npcList.innerHTML = '';

  if (names.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'npc-empty';
    emptyEl.textContent = '尚未與任何人物建立深入接觸';
    dom.npcList.appendChild(emptyEl);
    return;
  }

  names.forEach(function (name) {
    var rel = worldMemory.relationships[name];
    var card = document.createElement('div');
    card.className = 'npc-card' + (rel.frozen ? ' npc-frozen' : '');

    var header = document.createElement('button');
    header.type = 'button';
    header.className = 'npc-card-header';
    var stageLabel = WorldMemory.STAGE_LABELS[rel.stage] || rel.stage;
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

    body.innerHTML = statsHtml + backgroundHtml + milestonesHtml;

    header.addEventListener('click', function () {
      body.classList.toggle('hidden');
      header.classList.toggle('expanded');
    });

    card.appendChild(header);
    card.appendChild(body);
    dom.npcList.appendChild(card);
  });
}
