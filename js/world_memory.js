'use strict';

/*
 * world_memory.js
 * 獨立管理長期世界記憶：基地、關鍵NPC、勢力歷史、重大事件、
 * 志向系統(aspirations)、人物關係系統(relationships)。
 */

var WorldMemory = (function () {

  var BACKGROUND_EVOLUTION_INTERVAL = 8;
  var MAX_SAFE_ZONES = 20;
  var MAX_NPCS = 40;
  var MAX_FACTION_HISTORY = 60;
  var MAX_MAJOR_EVENTS = 60;
  var TEXT_TRUNCATE_LENGTH = 200;
  var STAGE_MIN_DAYS = 5;
  var TRIAL_OVERDUE_DAYS = 10; 

  var ASPIRATION_KEYS = ['shelterBuilder', 'cureSeeker', 'shadowHunter', 'factionLeader'];
  var ASPIRATION_LABELS = { shelterBuilder: '庇護建設者', cureSeeker: '治療探索者', shadowHunter: '暗影獵人', factionLeader: '勢力締造者' };
  var STAGE_ORDER = ['acquainted', 'incipient', 'developing', 'critical_trial', 'defining_choice', 'resolved_bond', 'resolved_apart'];
  var STAGE_LABELS = {
    acquainted: '初識', incipient: '初萌', developing: '漸深', critical_trial: '風險考驗',
    defining_choice: '關鍵抉擇', resolved_bond: '穩定結合', resolved_apart: '疏離懸置'
  };
  var NO_LIMIT_TRANSITIONS = { 'acquainted->incipient': true };
  var NPC_STATUS_LABELS = { alive: '存活', dead: '已死亡', missing: '失散', unknown: '狀態不明' };

  function createInitial() {
    var aspirations = {};
    ASPIRATION_KEYS.forEach(function (key) {
      aspirations[key] = { progress: 0, milestones: [] };
    });
    return {
      safeZones: [],
      keyNpcs: [],
      factionHistory: [],
      majorEvents: [],
      lastBackgroundEvolutionTurn: 0,
      aspirations: aspirations,
      relationships: {}
    };
  }

  function ensureShape(worldMemory) {
    if (!worldMemory) return createInitial();
    if (!worldMemory.safeZones) worldMemory.safeZones = [];
    if (!worldMemory.keyNpcs) worldMemory.keyNpcs = [];
    if (!worldMemory.factionHistory) worldMemory.factionHistory = [];
    if (!worldMemory.majorEvents) worldMemory.majorEvents = [];
    if (typeof worldMemory.lastBackgroundEvolutionTurn !== 'number') worldMemory.lastBackgroundEvolutionTurn = 0;
    if (!worldMemory.aspirations) {
      worldMemory.aspirations = {};
      ASPIRATION_KEYS.forEach(function (key) {
        worldMemory.aspirations[key] = { progress: 0, milestones: [] };
      });
    } else {
      ASPIRATION_KEYS.forEach(function (key) {
        if (!worldMemory.aspirations[key]) worldMemory.aspirations[key] = { progress: 0, milestones: [] };
      });
    }
    if (!worldMemory.relationships) worldMemory.relationships = {};
    for (var name in worldMemory.relationships) {
      if (Object.prototype.hasOwnProperty.call(worldMemory.relationships, name)) {
        var rel = worldMemory.relationships[name];
        if (!rel.gender) rel.gender = '';
        if (!Array.isArray(rel.background)) rel.background = [];
        if (typeof rel.frozen !== 'boolean') rel.frozen = false;
        if (!rel.npcStatus) rel.npcStatus = 'alive';
      }
    }
    worldMemory.keyNpcs.forEach(function (npc) {
      if (!npc.gender) npc.gender = '';
    });
    return worldMemory;
  }

  function truncateText(text) {
    if (!text) return '';
    if (text.length <= TEXT_TRUNCATE_LENGTH) return text;
    return text.slice(0, TEXT_TRUNCATE_LENGTH) + '…';
  }

  function findByName(list, name) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === name) return list[i];
    }
    return null;
  }

  function capList(list, maxLen) {
    if (list.length > maxLen) {
      list.splice(0, list.length - maxLen);
    }
  }

  function clampNum(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function applyWorldMemoryUpdate(worldMemory, update, turnCount) {
    worldMemory = ensureShape(worldMemory);
    if (!update) return worldMemory;

    // 【接線】巢狀解包、陣列/物件正規化，統一交給 AppSchema 處理
    var normalized = AppSchema.normalizeWorldMemoryUpdate(update);
    if (!normalized) return worldMemory;

    // 10 個預先設定好的黃金基地座標（廣泛散佈於地圖各處）
    var PREDEFINED_COORDS = [
      { x: -30, y: 20 }, { x: 40, y: -20 }, { x: 10, y: 60 }, { x: -50, y: -30 }, { x: 25, y: 25 },
      { x: -20, y: -50 }, { x: 55, y: 40 }, { x: -10, y: -10 }, { x: -60, y: 30 }, { x: 60, y: -40 }
    ];

    // 1. 建立新基地（【修正 Bug #17】走訪整個陣列，支援單回合建立多個基地）
    normalized.newSafeZones.forEach(function (nz) {
      if (findByName(worldMemory.safeZones, nz.name)) return;

      // 依照目前建立的基地數量，依序分配座標（超過 10 個就從頭循環）
      var coordIdx = worldMemory.safeZones.length % PREDEFINED_COORDS.length;

      worldMemory.safeZones.push({
        name: nz.name,
        location: nz.location || '',
        x: PREDEFINED_COORDS[coordIdx].x,
        y: PREDEFINED_COORDS[coordIdx].y,
        population: typeof nz.population === 'number' ? nz.population : 0,
        facilities: Array.isArray(nz.facilities) ? nz.facilities.slice() : [],
        factionRelations: {}
      });
      capList(worldMemory.safeZones, MAX_SAFE_ZONES);

      // 【機制一：自動建立同名暫存點（倉庫）】
      if (typeof gameState !== 'undefined') {
        gameState.stashes = gameState.stashes || [];
        var existingStash = gameState.stashes.find(function (s) { return s.locationName === nz.name; });
        if (!existingStash) {
          gameState.stashes.push({
            id: 'base_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            locationName: nz.name,
            items: []
          });
        }
      }
    });

    // 2. 更新基地（【修正 Bug #17】走訪整個陣列，支援單回合更新多個基地）
    normalized.safeZoneUpdates.forEach(function (su) {
      var zone = findByName(worldMemory.safeZones, su.name);
      if (!zone) return;

      if (typeof su.population === 'number') zone.population = su.population;

      // 【機制二：藍圖建造成本攔截機制】
      if (Array.isArray(su.facilities_add)) {
        for (var i = 0; i < su.facilities_add.length; i++) {
          var fName = su.facilities_add[i];

          if (zone.facilities.indexOf(fName) === -1) {
            var canBuild = true;

            if (window.FACILITY_BLUEPRINTS && window.FACILITY_BLUEPRINTS[fName]) {
              var bp = window.FACILITY_BLUEPRINTS[fName];
              var stash = gameState.stashes.find(function (s) { return s.locationName === zone.name; });

              if (bp.cost && Object.keys(bp.cost).length > 0) {
                if (!stash || !stash.items) {
                  canBuild = false;
                  if (typeof appendGMText === 'function') appendGMText('[系統警告] 缺乏基地倉庫，無法建設「' + fName + '」。');
                } else {
                  var missing = [];
                  for (var mat in bp.cost) {
                    var requiredQty = bp.cost[mat];
                    var matItem = stash.items.find(function (item) { return item.name === mat; });
                    var currentQty = matItem ? matItem.quantity : 0;
                    if (currentQty < requiredQty) missing.push(mat + ' x' + (requiredQty - currentQty));
                  }
                  if (missing.length > 0) {
                    canBuild = false;
                    if (typeof appendGMText === 'function') appendGMText('[系統警告] 倉庫建材不足（缺少 ' + missing.join(', ') + '），「' + fName + '」建設失敗。');
                  } else {
                    var changes = [];
                    for (var matCost in bp.cost) changes.push({ name: matCost, quantity: bp.cost[matCost], action: 'remove' });
                    if (typeof applyInventoryChangesTo === 'function') applyInventoryChangesTo(stash.items, changes);
                    if (typeof appendGMText === 'function') appendGMText('[基地建設] 消耗了建材，成功在 ' + zone.name + ' 建造了「' + fName + '」！');
                  }
                }
              }
            }

            if (canBuild) zone.facilities.push(fName);
          }
        }
      }

      if (Array.isArray(su.facilities_remove)) {
        zone.facilities = zone.facilities.filter(function (f) {
          return su.facilities_remove.indexOf(f) === -1;
        });
      }

      if (su.faction_relation_note) {
        zone.factionRelations.note = truncateText(su.faction_relation_note);
      }
    });

    // 3. NPC 重大事件
    if (normalized.npcMajorEvent) {
      var ne = normalized.npcMajorEvent;
      var npc = findByName(worldMemory.keyNpcs, ne.name);
      if (!npc) {
        npc = { name: ne.name, gender: ne.gender || '', ability: ne.ability || '', relationshipNotes: '', status: ne.status || 'alive', lastKnownLocation: '' };
        worldMemory.keyNpcs.push(npc);
        capList(worldMemory.keyNpcs, MAX_NPCS);
      }
      if (ne.gender) npc.gender = ne.gender;
      if (ne.ability) npc.ability = ne.ability;
      if (ne.status) npc.status = ne.status;
      if (ne.note) {
        npc.relationshipNotes = truncateText((npc.relationshipNotes ? npc.relationshipNotes + ' ' : '') + ne.note);
      }
      syncNpcStatusToRelationship(worldMemory, ne.name, ne.status, turnCount);
    }

    // 4. 勢力歷史事件
    if (normalized.factionShift) {
      worldMemory.factionHistory.push({
        faction: normalized.factionShift.faction,
        eventText: truncateText(normalized.factionShift.eventText || ''),
        turnRecorded: turnCount
      });
      capList(worldMemory.factionHistory, MAX_FACTION_HISTORY);
    }

    // 5. 世界重大地標事件
    if (normalized.worldLandmark) {
      worldMemory.majorEvents.push({
        eventText: truncateText(normalized.worldLandmark.eventText),
        turnRecorded: turnCount
      });
      capList(worldMemory.majorEvents, MAX_MAJOR_EVENTS);
    }

    return worldMemory;
  }

  /* ---------- 背景推演事件寫入（background_evolution） ---------- */
  function applyBackgroundEvolution(worldMemory, evolution, turnCount) {
    worldMemory = ensureShape(worldMemory);
    if (!evolution) {
      worldMemory.lastBackgroundEvolutionTurn = turnCount;
      return worldMemory;
    }

    // 【接線】陣列防呆統一交給 AppSchema 處理
    var normalized = AppSchema.normalizeBackgroundEvolution(evolution);

    normalized.npcUpdates.forEach(function (nu) {
      var npc = findByName(worldMemory.keyNpcs, nu.name);
      if (!npc) {
        npc = { name: nu.name, gender: nu.gender || '', ability: nu.ability || '', relationshipNotes: '', status: nu.status || 'alive', lastKnownLocation: '' };
        worldMemory.keyNpcs.push(npc);
        capList(worldMemory.keyNpcs, MAX_NPCS);
      }
      if (nu.gender) npc.gender = nu.gender;
      if (nu.ability) npc.ability = nu.ability;
      if (nu.status) npc.status = nu.status;
      if (nu.note) {
        npc.relationshipNotes = truncateText((npc.relationshipNotes ? npc.relationshipNotes + ' ' : '') + '[背景] ' + nu.note);
      }
      syncNpcStatusToRelationship(worldMemory, nu.name, nu.status, turnCount);
    });

    normalized.safeZoneUpdates.forEach(function (su2) {
      var zone = findByName(worldMemory.safeZones, su2.name);
      if (zone && su2.note) {
        zone.factionRelations = zone.factionRelations || {};
        zone.factionRelations.backgroundNote = truncateText(su2.note);
      }
    });

    normalized.factionUpdates.forEach(function (fu) {
      worldMemory.factionHistory.push({
        faction: fu.faction,
        eventText: '[背景] ' + truncateText(fu.eventText || ''),
        turnRecorded: turnCount
      });
      capList(worldMemory.factionHistory, MAX_FACTION_HISTORY);
    });

    worldMemory.lastBackgroundEvolutionTurn = turnCount;
    return worldMemory;
  }

  function shouldTriggerBackgroundEvolution(worldMemory, turnCount) {
    worldMemory = ensureShape(worldMemory);
    var hasAnyEntity = worldMemory.safeZones.length > 0 || worldMemory.keyNpcs.length > 0;
    if (!hasAnyEntity) return false;
    return (turnCount - worldMemory.lastBackgroundEvolutionTurn) >= BACKGROUND_EVOLUTION_INTERVAL;
  }

  /* ---------- 志向系統 ---------- */
  function applyAspirationUpdate(worldMemory, update, currentDay) {
    worldMemory = ensureShape(worldMemory);
    var triggeredMilestones = [];

    // 【接線】key 白名單過濾統一交給 AppSchema 處理
    var normalized = AppSchema.normalizeAspirationUpdate(update);
    if (!normalized) return { worldMemory: worldMemory, milestones: triggeredMilestones };

    ASPIRATION_KEYS.forEach(function (key) {
      var entry = normalized[key];
      if (!entry) return;
      var asp = worldMemory.aspirations[key];
      if (typeof entry.progress_delta === 'number') {
        var delta = clampNum(entry.progress_delta, -20, 20);
        asp.progress = clampNum(asp.progress + delta, -100, 500);
      }
      if (entry.milestone_text) {
        var milestone = { text: truncateText(entry.milestone_text), day: currentDay };
        asp.milestones.push(milestone);
        if (asp.milestones.length > 20) asp.milestones.splice(0, asp.milestones.length - 20);
        triggeredMilestones.push({ aspirationKey: key, aspirationLabel: ASPIRATION_LABELS[key], text: milestone.text });
      }
    });

    return { worldMemory: worldMemory, milestones: triggeredMilestones };
  }


  /* ---------- 關係系統：六階段含天數硬性驗證 ---------- */
  function getOrCreateRelationship(worldMemory, npcName, currentDay) {
    if (!worldMemory.relationships[npcName]) {
      worldMemory.relationships[npcName] = {
        gender: '', trust: 0, closeness: 0, romanticTension: 0,
        stage: 'acquainted', stageEnteredDay: currentDay, background: [], milestones: [],
        frozen: false, npcStatus: 'alive'
      };
    }
    return worldMemory.relationships[npcName];
  }

  function syncNpcStatusToRelationship(worldMemory, npcName, status, turnCount) {
    if (!status || !worldMemory.relationships[npcName]) return;
    var rel = worldMemory.relationships[npcName];
    var wasFrozen = rel.frozen;
    rel.npcStatus = status;
    if (status === 'dead' || status === 'missing') {
      rel.frozen = true;
    } else if (status === 'alive') {
      rel.frozen = false;
      // 【修正 Bug #4】若是從凍結狀態解除（重新歸隊），將關係階段的
      // 起算日重置為「當前遊戲天數」，避免離隊空窗期被誤算入關係階段天數。
      if (wasFrozen && typeof gameState !== 'undefined' && gameState.time) {
        rel.stageEnteredDay = gameState.time.day;
      }
    }
  }

  function isTransitionAllowed(fromStage, toStage, currentDay, stageEnteredDay) {
    var key = fromStage + '->' + toStage;
    if (NO_LIMIT_TRANSITIONS[key]) return true;
    return (currentDay - stageEnteredDay) >= STAGE_MIN_DAYS;
  }

function applyRelationshipUpdate(worldMemory, update, currentDay) {
  worldMemory = ensureShape(worldMemory);

  // 【接線】npc_name 必填檢查與 stage_transition 白名單驗證交給 AppSchema 處理
  var normalized = AppSchema.normalizeRelationshipUpdate(update);
  if (!normalized) return worldMemory;

  var rel = getOrCreateRelationship(worldMemory, normalized.npc_name, currentDay);

  if (rel.frozen) {
    if (normalized.background_note) {
      rel.background.push({ text: truncateText(normalized.background_note), day: currentDay });
      if (rel.background.length > 30) rel.background.splice(0, rel.background.length - 30);
    }
    return worldMemory;
  }

  if (normalized.gender) rel.gender = normalized.gender;

  if (normalized.trust_delta) {
    rel.trust = clampNum(rel.trust + normalized.trust_delta, 0, 100);
  }
  if (normalized.closeness_delta) {
    rel.closeness = clampNum(rel.closeness + normalized.closeness_delta, 0, 100);
  }
  if (normalized.romantic_tension_delta) {
    rel.romanticTension = clampNum(rel.romanticTension + normalized.romantic_tension_delta, 0, 100);
  }
  if (normalized.background_note) {
    rel.background.push({ text: truncateText(normalized.background_note), day: currentDay });
    if (rel.background.length > 30) rel.background.splice(0, rel.background.length - 30);
  }

  if (normalized.stage_transition) {
    if (isTransitionAllowed(rel.stage, normalized.stage_transition, currentDay, rel.stageEnteredDay)) {
      rel.stage = normalized.stage_transition;
      rel.stageEnteredDay = currentDay;
      if (normalized.note) {
        rel.milestones.push({ text: truncateText(normalized.note), day: currentDay, stage: normalized.stage_transition });
        if (rel.milestones.length > 15) rel.milestones.splice(0, rel.milestones.length - 15);
      }
    }
  } else if (normalized.note) {
    rel.milestones.push({ text: truncateText(normalized.note), day: currentDay, stage: rel.stage });
    if (rel.milestones.length > 15) rel.milestones.splice(0, rel.milestones.length - 15);
  }

  return worldMemory;
}

  /* ---------- 組裝要塞進AI提示詞的文字段落 ---------- */
  function buildWorldMemoryPrompt(worldMemory, currentDay) {
    worldMemory = ensureShape(worldMemory);
    var parts = [];

    if (worldMemory.safeZones.length > 0) {
      var zoneTexts = worldMemory.safeZones.map(function (z) {
        var facilitiesText = z.facilities.length ? ('已建設施：' + z.facilities.join('、')) : '尚無建設';
        var relNote = z.factionRelations && (z.factionRelations.note || z.factionRelations.backgroundNote);
        return z.name + '（位於' + (z.location || '未知位置') + '，人口約' + z.population + '人，' + facilitiesText + (relNote ? '，' + relNote : '') + '）';
      });
      parts.push('已知基地： ' + zoneTexts.join('； '));
    }

    if (worldMemory.keyNpcs.length > 0) {
      var npcTexts = worldMemory.keyNpcs.map(function (n) {
        var statusText = NPC_STATUS_LABELS[n.status] || n.status;
        return n.name + '（' + (n.gender ? n.gender + '，' : '') + '能力：' + (n.ability || '無特殊能力') + '，狀態：' + statusText + (n.relationshipNotes ? '，經歷：' + n.relationshipNotes : '') + '）';
      });
      parts.push('關鍵NPC記錄： ' + npcTexts.join('； '));
    }

    if (worldMemory.factionHistory.length > 0) {
      var recentFactionHistory = worldMemory.factionHistory.slice(-15);
      var factionTexts = recentFactionHistory.map(function (f) {
        return '第' + f.turnRecorded + '回合-' + f.faction + '：' + f.eventText;
      });
      parts.push('勢力歷史紀要： ' + factionTexts.join('； '));
    }

    if (worldMemory.majorEvents.length > 0) {
      var recentMajorEvents = worldMemory.majorEvents.slice(-15);
      var eventTexts = recentMajorEvents.map(function (e) {
        return '第' + e.turnRecorded + '回合：' + e.eventText;
      });
      parts.push('世界重大事件紀要： ' + eventTexts.join('； '));
    }

    var aspirationTexts = ASPIRATION_KEYS.filter(function (key) {
      return worldMemory.aspirations[key].progress !== 0 || worldMemory.aspirations[key].milestones.length > 0;
    }).map(function (key) {
      var asp = worldMemory.aspirations[key];
      var latestMilestone = asp.milestones.length ? asp.milestones[asp.milestones.length - 1].text : '';
      return ASPIRATION_LABELS[key] + '（進度' + asp.progress + (latestMilestone ? '，最新進展：' + latestMilestone : '') + '）';
    });
    if (aspirationTexts.length > 0) {
      parts.push('玩家志向發展： ' + aspirationTexts.join('； '));
    }

    var relNames = Object.keys(worldMemory.relationships);
    if (relNames.length > 0) {
      var relTexts = relNames.map(function (name) {
        var rel = worldMemory.relationships[name];
        if (rel.frozen) {
          return name + '（' + (NPC_STATUS_LABELS[rel.npcStatus] || rel.npcStatus) + '，關係已凍結於「' + (STAGE_LABELS[rel.stage] || rel.stage) + '」階段，不可再變動）';
        }
        var daysInStage = (typeof currentDay === 'number') ? (currentDay - rel.stageEnteredDay) : null;
        var nextStageIdx = STAGE_ORDER.indexOf(rel.stage) + 1;
        var nextStage = nextStageIdx < STAGE_ORDER.length ? STAGE_ORDER[nextStageIdx] : null;
        var canAdvance = nextStage ? isTransitionAllowed(rel.stage, nextStage, currentDay, rel.stageEnteredDay) : false;
        var latestMilestone = rel.milestones.length ? rel.milestones[rel.milestones.length - 1].text : '';
        var overdueHint = (rel.stage === 'developing' && daysInStage !== null && daysInStage >= TRIAL_OVERDUE_DAYS) ? '，該NPC已進入漸深階段較久，可考慮安排風險考驗事件推進關係' : '';
        return name + '（' + (rel.gender ? rel.gender + '，' : '') + '階段：' + (STAGE_LABELS[rel.stage] || rel.stage) + '，信任' + rel.trust + '，親密' + rel.closeness + '，浪漫張力' + rel.romanticTension +
          '，已於本階段' + (daysInStage !== null ? daysInStage : '?') + '天' + (canAdvance ? '，可推進下一階段' : '，尚未滿' + STAGE_MIN_DAYS + '天不可推進階段') +
          (latestMilestone ? '，最新事件：' + latestMilestone : '') + overdueHint + '）';
      });
      parts.push('人物關係記錄（初識到初萌的轉換不受天數限制，其後每階段轉換需已在目前階段停留至少' + STAGE_MIN_DAYS + '天，未達天數者請勿觸發stage_transition）： ' + relTexts.join('； '));
    }

    if (parts.length === 0) return '';
    return '【長期世界記憶，務必納入考量，不可忽略或遺忘】 ' + parts.join(' ');
  }

  return {
    createInitial: createInitial,
    ensureShape: ensureShape,
    applyWorldMemoryUpdate: applyWorldMemoryUpdate,
    applyBackgroundEvolution: applyBackgroundEvolution,
    shouldTriggerBackgroundEvolution: shouldTriggerBackgroundEvolution,
    applyAspirationUpdate: applyAspirationUpdate,
    applyRelationshipUpdate: applyRelationshipUpdate,
    buildWorldMemoryPrompt: buildWorldMemoryPrompt,
    ASPIRATION_KEYS: ASPIRATION_KEYS,
    ASPIRATION_LABELS: ASPIRATION_LABELS,
    STAGE_ORDER: STAGE_ORDER,
    STAGE_LABELS: STAGE_LABELS,
    STAGE_MIN_DAYS: STAGE_MIN_DAYS,
    NPC_STATUS_LABELS: NPC_STATUS_LABELS,
    BACKGROUND_EVOLUTION_INTERVAL: BACKGROUND_EVOLUTION_INTERVAL
  };
})();
