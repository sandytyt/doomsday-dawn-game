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

/* ---------- 子函式 1：體力／飢餓／傷勢 ---------- */

function applyVitalsUpdate(u) {
  gameState.stamina = clamp(gameState.stamina + u.stamina_change, 0, gameState.maxStamina);
  gameState.hunger = clamp(gameState.hunger + u.hunger_change, 0, 100);

  if (u.injury_status) {
    // 防呆：如果沒有狀態，預設為 none（健康）
    gameState.injuryStatus = gameState.injuryStatus || 'none';
    // 傷勢降級邏輯（只允許一階一階降，重傷 -> 輕傷 -> 健康）
    if (gameState.injuryStatus === 'severe' && u.injury_status === 'none') {
      gameState.injuryStatus = 'minor';
    } else {
      gameState.injuryStatus = u.injury_status;
    }

    if (gameState.injuryStatus === 'none') {
      gameState.injuryDetail = '';
    } else if (u.injury_detail) {
      gameState.injuryDetail = u.injury_detail;
    }
  }

  if (u.inventory_changes.length) {
    var autoRecovery = applyInventoryChanges(u.inventory_changes);
    if (autoRecovery > 0) {
      gameState.hunger = clamp(gameState.hunger + autoRecovery, 0, 100);
    }
    // 印出主角獲得物品的日誌
    if (typeof appendGMText === 'function') {
      u.inventory_changes.forEach(function (change) {
        if (change.action === 'add' || change.action === 'add_weapon') {
          appendGMText('[系統] 你獲得了 ' + change.name + ' x' + change.quantity + '。');
        }
      });
    }
  }
}

/* ---------- 子函式 2：時間／位置／危險等級／天氣 ---------- */

function unlockDiscoveredRegion(locationName) {
  if (!locationName || locationName === '未知地點') {
    return;
  }

  if (!Array.isArray(gameState.discoveredRegions)) {
    gameState.discoveredRegions = [];
  }

  var resolved = resolveMapLocation(locationName);

  if (!resolved || !resolved.regionKey) {
    return;
  }

  if (gameState.discoveredRegions.indexOf(resolved.regionKey) === -1) {
    gameState.discoveredRegions.push(resolved.regionKey);
  }
}

function applyEnvironmentUpdate(u) {
  if (u.time_advance_minutes) {
    advanceTime(u.time_advance_minutes);
  }

  if (u.current_location) {
    gameState.location = u.current_location;
    unlockDiscoveredRegion(u.current_location);
  }

  if (u.danger_level) {
    gameState.dangerLevel = u.danger_level;
    trackDangerLevel(u.danger_level);
  }

  if (u.weather) {
    gameState.weather = u.weather;
  }
}

/* ---------- 子函式 3：人性／共鳴／熟練度／覺醒 ---------- */

function applyProgressionUpdate(u) {
  gameState.humanity = clamp(gameState.humanity + u.humanity_change, 0, 100);
  gameState.resonanceValue = clamp(gameState.resonanceValue + u.resonance_change, 0, 999);

  if (u.ability_exp_change !== 0) {
    applyAbilityExpChange(u.ability_exp_change);
  }

  if (u.proficiency_triggered.length) {
    applyProficiencyGrowth(gameState.skillProficiency, u.proficiency_triggered);
  }

  if (u.special_event === 'awakening' || u.special_event === 'multi_awakening') {
    gameState.awakeningLevel = Math.max(gameState.awakeningLevel, 1);
    // 【新增】記錄覺醒屬性，供晶核同屬性加成判定使用（僅在首次覺醒時寫入，
    // 避免後續其他 status_update 誤帶入 awakened_element 導致屬性被覆蓋）
    if (u.awakened_element && !gameState.awakenedElement) {
      gameState.awakenedElement = u.awakened_element;
    }
  }
}

/* ---------- 子函式 4：NPC 巢狀狀態更新 ---------- */

function applyCompanionStatusUpdate(u) {
  if (u.companion_changes.length) {
    applyCompanionChanges(u.companion_changes);
  }

  // 接收 NPC 的獨立狀態變化（含背包與體格）
  u.npc_status_updates.forEach(function (npcUpdate) {
    if (!(gameState.npcStates && gameState.npcStates[npcUpdate.name])) return;
    var npc = gameState.npcStates[npcUpdate.name];

    // NPC 的體力與飽食度，與主角一樣正常接受 AI 的增減（劇情休息、進食皆可恢復）
    npc.stamina = clamp(npc.stamina + npcUpdate.stamina_change, 0, 100);
    npc.hunger = clamp(npc.hunger + npcUpdate.hunger_change, 0, 100);

    // 傷勢降級邏輯（NPC 也適用階梯式恢復）
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
    if (npcUpdate.inventory_changes.length) {
      npc.inventory = npc.inventory || [];
      var npcAutoHunger = applyInventoryChangesTo(npc.inventory, npcUpdate.inventory_changes);
      if (npcAutoHunger > 0) {
        npc.hunger = Math.min(100, (npc.hunger || 0) + npcAutoHunger);
      }
      // 印出 NPC 獲得物品的日誌
      if (typeof appendGMText === 'function') {
        npcUpdate.inventory_changes.forEach(function (change) {
          if (change.action === 'add' || change.action === 'add_weapon') {
            appendGMText('[系統] 隨行隊員 ' + npcUpdate.name + ' 獲得了 ' + change.name + ' x' + change.quantity + '。');
          }
        });
      }
    }

    // 處理 NPC 的體格成長
    if (npcUpdate.proficiency_triggered.length) {
      npc.proficiency = npc.proficiency || { combat: 0, shooting: 0, agility: 0, scouting: 0, medical: 0, negotiation: 0, searching: 0, mechanics: 0 };
      npcUpdate.proficiency_triggered.forEach(function (prof) {
        if (typeof npc.proficiency[prof] !== 'undefined') {
          npc.proficiency[prof] += 15; // 每次觸發固定給 15 點經驗，由前端統一控制
        }
      });
    }
  });
}

/* ---------- 子函式 5：陣營信任度 ---------- */

function applyFactionTrustUpdate(u) {
  if (!u.faction_trust_update) return;

  // VALID_FACTIONS 與 FACTION_ALIASES 定義於 config.js 統一管理
  for (var rawFaction in u.faction_trust_update) {
    if (Object.prototype.hasOwnProperty.call(u.faction_trust_update, rawFaction)) {
      var targetFaction = rawFaction;
      var delta = u.faction_trust_update[rawFaction];

      // 偵測到 AI 使用基地名稱時，自動校正為對應勢力
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

/* ---------- 主入口（orchestrator）---------- */
function unlockDiscoveredRegion(locationName) {
  if (!Array.isArray(gameState.discoveredRegions)) {
    gameState.discoveredRegions = [];
  }

  var resolved = resolveMapLocation(locationName);

  if (
    !resolved ||
    !resolved.regionKey ||
    gameState.discoveredRegions.indexOf(resolved.regionKey) !== -1
  ) {
    return;
  }

  gameState.discoveredRegions.push(resolved.regionKey);
}

function applyStatusUpdate(update) {
  if (!update) return null;

  // 所有欄位型別與列舉值防呆，統一交給 AppSchema 處理
  var u = AppSchema.normalizeStatusUpdate(update);

  applyEnvironmentUpdate(u);
  applyVitalsUpdate(u);
  applyProgressionUpdate(u);
  applyCompanionStatusUpdate(u);
  if (u.vehicle_update) {
    applyVehicleUpdate(u.vehicle_update);
  }
  if (u.stash_update) {
    applyStashUpdate(u.stash_update);
  }
  applyFactionTrustUpdate(u);
  return u.special_event;
}

/* ---------- 其餘既有函式（維持不變）---------- */

function applyCompanionChanges(changes) {
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    if (change.action === 'join') {
      if (gameState.companions.indexOf(change.name) === -1 && gameState.companions.length < 2) {
        gameState.companions.push(change.name);
      }
      // 初始化 NPC 與復隊校正
      createNpcStateSkeleton(change.name);
      correctNpcStateOnRejoin(change.name, gameState.turnCount);
    } else if (change.action === 'leave') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
      // 記錄離隊回合
      if (gameState.npcStates && gameState.npcStates[change.name]) {
        gameState.npcStates[change.name].lastLeftTurn = gameState.turnCount;
      }
    } else if (change.action === 'die') {
      gameState.companions = gameState.companions.filter(function (n) { return n !== change.name; });
      // 死亡清除
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

  // 只有「當前隨行」的 NPC 才會隨時間自然消耗飢餓度
  if (gameState.npcStates && gameState.companions && gameState.companions.length > 0) {
    gameState.companions.forEach(function (npcName) {
      var npc = gameState.npcStates[npcName];
      if (npc && typeof npc.hunger === 'number') {
        npc.hunger = clamp(npc.hunger - hungerDecay, 0, 100);
      }
    });
  }

  // 如果跨越了天數，觸發基地日結算引擎
  if (daysToAdd > 0 && typeof runDailyBaseSimulation === 'function') {
    runDailyBaseSimulation(daysToAdd);
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
  dom.modal.event.classList.add('hidden');
  showNextPendingModal();
}

function requestTravelTo(targetLocation) {
  if (isWaitingForAI || gameState.isDead) return;
  if (gameState.location === targetLocation) {
    showEventModal('📍', '無法移動', '你已經在【' + targetLocation + '】了。');
    return;
  }

  var currentCoords = getLocationCoords(gameState.location);
  var targetCoords = getLocationCoords(targetLocation);
  var dx = currentCoords.x - targetCoords.x;
  var dy = currentCoords.y - targetCoords.y;
  var dist = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy)));

  var activeVehicle = gameState.vehicles.find(function (v) { return v.status === 'active'; });
  var costType, costValue, timeCost, canTravel = true, errorMsg = '';

  if (activeVehicle) {
    costType = 'fuel';
    costValue = parseFloat(((dist / 10) * 5).toFixed(1));
    timeCost = Math.round(dist * 1.5);
    if (activeVehicle.fuel < costValue && activeVehicle.fuel <= 0) {
      canTravel = false;
      errorMsg = '載具油量耗盡，無法開車前往。';
    }
  } else {
    costType = 'stamina';
    costValue = dist * 3;
    timeCost = dist * 12;
    if (costValue > gameState.stamina) {
      canTravel = false;
      errorMsg = '體力不足以應付這段旅程。徒步前往等同自殺，請準備載具或規劃中繼點。';
    }
  }

  // 開啟出發確認視窗（UI 函數定義在 app-ui.js）
  if (typeof openTravelConfirmModal === 'function') {
    openTravelConfirmModal(targetLocation, dist, costType, costValue, timeCost, canTravel, errorMsg, activeVehicle);
  }
}

// 玩家點擊「確認出發」後真正執行的邏輯
function executeTravel(targetLocation, dist, costType, costValue, timeCost, activeVehicle) {
  if (costType === 'fuel') {
    activeVehicle.fuel = Math.max(0, activeVehicle.fuel - costValue);
    activeVehicle.durability = Math.max(0, activeVehicle.durability - ((dist / 10) * 2));
  } else {
    gameState.stamina = Math.max(0, gameState.stamina - costValue);
    if (gameState.companions && gameState.npcStates) {
      gameState.companions.forEach(function (npc) {
        if (gameState.npcStates[npc]) gameState.npcStates[npc].stamina = Math.max(0, gameState.npcStates[npc].stamina - costValue);
      });
    }
  }

  advanceTime(timeCost);
  gameState.location = targetLocation;
  unlockDiscoveredRegion(targetLocation);

  if (typeof toggleInfoPanel === 'function') toggleInfoPanel(false);
  if (typeof renderAll === 'function') renderAll();

  var promptText = (costType === 'fuel' ? "你驅車抵達了【" : "你徒步跋涉抵達了【") + targetLocation + "】（總路程 " + dist + " 公里）。";
  requestNextTurn(promptText);
}

function getLocationCoords(locName) {
  // 1. 先查玩家的基地記憶（抓取預先分配好的 GPS 座標）
  if (gameState.worldMemory && gameState.worldMemory.safeZones) {
    var safeZone = gameState.worldMemory.safeZones.find(function (z) { return z.name === locName; });
    if (safeZone && typeof safeZone.x === 'number') {
      return { x: safeZone.x, y: safeZone.y };
    }
  }

  // 2. 查系統預設大地圖，並支援 AI 生成的地點名稱變體。
  var resolvedMapLocation = resolveMapLocation(locName);

  if (resolvedMapLocation) {
    return {
      x: resolvedMapLocation.x,
      y: resolvedMapLocation.y
    };
  }

  // 3. 都查不到，回傳當前大區中心點
  if (gameState.currentMapPresetId && MAP_PRESETS[gameState.currentMapPresetId]) {
    return { x: MAP_PRESETS[gameState.currentMapPresetId].x, y: MAP_PRESETS[gameState.currentMapPresetId].y };
  }
  return { x: 0, y: 0 };
}
