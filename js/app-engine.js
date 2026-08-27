'use strict';

var pendingMilestoneModals = [];

function requestNextTurn(playerAction) {
  if (gameState.isDead) return;
  if (gameState.isTestMode) {
    playNextTestScript(playerAction);
    return;
  }
  if (isWaitingForAI) return;
  isWaitingForAI = true;
  showTyping(true);
  if (playerAction !== '__START__') {
    appendPlayerAction(playerAction, gameState.lastActionRiskLevel);
    gameState.lastPlayerAction = playerAction;
  }
  var contextPayload = buildContextPayload(playerAction);
  callAIProvider(contextPayload).then(function (response) {
    handleAIResponse(response);
    isWaitingForAI = false;
    showTyping(false);
  }).catch(function (err) {
    appendGMText('連線異常： ' + err.message + ' 請檢查API金鑰是否正確，或稍後再試一次。');
    renderOptions([{ id: 'RETRY', label: '重新嘗試', risk_hint: '' }]);
    isWaitingForAI = false;
    showTyping(false);
  });
}

function applyStatusUpdate(update) {
  if (!update) return;
  if (update.time_advance_minutes) advanceTime(update.time_advance_minutes);
  if (typeof update.stamina_change === 'number') {
    gameState.stamina = clamp(gameState.stamina + update.stamina_change, 0, gameState.maxStamina);
  }
  if (typeof update.hunger_change === 'number') {
    gameState.hunger = clamp(gameState.hunger + update.hunger_change, 0, 100);
  }
  if (update.current_location) {
    gameState.location = update.current_location;
    // 【階段2新增】記錄已探索地點（排除「未知地點」且不重複記錄）
    if (update.current_location !== '未知地點' && gameState.exploredLocations.indexOf(update.current_location) === -1) {
      gameState.exploredLocations.push(update.current_location);
    }
  }
  if (update.danger_level) {gameState.dangerLevel = update.danger_level;trackDangerLevel(update.danger_level);
  }
  if (update.weather) gameState.weather = update.weather;
  if (typeof update.humanity_change === 'number') {
    gameState.humanity = clamp(gameState.humanity + update.humanity_change, 0, 100);
  }
  if (typeof update.resonance_change === 'number') {
    gameState.resonanceValue = clamp(gameState.resonanceValue + update.resonance_change, 0, 999);
  }
  if (typeof update.ability_exp_change === 'number' && update.ability_exp_change !== 0) {
    applyAbilityExpChange(update.ability_exp_change);
  }
  if (update.injury_status) {
    // 傷勢降級邏輯 (只允許一階一階降，重傷 -> 輕傷 -> 健康)
    if (gameState.injuryStatus === 'severe' && update.injury_status === 'none') {
      gameState.injuryStatus = 'minor';
    } else {
      gameState.injuryStatus = update.injury_status;
    }

    if (gameState.injuryStatus === 'none') {
      gameState.injuryDetail = '';
    } else if (update.injury_detail) {
      gameState.injuryDetail = update.injury_detail;
    }
  }  
  if (update.inventory_changes && update.inventory_changes.length) { // 修正為小寫 if
    var autoRecovery = applyInventoryChanges(update.inventory_changes);
    if (autoRecovery > 0) {
      gameState.hunger = clamp(gameState.hunger + autoRecovery, 0, 100);
    }
  }

  if (update.companion_changes && update.companion_changes.length) {
    applyCompanionChanges(update.companion_changes);
  }
  
// 【新增/升級】接收 NPC 的獨立狀態變化（含背包與體格）
  if (update.npc_status_updates && Array.isArray(update.npc_status_updates)) {
    update.npc_status_updates.forEach(function(npcUpdate) {
      if (npcUpdate.name && gameState.npcStates && gameState.npcStates[npcUpdate.name]) {
        var npc = gameState.npcStates[npcUpdate.name];
        
        // NPC 的體力與飽食度，與主角一樣正常接受 AI 的增減 (劇情休息、進食皆可恢復)
        if (typeof npcUpdate.stamina_change === 'number') {
          npc.stamina = clamp(npc.stamina + npcUpdate.stamina_change, 0, 100);
        }
        if (typeof npcUpdate.hunger_change === 'number') {
          npc.hunger = clamp(npc.hunger + npcUpdate.hunger_change, 0, 100);
        }
        
        // 傷勢降級邏輯 (NPC 也適用階梯式恢復)
        if (npcUpdate.injury_status) {
           if (npc.injuryStatus === 'severe' && npcUpdate.injury_status === 'none') {
             npc.injuryStatus = 'minor';
           } else {
             npc.injuryStatus = npcUpdate.injury_status;
           }
        }
        if (npc.injuryStatus === 'none') {
          npc.injuryDetail = '';
        } else if (npcUpdate.injury_detail) {
          npc.injuryDetail = npcUpdate.injury_detail;
        }
        
        // 處理 NPC 獨立背包的增減
        if (npcUpdate.inventory_changes && Array.isArray(npcUpdate.inventory_changes)) {
          npc.inventory = npc.inventory || [];
          
          // 1. 改呼叫你寫好的通用函數，同時接住計算出來的飽食恢復量
          var npcAutoHunger = applyInventoryChangesTo(npc.inventory, npcUpdate.inventory_changes);
          
          // 2. 如果 NPC 在劇情中消耗了食物，把飽食度加給該 NPC
          if (npcAutoHunger > 0) {
            npc.hunger = Math.min(100, (npc.hunger || 0) + npcAutoHunger);
          }
        }
        
        // 處理 NPC 的體格成長
        if (npcUpdate.proficiency_triggered && Array.isArray(npcUpdate.proficiency_triggered)) {
          npc.proficiency = npc.proficiency || { combat: 0, shooting: 0, agility: 0, scouting: 0, medical: 0, negotiation: 0, searching: 0, mechanics: 0 };
          npcUpdate.proficiency_triggered.forEach(function(prof) {
            if (typeof npc.proficiency[prof] !== 'undefined') {
              npc.proficiency[prof] += 15; // 每次觸發固定給 15 點經驗，由前端統一控制
            }
          });
        }
      }
    });
  }

  // 【階段5新增】處理 AI 回報的熟練度增加
  if (update.proficiency_triggered && Array.isArray(update.proficiency_triggered)) {
    applyProficiencyGrowth(gameState.skillProficiency, update.proficiency_triggered);
    // (如果未來需要，也可以讓 AI 回報 NPC 的觸發，目前先以主角為主)
  }
  if (update.vehicle_update && update.vehicle_update.action) {
    applyVehicleUpdate(update.vehicle_update);
  }
  if (update.stash_update && update.stash_update.action) {
    applyStashUpdate(update.stash_update);
  }
  if (update.faction_trust_update) {
    // 1. 定義合法的五大勢力白名單
    var VALID_FACTIONS = ['鐵幕守望者', '方舟商會', '荒原拾骸者', '靜默之子', '深層獵手'];
    
    // 2. 建立「據點」自動對應「勢力」的轉換表
    var FACTION_ALIASES = {
      '灰堡': '鐵幕守望者',
      '方舟海上堡壘': '方舟商會',
      '荒原鎮群': '荒原拾骸者',
      '靜默聖所': '靜默之子',
      '深谷中繼站': '深層獵手'
    };

    for (var rawFaction in update.faction_trust_update) {
      if (Object.prototype.hasOwnProperty.call(update.faction_trust_update, rawFaction)) {
        var targetFaction = rawFaction;
        var delta = update.faction_trust_update[rawFaction];

        // 偵測到 AI 使用據點名稱時，自動校正為對應勢力
        if (FACTION_ALIASES[targetFaction]) {
          targetFaction = FACTION_ALIASES[targetFaction];
        }

        // 嚴格攔截：只有在白名單內的勢力，才允許寫入系統
        if (VALID_FACTIONS.indexOf(targetFaction) !== -1) {
          gameState.factionTrust[targetFaction] = (gameState.factionTrust[targetFaction] || 0) + delta;
        } else {
          console.warn('[系統警告] 攔截到 AI 虛構的勢力名稱並已捨棄：' + targetFaction);
        }
      }
    }
  }
  if (update.special_event === 'awakening') gameState.awakeningLevel = Math.max(gameState.awakeningLevel, 1);
  if (update.special_event === 'multi_awakening') gameState.awakeningLevel = Math.max(gameState.awakeningLevel, 1);
}

function applyCompanionChanges(changes) {
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    if (change.action === 'join') {
      if (gameState.companions.indexOf(change.name) === -1 && gameState.companions.length < 2) {
        gameState.companions.push(change.name);
      }
      // 【階段2新增】初始化 NPC 與復隊校正
      createNpcStateSkeleton(change.name);
      correctNpcStateOnRejoin(change.name, gameState.turnCount);
    } else if (change.action === 'leave') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
      // 【階段2新增】記錄離隊回合
      if (gameState.npcStates && gameState.npcStates[change.name]) {
        gameState.npcStates[change.name].lastLeftTurn = gameState.turnCount;
      }
    } else if (change.action === 'die') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
      // 【階段2新增】死亡清除
      clearNpcStateOnDeath(change.name);
    }
  }
}

function advanceTime(minutes) {
  var total = gameState.time.hour * 60 + gameState.time.minute + minutes;
  var daysToAdd = Math.floor(total / 1440);
  total = total % 1440;
  gameState.time.day += daysToAdd;
  gameState.time.hour = Math.floor(total / 60);
  gameState.time.minute = total % 60;

  var hungerDecay = minutes * 0.05;
  // 主角飢餓衰減
  gameState.hunger = clamp(gameState.hunger - hungerDecay, 0, 100);

  // 【修正】只有「當前隨行」的 NPC 才會隨時間自然消耗飢餓度，不在身邊的完全凍結
  if (gameState.npcStates && gameState.companions && gameState.companions.length > 0) {
    gameState.companions.forEach(function(npcName) {
      var npc = gameState.npcStates[npcName];
      if (npc && typeof npc.hunger === 'number') {
        npc.hunger = clamp(npc.hunger - hungerDecay, 0, 100);
      }
    });
  }
}

function checkEntityDeathCondition(stamina, injuryStatus) {
  return stamina <= 0 && injuryStatus === 'severe';
}

function trackDangerLevel(level) {
  gameState.recentDangerLevels.push(level);
  if (gameState.recentDangerLevels.length > 5) {
    gameState.recentDangerLevels.shift();
  }
}

function getDangerPacingHint() {
  var recent = gameState.recentDangerLevels.slice(-3);
  var criticalCount = recent.filter(function (l) { return l === 'critical'; }).length;
  if (criticalCount >= 2) {
    return '注意：最近連續處於高危狀態，本回合請提供至少一個明確的低風險或無風險選項，安排劇情緩衝。';
  }
  return '';
}

function showNextPendingModal() {
  if (pendingMilestoneModals.length === 0) return;
  var next = pendingMilestoneModals.shift();
  showEventModal(next.icon, next.title, next.text);
}

function handleEventModalClose() {
  dom.eventModal.classList.add('hidden');
  showNextPendingModal();
}

function requestTravelTo(targetLocation) {
  if (isWaitingForAI || gameState.isDead) return;
  if (gameState.location === targetLocation) {
    alert("📍 你已經在【" + targetLocation + "】了。"); return;
  }
  
  var currentCoords = getLocationCoords(gameState.location);
  var targetCoords = getLocationCoords(targetLocation);
  var dx = currentCoords.x - targetCoords.x;
  var dy = currentCoords.y - targetCoords.y;
  var dist = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy))); // 至少 1km
  
  var activeVehicle = gameState.vehicles.find(function(v) { return v.status === 'active'; });
  var promptText = "";
  
  if (activeVehicle) {
    var fuelNeeded = (dist / 10) * 5;
    if (activeVehicle.fuel < fuelNeeded && activeVehicle.fuel <= 0) {
      alert("📍 距離：" + dist + "公里。載具油量耗盡，無法開車前往。"); return;
    }
    activeVehicle.fuel = Math.max(0, activeVehicle.fuel - fuelNeeded);
    activeVehicle.durability = Math.max(0, activeVehicle.durability - ((dist / 10) * 2));
    advanceTime(dist * 1.5); // 開車時間
    promptText = "你驅車抵達了【" + targetLocation + "】（總車程 " + dist + " 公里）。";
  } else {
    var staminaNeeded = dist * 3;
    if (staminaNeeded > gameState.stamina) {
      alert("📍 距離過遠（" + dist + "公里），需要 " + staminaNeeded + " 體力。徒步前往等同自殺。請先準備載具、紮營或規劃中繼點。"); return;
    }
    // JS 直接扣除主角與NPC體力
    gameState.stamina = Math.max(0, gameState.stamina - staminaNeeded);
    if (gameState.companions && gameState.npcStates) {
      gameState.companions.forEach(function(npc) {
        if(gameState.npcStates[npc]) gameState.npcStates[npc].stamina = Math.max(0, gameState.npcStates[npc].stamina - staminaNeeded);
      });
    }
    advanceTime(dist * 12); // 徒步時間
    promptText = "你徒步跋涉抵達了【" + targetLocation + "】（徒步 " + dist + " 公里）。";
  }
  
  // 更新位置並關閉UI，通知AI生成新地點敘事
  gameState.location = targetLocation;
  if (gameState.exploredLocations.indexOf(targetLocation) === -1) gameState.exploredLocations.push(targetLocation);
  
  toggleInfoPanel(false);
  if (dom.manualModal) dom.manualModal.classList.add('hidden');
  renderAll();
  requestNextTurn(promptText);
}

function getLocationCoords(locName) {
  for (var poolId in MAP_PRESETS) {
    var pool = MAP_PRESETS[poolId];
    if (pool.name === locName) return { x: pool.x, y: pool.y };
    for (var i = 0; i < pool.locations.length; i++) {
      if (pool.locations[i].name === locName) return { x: pool.locations[i].x, y: pool.locations[i].y };
    }
  }
  if (gameState.currentMapPresetId && MAP_PRESETS[gameState.currentMapPresetId]) {
    return { x: MAP_PRESETS[gameState.currentMapPresetId].x, y: MAP_PRESETS[gameState.currentMapPresetId].y };
  }
  return { x: 0, y: 0 }; // 找不到就當作原點
}
