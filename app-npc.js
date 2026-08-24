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
