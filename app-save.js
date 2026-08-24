'use strict';

function handleExportSave() {
  var saveData = { version: 1, exportedAt: new Date().toISOString(), gameState: gameState };
  var blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'doomsday-save-day' + gameState.time.day + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toggleSideMenu(false);
}

function getNamedSaves() {
  try {
    return JSON.parse(localStorage.getItem(NAMED_SAVES_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function handleOpenNamedSave() {
  toggleSideMenu(false);
  var name = prompt('請輸入此存檔的名稱（例如：維爾赫姆市-覺醒前）：');
  if (!name || !name.trim()) return;
  var saves = getNamedSaves();
  saves[name.trim()] = { savedAt: new Date().toISOString(), gameState: gameState };
  localStorage.setItem(NAMED_SAVES_KEY, JSON.stringify(saves));
  alert('已儲存命名存檔：' + name.trim());
}

function handleLoadNamedSave(name) {
  var saves = getNamedSaves();
  var entry = saves[name];
  if (!entry) return;
  restoreState(entry.gameState);
  var key = localStorage.getItem(APIKEY_KEY_PREFIX + gameState.provider);
  if (gameState.isTestMode || key) {
    gameState.apiKey = key || '';
    showGameScreen();
    rebuildNarrativeFromHistory();
    renderOptions(gameState.lastOptions);
    renderAll();
    saveStateToLocal();
    dom.namedSaveModal.classList.add('hidden');
  } else {
    alert('請先在開局畫面輸入 API 金鑰');
  }
}


function handleDeleteNamedSave(name) {
  if (!confirm('刪除命名存檔「' + name + '」？')) return;
  var saves = getNamedSaves();
  delete saves[name];
  localStorage.setItem(NAMED_SAVES_KEY, JSON.stringify(saves));
  renderLocalSaveList();
}

function handleImportFile(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (event) {
    try {
      var saveData = JSON.parse(event.target.result);
      restoreState(saveData.gameState);
      var key = dom.apiKeyInput.value.trim() || localStorage.getItem(APIKEY_KEY_PREFIX + gameState.provider);
      if (gameState.isTestMode || key) {
        gameState.apiKey = key || '';
        if (key) localStorage.setItem(APIKEY_KEY_PREFIX + gameState.provider, key);
        showGameScreen();
        rebuildNarrativeFromHistory();
        renderOptions(gameState.lastOptions);
        renderAll();
        saveStateToLocal();
      } else {
        alert('請先在開局畫面輸入 API 金鑰，再匯入存檔');
      }
    } catch (err) {
      alert('存檔檔案格式錯誤，無法匯入');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/* ---------- 存檔管理彈窗：本機/Notion雙標籤 ---------- */

function handleOpenSaveManager() {
  toggleSideMenu(false);
  currentSaveTab = 'local';
  updateSaveTabUI();
  renderLocalSaveList();
  dom.namedSaveModal.classList.remove('hidden');
}

function switchSaveTab(tab) {
  currentSaveTab = tab;
  updateSaveTabUI();
  if (tab === 'local') {
    renderLocalSaveList();
  } else {
    renderNotionSaveList();
  }
}

function updateSaveTabUI() {
  dom.saveTabLocal.classList.toggle('active', currentSaveTab === 'local');
  dom.saveTabNotion.classList.toggle('active', currentSaveTab === 'notion');
}

function renderLocalSaveList() {
  var saves = getNamedSaves();
  var names = Object.keys(saves);
  dom.namedSaveList.innerHTML = '';
  if (names.length === 0) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'named-save-empty';
    emptyEl.textContent = '目前沒有任何命名存檔';
    dom.namedSaveList.appendChild(emptyEl);
    return;
  }
  names.forEach(function (name) {
    var row = document.createElement('div');
    row.className = 'named-save-row';
    var info = document.createElement('div');
    info.className = 'named-save-info';
    info.innerHTML = '<span class="named-save-name">' + escapeHtml(name) + '</span><span class="named-save-date">' + saves[name].savedAt.slice(0, 16).replace('T', ' ') + '</span>';
    var loadBtn = document.createElement('button');
    loadBtn.className = 'btn-secondary named-save-load-btn';
    loadBtn.type = 'button';
    loadBtn.textContent = '讀取';
    loadBtn.addEventListener('click', function () { handleLoadNamedSave(name); });
    var delBtn = document.createElement('button');
    delBtn.className = 'icon-btn';
    delBtn.type = 'button';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', function () { handleDeleteNamedSave(name); });
    row.appendChild(info);
    row.appendChild(loadBtn);
    row.appendChild(delBtn);
    dom.namedSaveList.appendChild(row);
  });
}

function renderNotionSaveList() {
  dom.namedSaveList.innerHTML = '';
  if (!CONFIG.NOTION_ENABLED || !CONFIG.NOTION_PROXY_URL || !CONFIG.NOTION_DATABASE_ID) {
    var noConfigEl = document.createElement('div');
    noConfigEl.className = 'named-save-empty';
    noConfigEl.textContent = '尚未設定 Notion 雲端同步，請先於選單中儲存轉發網址與 Database ID';
    dom.namedSaveList.appendChild(noConfigEl);
    return;
  }

  var loadingEl = document.createElement('div');
  loadingEl.className = 'named-save-empty';
  loadingEl.textContent = '讀取中…';
  dom.namedSaveList.appendChild(loadingEl);

  var queryUrl = CONFIG.NOTION_PROXY_URL.replace(/\/$/, '') + '/query';

  fetch(queryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database_id: CONFIG.NOTION_DATABASE_ID, page_size: 50 })
  }).then(function (res) {
    return res.json().then(function (data) {
      return { ok: res.ok, data: data };
    });
  }).then(function (result) {
    if (currentSaveTab !== 'notion') return;
    dom.namedSaveList.innerHTML = '';
    if (!result.ok || !result.data.results) {
      var errEl = document.createElement('div');
      errEl.className = 'named-save-empty';
      errEl.textContent = '讀取失敗：' + JSON.stringify(result.data).slice(0, 200);
      dom.namedSaveList.appendChild(errEl);
      return;
    }
    notionSavesCache = result.data.results;
    if (notionSavesCache.length === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'named-save-empty';
      emptyEl.textContent = 'Notion資料庫中尚無同步記錄';
      dom.namedSaveList.appendChild(emptyEl);
      return;
    }
    notionSavesCache.forEach(function (page, idx) {
      var props = page.properties || {};
      var titleArr = props['存檔名稱'] && props['存檔名稱'].title;
      var titleText = (titleArr && titleArr[0] && titleArr[0].plain_text) || '未命名同步記錄';
      var dateText = (props['更新時間'] && props['更新時間'].date && props['更新時間'].date.start) || '';
      var dayNum = (props['遊戲天數'] && props['遊戲天數'].number) || '?';
      var locArr = props['當前地點'] && props['當前地點'].rich_text;
      var locText = (locArr && locArr.map(function (t) { return t.plain_text; }).join('')) || '';

      var row = document.createElement('div');
      row.className = 'named-save-row';
      var info = document.createElement('div');
      info.className = 'named-save-info';
      info.innerHTML = '<span class="named-save-name">' + escapeHtml(titleText) + '（第' + dayNum + '天 ' + escapeHtml(locText) + '）</span><span class="named-save-date">' + escapeHtml(dateText.slice(0, 16).replace('T', ' ')) + '</span>';
      var loadBtn = document.createElement('button');
      loadBtn.className = 'btn-secondary named-save-load-btn';
      loadBtn.type = 'button';
      loadBtn.textContent = '讀取';
      loadBtn.addEventListener('click', function () { handleLoadNotionSave(idx); });
      row.appendChild(info);
      row.appendChild(loadBtn);
      dom.namedSaveList.appendChild(row);
    });
  }).catch(function (e) {
    if (currentSaveTab !== 'notion') return;
    dom.namedSaveList.innerHTML = '';
    var errEl = document.createElement('div');
    errEl.className = 'named-save-empty';
    errEl.textContent = '讀取請求失敗：' + e.message;
    dom.namedSaveList.appendChild(errEl);
  });
}

function handleLoadNotionSave(idx) {
  var page = notionSavesCache[idx];
  if (!page) return;
  var props = page.properties || {};
  var jsonArr = props['存檔JSON'] && props['存檔JSON'].rich_text;
  var jsonText = jsonArr && jsonArr.map(function (t) { return t.plain_text; }).join('');
  if (!jsonText) {
    alert('這筆記錄沒有可讀取的存檔內容');
    return;
  }
  try {
    var parsedState = JSON.parse(jsonText);
    if (!confirm('讀取這筆Notion存檔將覆蓋目前進度，確定繼續嗎？')) return;
    restoreState(parsedState);
    var key = localStorage.getItem(APIKEY_KEY_PREFIX + gameState.provider);
    if (gameState.isTestMode || key) {
      gameState.apiKey = key || '';
      showGameScreen();
      rebuildNarrativeFromHistory();
      renderOptions(gameState.lastOptions);
      renderAll();
      saveStateToLocal();
      dom.namedSaveModal.classList.add('hidden');
    } else {
      alert('請先在開局畫面輸入 API 金鑰');
    }
  } catch (e) {
    alert('這筆Notion存檔JSON內容無法解析，可能已損毀。建議改用「匯出/匯入存檔檔案」功能作為完整備份。');
  }
}

function chunkText(text, chunkSize) {
  var chunks = [];
  for (var i = 0; i < text.length; i += chunkSize) {
    chunks.push({ text: { content: text.slice(i, i + chunkSize) } });
  }
  if (chunks.length === 0) chunks.push({ text: { content: '' } });
  return chunks;
}

function safeRichText(str, maxLen) {
  var s = str || '';
  if (s.length > maxLen) s = s.slice(0, maxLen) + '…';
  return [{ text: { content: s } }];
}

function buildNotionSyncBody() {
  var injuryOption = gameState.injuryStatus || 'none';
  var lastNarrative = gameState.recentTurns.length ? gameState.recentTurns[gameState.recentTurns.length - 1].narrative : '';
  var briefSummary = lastNarrative.length > 450 ? lastNarrative.slice(0, 450) + '…' : lastNarrative;
  var fullStateJson = JSON.stringify(gameState);

  return {
    parent: { database_id: CONFIG.NOTION_DATABASE_ID },
    properties: {
      '存檔名稱': { title: [{ text: { content: '同步-第' + gameState.time.day + '天-' + new Date().toLocaleTimeString() } }] },
      '角色姓名': { rich_text: safeRichText(gameState.charSetup.name || '未命名倖存者', 1900) },
      '遊戲天數': { number: gameState.time.day },
      '體力': { number: gameState.stamina },
      '當前地點': { rich_text: safeRichText(gameState.location, 1900) },
      '傷勢': { select: { name: injuryOption } },
      '覺醒等級': { number: gameState.awakeningLevel },
      '危險等級': { select: { name: gameState.dangerLevel } },
      '人性值': { number: gameState.humanity },
      '飢餓值': { number: gameState.hunger },
      '共鳴值': { number: gameState.resonanceValue },
      '背包物品': { rich_text: safeRichText(gameState.inventory.map(function (it) { return it.name + 'x' + it.quantity; }).join('、') || '無', 1900) },
      '隨行隊員': { rich_text: safeRichText(gameState.companions.join('、') || '無', 1900) },
      '前文提要': { rich_text: safeRichText(briefSummary || '無', 1900) },
      '更新時間': { date: { start: new Date().toISOString() } },
      '存檔JSON': { rich_text: chunkText(fullStateJson, NOTION_CHUNK_SIZE) }
    }
  };
}

function syncToNotion(silent) {
  if (!CONFIG.NOTION_ENABLED || !CONFIG.NOTION_PROXY_URL || !CONFIG.NOTION_DATABASE_ID) {
    if (!silent) alert('請先填入並儲存 Notion 轉發網址與 Database ID');
    return;
  }
  if (gameState.isTestMode && silent) return;

  var body = buildNotionSyncBody();

  fetch(CONFIG.NOTION_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(function (res) {
    return res.json().then(function (data) {
      return { ok: res.ok, data: data };
    });
  }).then(function (result) {
    if (!silent) {
      if (result.ok) {
        alert('同步成功！請至 Notion 檢查是否新增存檔記錄。');
      } else {
        alert('同步失敗，錯誤內容：' + JSON.stringify(result.data).slice(0, 300));
      }
    }
    console.log('Notion同步結果:', result);
  }).catch(function (e) {
    console.warn('Notion 同步失敗:', e);
    if (!silent) alert('同步請求失敗：' + e.message);
  });
}

function handleNotionSyncNow() {
  syncToNotion(false);
}

function maybeSyncToNotion() {
  if (gameState.turnCount % NOTION_SYNC_INTERVAL === 0) {
    syncToNotion(true);
  }
}

function saveStateToLocal() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(gameState));
  } catch (e) {}
}

function restoreState(saved) {
  gameState = Object.assign({}, gameState, saved);
  gameState.worldMemory = WorldMemory.ensureShape(gameState.worldMemory);
  if (!gameState.charSetup || gameState.charSetup.background !== undefined) {
    gameState.charSetup = {
      name: (saved.charSetup && saved.charSetup.name) || '',
      gender: (saved.charSetup && saved.charSetup.gender) || '',
      location: (saved.charSetup && saved.charSetup.location) || '',
      occupation: (saved.charSetup && saved.charSetup.occupation) || ''
    };
  }
}

function rebuildNarrativeFromHistory() {
  dom.narrativeContent.innerHTML = '';
  for (var i = 0; i < gameState.recentTurns.length; i++) {
    var t = gameState.recentTurns[i];
    if (t.action && t.action !== '(開局)') {
      var actionEl = document.createElement('div');
      actionEl.className = 'narrative-entry player-action';
      actionEl.textContent = '▸ ' + t.action;
      dom.narrativeContent.appendChild(actionEl);
    }
    var gmEl = document.createElement('div');
    gmEl.className = 'narrative-entry gm-text';
    gmEl.textContent = t.narrative;
    dom.narrativeContent.appendChild(gmEl);
  }
  if (gameState.isDead) {
    dom.deathScreen.classList.remove('hidden');
  }
  scrollToBottom();
}

function handleRestart() {
  toggleSideMenu(false);
  setTimeout(function () {
    if (!confirm('確定要清空所有進度，重新開始嗎？此操作無法復原。')) return;
    localStorage.removeItem(STATE_KEY);
    location.reload();
  }, 200);
}

function handleChangeApiKey() {
  toggleSideMenu(false);
  setTimeout(function () {
    var newKey = prompt('請輸入新的 API 金鑰：', gameState.apiKey);
    if (newKey && newKey.trim()) {
      gameState.apiKey = newKey.trim();
      localStorage.setItem(APIKEY_KEY_PREFIX + gameState.provider, gameState.apiKey);
    }
  }, 200);
}

function handleSaveNotionConfig() {
  var proxyUrl = dom.notionProxyInput.value.trim();
  var dbId = dom.notionDbInput.value.trim();
  localStorage.setItem(NOTION_KEY, JSON.stringify({ proxyUrl: proxyUrl, dbId: dbId }));
  CONFIG.NOTION_ENABLED = !!(proxyUrl && dbId);
  CONFIG.NOTION_PROXY_URL = proxyUrl;
  CONFIG.NOTION_DATABASE_ID = dbId;
  alert('Notion 設定已儲存於本機。');
}
