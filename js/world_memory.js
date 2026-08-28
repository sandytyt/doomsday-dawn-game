'use strict';

/*
 * world_memory.js
 * 獨立管理長期世界記憶：安全區、關鍵NPC、勢力歷史、重大事件、
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

    // 【終極防呆】：如果傳進來的 update 其實被包在 world_memory_update 屬性裡，就解開它
    if (update.world_memory_update) {
      update = update.world_memory_update;
    }

    // 【終極防呆】：有些 AI 會把 new_safe_zone 回傳成陣列
    var safeZonesToAdd = [];
    if (Array.isArray(update.new_safe_zone)) {
      safeZonesToAdd = update.new_safe_zone;
    } else if (update.new_safe_zone && update.new_safe_zone.name) {
      safeZonesToAdd.push(update.new_safe_zone);
    }

    // 1. 建立新安全區
    if (update.new_safe_zone && update.new_safe_zone.name) {
      var nz = update.new_safe_zone;
      if (!findByName(worldMemory.safeZones, nz.name)) {
        
        // 【新增】：10個預先設定好的黃金安全區座標 (廣泛散佈於地圖各處)
        var PREDEFINED_COORDS = [
          {x: -30, y: 20}, {x: 40, y: -20}, {x: 10, y: 60}, {x: -50, y: -30}, {x: 25, y: 25},
          {x: -20, y: -50}, {x: 55, y: 40}, {x: -10, y: -10}, {x: -60, y: 30}, {x: 60, y: -40}
        ];
        // 依照目前建立的安全區數量，依序分配座標 (超過10個就從頭循環)
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
        
        // 【機制一：自動建立同名暫存點 (倉庫)】
        if (typeof gameState !== 'undefined') {
          gameState.stashes = gameState.stashes || [];
          var existingStash = gameState.stashes.find(function(s) { return s.locationName === nz.name; });
          if (!existingStash) {
            gameState.stashes.push({
              id: 'base_' + Date.now(), 
              locationName: nz.name,
              items: [] 
            });
          }
        }
      }
    }

    // 【終極防呆】：有些 AI 會把 safe_zone_update 回傳成陣列
    var safeZonesToUpdate = [];
    if (Array.isArray(update.safe_zone_update)) {
      safeZonesToUpdate = update.safe_zone_update;
    } else if (update.safe_zone_update && update.safe_zone_update.name) {
      safeZonesToUpdate.push(update.safe_zone_update);
    }

    // 2. 更新安全區 (藍圖與建材攔截)
    if (update.safe_zone_update && update.safe_zone_update.name) {
      var su = update.safe_zone_update;
      var zone = findByName(worldMemory.safeZones, su.name);
      
      if (zone) {
        if (typeof su.population === 'number') zone.population = su.population;
        
        // 【機制二：藍圖建造成本攔截機制】
        if (Array.isArray(su.facilities_add)) {
          for (var i = 0; i < su.facilities_add.length; i++) {
            var fName = su.facilities_add[i];
            
            if (zone.facilities.indexOf(fName) === -1) {
              var canBuild = true;
              
              if (window.FACILITY_BLUEPRINTS && window.FACILITY_BLUEPRINTS[fName]) {
                var bp = window.FACILITY_BLUEPRINTS[fName];
                var stash = gameState.stashes.find(function(s) { return s.locationName === zone.name; });
                
                if (bp.cost && Object.keys(bp.cost).length > 0) {
                  if (!stash || !stash.items) {
                    canBuild = false; 
                    if (typeof appendGMText === 'function') appendGMText('[系統警告] 缺乏基地倉庫，無法建設「' + fName + '」。');
                  } else {
                    var missing = [];
                    for (var mat in bp.cost) {
                      var requiredQty = bp.cost[mat];
                      var matItem = stash.items.find(function(item) { return item.name === mat; });
                      var currentQty = matItem ? matItem.quantity : 0;
                      if (currentQty < requiredQty) missing.push(mat + ' x' + (requiredQty - currentQty));
                    }
                    
                    if (missing.length > 0) {
                      canBuild = false;
                      if (typeof appendGMText === 'function') appendGMText('[系統警告] 倉庫建材不足 (缺少 ' + missing.join(', ') + ')，「' + fName + '」建設失敗。');
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
      }
    }

    if (update.npc_major_event && update.npc_major_event.name) {
      var ne = update.npc_major_event;
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

    if (update.faction_shift && update.faction_shift.faction) {
      worldMemory.factionHistory.push({
        faction: update.faction_shift.faction,
        eventText: truncateText(update.faction_shift.eventText || ''),
        turnRecorded: turnCount
      });
      capList(worldMemory.factionHistory, MAX_FACTION_HISTORY);
    }

    if (update.world_landmark && update.world_landmark.eventText) {
      worldMemory.majorEvents.push({
        eventText: truncateText(update.world_landmark.eventText),
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

    if (Array.isArray(evolution.npc_updates)) {
      for (var i = 0; i < evolution.npc_updates.length; i++) {
        var nu = evolution.npc_updates[i];
        if (!nu.name) continue;
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
      }
    }

    if (Array.isArray(evolution.safe_zone_updates)) {
      for (var j = 0; j < evolution.safe_zone_updates.length; j++) {
        var su2 = evolution.safe_zone_updates[j];
        if (!su2.name) continue;
        var zone = findByName(worldMemory.safeZones, su2.name);
        if (zone && su2.note) {
          zone.factionRelations = zone.factionRelations || {};
          zone.factionRelations.backgroundNote = truncateText(su2.note);
        }
      }
    }

    if (Array.isArray(evolution.faction_updates)) {
      for (var k = 0; k < evolution.faction_updates.length; k++) {
        var fu = evolution.faction_updates[k];
        if (!fu.faction) continue;
        worldMemory.factionHistory.push({
          faction: fu.faction,
          eventText: '[背景] ' + truncateText(fu.eventText || ''),
          turnRecorded: turnCount
        });
        capList(worldMemory.factionHistory, MAX_FACTION_HISTORY);
      }
    }

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
    if (!update) return { worldMemory: worldMemory, milestones: triggeredMilestones };

    ASPIRATION_KEYS.forEach(function (key) {
      var entry = update[key];
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
    rel.npcStatus = status;
    if (status === 'dead' || status === 'missing') {
      rel.frozen = true;
    } else if (status === 'alive') {
      rel.frozen = false;
    }
  }

  function isTransitionAllowed(fromStage, toStage, currentDay, stageEnteredDay) {
    var key = fromStage + '->' + toStage;
    if (NO_LIMIT_TRANSITIONS[key]) return true;
    return (currentDay - stageEnteredDay) >= STAGE_MIN_DAYS;
  }

  function applyRelationshipUpdate(worldMemory, update, currentDay) {
    worldMemory = ensureShape(worldMemory);
    if (!update || !update.npc_name) return worldMemory;

    var rel = getOrCreateRelationship(worldMemory, update.npc_name, currentDay);

    if (rel.frozen) {
      if (update.background_note) {
        rel.background.push({ text: truncateText(update.background_note), day: currentDay });
        if (rel.background.length > 30) rel.background.splice(0, rel.background.length - 30);
      }
      return worldMemory;
    }

    if (update.gender) rel.gender = update.gender;

    if (typeof update.trust_delta === 'number') {
      rel.trust = clampNum(rel.trust + update.trust_delta, 0, 100);
    }
    if (typeof update.closeness_delta === 'number') {
      rel.closeness = clampNum(rel.closeness + update.closeness_delta, 0, 100);
    }
    if (typeof update.romantic_tension_delta === 'number') {
      rel.romanticTension = clampNum(rel.romanticTension + update.romantic_tension_delta, 0, 100);
    }

    if (update.background_note) {
      rel.background.push({ text: truncateText(update.background_note), day: currentDay });
      if (rel.background.length > 30) rel.background.splice(0, rel.background.length - 30);
    }

    if (update.stage_transition && STAGE_ORDER.indexOf(update.stage_transition) !== -1) {
      if (isTransitionAllowed(rel.stage, update.stage_transition, currentDay, rel.stageEnteredDay)) {
        rel.stage = update.stage_transition;
        rel.stageEnteredDay = currentDay;
        if (update.note) {
          rel.milestones.push({ text: truncateText(update.note), day: currentDay, stage: update.stage_transition });
          if (rel.milestones.length > 15) rel.milestones.splice(0, rel.milestones.length - 15);
        }
      }
    } else if (update.note) {
      rel.milestones.push({ text: truncateText(update.note), day: currentDay, stage: rel.stage });
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
      parts.push('已知安全區： ' + zoneTexts.join('； '));
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
