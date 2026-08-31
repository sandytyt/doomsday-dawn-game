'use strict';

function createNpcStateSkeleton(npcName) {
  if (!gameState.npcStates) gameState.npcStates = {};
  if (!gameState.npcStates[npcName]) {
    
    // 隨機給予 NPC 初始求生物資 (水或簡易食物)
    var initialLoot = [];
    if (Math.random() > 0.3) initialLoot.push({ name: '半瓶礦泉水', quantity: 1 });
    if (Math.random() > 0.5) initialLoot.push({ name: '能量棒', quantity: 1 });

    gameState.npcStates[npcName] = {
      hunger: Math.floor(Math.random() * 40) + 40, // 初始飽食度 40~80 之間，不會一出來就餓死
      stamina: 100,
      injuryStatus: 'none',
      inventory: initialLoot, // 帶有初始物資
      awakeningLevel: 0,
      lastLeftTurn: -1,
      // 加入初始體格 3 (對應問題 5)
      physique: 3, 
      proficiency: {
        combat: 0, shooting: 0, agility: 0, scouting: 0,
        medical: 0, negotiation: 0, searching: 0, mechanics: 0
      }
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
    npc.injuryStatus = 'none'; // 假設傷勢已隨時間緩解
    console.log('[NPC系統] ' + npcName + ' 離隊過久，狀態已校正。');
  }
  npc.lastLeftTurn = -1; // 重置離隊標記
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

    // 1. 自動進食邏輯
    if (npc.hunger < 50 && npc.inventory && npc.inventory.length > 0) {
      for (var j = 0; j < npc.inventory.length; j++) {
        var item = npc.inventory[j];
        if (isLikelyFood(item.name) && !isWaterOnly(item.name)) {
          var foodStats = (typeof getFoodStats === 'function') ? getFoodStats(item.name) : { recovery: 15, stamina: 0 };
          applyInventoryChangesTo(npc.inventory, [{ name: item.name, quantity: 1, action: 'remove' }]);
          
          npc.hunger = Math.min(100, npc.hunger + foodStats.recovery);
          npc.stamina = Math.min(100, npc.stamina + (foodStats.stamina || 0));
          
          // 進食也顯示在日誌中
          if (typeof appendGMText === 'function') {
             appendGMText('[系統] 隨行隊員 ' + npcName + ' 消耗了 ' + item.name + '，恢復了體力與飽食度。');
          }
          break; 
        }
      }
    }

    // 2. 自動搜尋物資/打怪模擬
    if (npc.stamina > 30 && npc.injuryStatus !== 'severe') {
      var actionRoll = Math.random();
      
      if (actionRoll < 0.15) { 
        // 15% 機率撿到物資：建立擴充版搜刮池
        var lootName = '廢鐵';
        var lootRoll = Math.random();
        
        if (lootRoll < 0.10) {
          // 10% 稀有物資
          var rares = ['透明晶核', '醫療包', '抗生素', '精密機械零件', '一箱軍用罐頭'];
          lootName = rares[Math.floor(Math.random() * rares.length)];
        } else if (lootRoll < 0.35) {
          // 25% 實用物資
          var uncommons = ['能量棒', '簡易繃帶', '礦泉水', '手槍子彈', '粗鹽'];
          lootName = uncommons[Math.floor(Math.random() * uncommons.length)];
        } else {
          // 65% 一般廢品
          var commons = ['廢鐵', '空塑膠瓶', '餅幹', '破布'];
          lootName = commons[Math.floor(Math.random() * commons.length)];
        }

        applyInventoryChangesTo(npc.inventory, [{ name: lootName, quantity: 1, action: 'add' }]);
        
        // 觸發 UI 日誌
        if (typeof appendGMText === 'function') {
           appendGMText('[系統] ' + npcName + ' 在附近搜刮，幸運地找到了 ' + lootName + ' x1。');
        }
        
      } else if (actionRoll > 0.9) { 
        // 10% 機率與小型喪屍交戰
        npc.stamina = Math.max(0, npc.stamina - 10);
        if (typeof appendGMText === 'function') {
           appendGMText('[系統] ' + npcName + ' 獨自處理了一隻落單的喪屍，消耗了少許體力。');
        }
      }
    }
  }
}

function renameOrMergeNpc(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return;

  var wm = typeof WorldMemory !== 'undefined' ? WorldMemory.ensureShape(gameState.worldMemory) : gameState.worldMemory;

  // 1. 轉移/合併 npcStates (體力、飽食、背包等)
  if (gameState.npcStates && gameState.npcStates[oldName]) {
    if (!gameState.npcStates[newName]) {
      gameState.npcStates[newName] = gameState.npcStates[oldName];
    } else {
      var oldInv = gameState.npcStates[oldName].inventory || [];
      var newInv = gameState.npcStates[newName].inventory || [];
      gameState.npcStates[newName].inventory = newInv.concat(oldInv);
    }
    delete gameState.npcStates[oldName];
  }

  // 2. 轉移/合併 relationships (信任度、背景故事等)
  if (wm.relationships && wm.relationships[oldName]) {
    if (!wm.relationships[newName]) {
      wm.relationships[newName] = wm.relationships[oldName];
    } else {
      var oldBg = wm.relationships[oldName].background || [];
      var newBg = wm.relationships[newName].background || [];
      wm.relationships[newName].background = newBg.concat(oldBg);

      var oldMs = wm.relationships[oldName].milestones || [];
      var newMs = wm.relationships[newName].milestones || [];
      wm.relationships[newName].milestones = newMs.concat(oldMs);

      wm.relationships[newName].trust = Math.max(wm.relationships[newName].trust || 0, wm.relationships[oldName].trust || 0);
    }
    delete wm.relationships[oldName];
  }

  // 3. 更新隊伍清單 (如果該 NPC 在隊伍中)
  if (gameState.companions) {
    var idx = gameState.companions.indexOf(oldName);
    if (idx !== -1) {
      gameState.companions.splice(idx, 1);
      if (gameState.companions.indexOf(newName) === -1) {
        gameState.companions.push(newName);
      }
    }
  }

  console.log('[NPC系統] 成功將 ' + oldName + ' 改名/合併為 ' + newName);
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
    
    // =========================================================
    // ✏️ 【真·修復】：完美隔離點擊事件的標頭邏輯
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
      e.stopPropagation(); // ⛔ 阻止事件穿透到標題列
      e.preventDefault();
      
      var newName = prompt('請輸入【' + name + '】的真實姓名：\n(若輸入已有名字，系統將自動合併兩者的紀錄與背包)', name);
      if (newName && newName.trim() !== '' && newName !== name) {
        if (typeof renameOrMergeNpc === 'function') {
          renameOrMergeNpc(name, newName.trim());
          if (typeof renderAll === 'function') renderAll(); else renderNpcPanel(); 
          if (typeof saveGame === 'function') saveGame(); 
        } else {
          alert('找不到改名邏輯，請確認已將 renameOrMergeNpc 函數貼到檔案的最下方！');
        }
      }
    });

    nameSpan.appendChild(editBtn);

    header.innerHTML = '';
    header.appendChild(nameSpan); 
    // 【關鍵修復】改用 insertAdjacentHTML，確保按鈕的點擊記憶不會被洗掉
    var safeStageLabel = typeof escapeHtml === 'function' ? escapeHtml(stageLabel) : stageLabel;
    header.insertAdjacentHTML('beforeend', 
      '<span class="npc-stage-tag stage-' + rel.stage + '">' + safeStageLabel + '</span>' +
      '<span class="npc-card-arrow">▾</span>'
    );
    // =========================================================

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


    // 【階段6修改】NPC 狀態顯示（加入覺醒等級）
    var npcState = (gameState.npcStates && gameState.npcStates[name]) ? gameState.npcStates[name] : null;
    var survivalStatsHtml = '';
    if (npcState) {
      var injuryText = npcState.injuryStatus === 'severe' ? '重傷' : (npcState.injuryStatus === 'minor' ? '輕傷' : '健康');
      var awkText = (npcState.awakeningLevel && npcState.awakeningLevel > 0) ? 'Lv.' + npcState.awakeningLevel : '未覺醒';
      
      survivalStatsHtml = '<div class="npc-stats-row" style="margin-top: 5px; color: #a0c0ff; display: flex; flex-wrap: wrap; gap: 8px;">' +
        '<span class="npc-stat-item">體力 ' + Math.floor(npcState.stamina) + '/100</span>' +
        '<span class="npc-stat-item">飽食 ' + Math.floor(npcState.hunger) + '/100</span>' +
        '<span class="npc-stat-item">狀態：' + injuryText + '</span>' +
        '<span class="npc-stat-item" style="color: #f5a623;">異能：' + awkText + '</span>' +
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

    // 這裡修正變數重複宣告的問題，直接沿用上方的 npcState
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

    // 【修復按鈕衝突 Bug】
    header.addEventListener('click', function (e) {
      // 如果滑鼠點擊的目標剛好是「編輯按鈕(✏️)」，就直接略過，不執行展開/收合
      if (e.target === editBtn || editBtn.contains(e.target)) {
        return;
      }
      body.classList.toggle('hidden');
      header.classList.toggle('expanded');
    });

    card.appendChild(header);
    card.appendChild(body);
    dom.npcList.appendChild(card);
  });
}
