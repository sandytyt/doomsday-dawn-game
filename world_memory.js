'use strict';

/*
 * world_memory.js
 * 獨立管理長期世界記憶：安全區、關鍵NPC、勢力歷史、重大事件、
 * 志向系統(aspirations)、人物關係系統(relationships)。
 *
 * 志向系統：四條可疊加、不互斥的長期發展路線，AI依劇情自由判定推進。
 * 關係系統：三軸獨立數值(trust/closeness/romanticTension) + 五階段敘事節點，
 *          階段推進需滿足「已進入目前階段至少5個遊戲內天數」的硬性驗證，
 *          此驗證在程式碼端執行，不依賴AI自行計算天數。
 */

var WorldMemory = (function () {

  var BACKGROUND_EVOLUTION_INTERVAL = 8;
  var MAX_SAFE_ZONES = 20;
  var MAX_NPCS = 40;
  var MAX_FACTION_HISTORY = 60;
  var MAX_MAJOR_EVENTS = 60;
  var TEXT_TRUNCATE_LENGTH = 200;
  var STAGE_MIN_DAYS = 5; // 風險考驗等階段轉換前，須在目前階段停留的最少遊戲內天數

  var ASPIRATION_KEYS = ['shelterBuilder', 'cureSeeker', 'shadowHunter', 'factionLeader'];
  var STAGE_ORDER = ['incipient', 'developing', 'critical_trial', 'defining_choice', 'resolved_bond', 'resolved_apart'];

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

  /* ---------- 主角見聞事件寫入（world_memory_update） ---------- */
  function applyWorldMemoryUpdate(worldMemory, update, turnCount) {
    worldMemory = ensureShape(worldMemory);
    if (!update) return worldMemory;

    if (update.new_safe_zone && update.new_safe_zone.name) {
      var nz = update.new_safe_zone;
      if (!findByName(worldMemory.safeZones, nz.name)) {
        worldMemory.safeZones.push({
          name: nz.name,
          location: nz.location || '',
          population: typeof nz.population === 'number' ? nz.population : 0,
          facilities: Array.isArray(nz.facilities) ? nz.facilities.slice() : [],
          factionRelations: {}
        });
        capList(worldMemory.safeZones, MAX_SAFE_ZONES);
      }
    }

    if (update.safe_zone_update && update.safe_zone_update.name) {
      var su = update.safe_zone_update;
      var zone = findByName(worldMemory.safeZones, su.name);
      if (zone) {
        if (typeof su.population === 'number') zone.population = su.population;
        if (Array.isArray(su.facilities_add)) {
          for (var i = 0; i < su.facilities_add.length; i++) {
            if (zone.facilities.indexOf(su.facilities_add[i]) === -1) {
              zone.facilities.push(su.facilities_add[i]);
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
        npc = { name: ne.name, ability: ne.ability || '', relationshipNotes: '', status: ne.status || 'alive', lastKnownLocation: '' };
        worldMemory.keyNpcs.push(npc);
        capList(worldMemory.keyNpcs, MAX_NPCS);
      }
      if (ne.ability) npc.ability = ne.ability;
      if (ne.status) npc.status = ne.status;
      if (ne.note) {
        npc.relationshipNotes = truncateText((npc.relationshipNotes ? npc.relationshipNotes + ' ' : '') + ne.note);
      }
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
          npc = { name: nu.name, ability: nu.ability || '', relationshipNotes: '', status: nu.status || 'alive', lastKnownLocation: '' };
          worldMemory.keyNpcs.push(npc);
          capList(worldMemory.keyNpcs, MAX_NPCS);
        }
        if (nu.ability) npc.ability = nu.ability;
        if (nu.status) npc.status = nu.status;
        if (nu.note) {
          npc.relationshipNotes = truncateText((npc.relationshipNotes ? npc.relationshipNotes + ' ' : '') + '[背景] ' + nu.note);
        }
      }
    }

    if (Array.isArray(evolution.safe_zone_updates)) {
      for (var j = 0; j < evolution.safe_zone_updates.length; j++) {
        var su2 = evolution.safe_zone_updates[j];
        if (!su2.name) continue;
        var zone = findByName(worldMemory.safeZones, su2.name);
        if (zone && su2.note) {
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
    if (!update) return worldMemory;

    ASPIRATION_KEYS.forEach(function (key) {
      var entry = update[key];
      if (!entry) return;
      var asp = worldMemory.aspirations[key];
      if (typeof entry.progress_delta === 'number') {
        var delta = clampNum(entry.progress_delta, -20, 20);
        asp.progress = clampNum(asp.progress + delta, -100, 500);
      }
      if (entry.milestone_text) {
        asp.milestones.push({ text: truncateText(entry.milestone_text), day: currentDay });
        if (asp.milestones.length > 20) asp.milestones.splice(0, asp.milestones.length - 20);
      }
    });

    return worldMemory;
  }

  /* ---------- 關係系統：含5天硬性驗證 ---------- */
  function getOrCreateRelationship(worldMemory, npcName, currentDay) {
    if (!worldMemory.relationships[npcName]) {
      worldMemory.relationships[npcName] = {
        trust: 0,
        closeness: 0,
        romanticTension: 0,
        stage: 'incipient',
        stageEnteredDay: currentDay,
        milestones: []
      };
    }
    return worldMemory.relationships[npcName];
  }

  function canTransitionStage(rel, currentDay) {
    var daysInStage = currentDay - rel.stageEnteredDay;
    return daysInStage >= STAGE_MIN_DAYS;
  }

  function applyRelationshipUpdate(worldMemory, update, currentDay) {
    worldMemory = ensureShape(worldMemory);
    if (!update || !update.npc_name) return worldMemory;

    var rel = getOrCreateRelationship(worldMemory, update.npc_name, currentDay);

    if (typeof update.trust_delta === 'number') {
      rel.trust = clampNum(rel.trust + update.trust_delta, 0, 100);
    }
    if (typeof update.closeness_delta === 'number') {
      rel.closeness = clampNum(rel.closeness + update.closeness_delta, 0, 100);
    }
    if (typeof update.romantic_tension_delta === 'number') {
      rel.romanticTension = clampNum(rel.romanticTension + update.romantic_tension_delta, 0, 100);
    }

    if (update.stage_transition && STAGE_ORDER.indexOf(update.stage_transition) !== -1) {
      if (canTransitionStage(rel, currentDay)) {
        rel.stage = update.stage_transition;
        rel.stageEnteredDay = currentDay;
        if (update.note) {
          rel.milestones.push({ text: truncateText(update.note), day: currentDay, stage: update.stage_transition });
          if (rel.milestones.length > 15) rel.milestones.splice(0, rel.milestones.length - 15);
        }
      }
      // 若尚未滿5天，忽略此次階段轉換請求，但數值變化仍已套用（上方已處理）
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
        var statusMap = { alive: '存活', dead: '已死亡', missing: '失散', unknown: '狀態不明' };
        var statusText = statusMap[n.status] || n.status;
        return n.name + '（能力：' + (n.ability || '無特殊能力') + '，狀態：' + statusText + (n.relationshipNotes ? '，經歷：' + n.relationshipNotes : '') + '）';
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

    var aspirationLabels = { shelterBuilder: '庇護建設者', cureSeeker: '治療探索者', shadowHunter: '暗影獵人', factionLeader: '勢力締造者' };
    var aspirationTexts = ASPIRATION_KEYS.filter(function (key) {
      return worldMemory.aspirations[key].progress !== 0 || worldMemory.aspirations[key].milestones.length > 0;
    }).map(function (key) {
      var asp = worldMemory.aspirations[key];
      var latestMilestone = asp.milestones.length ? asp.milestones[asp.milestones.length - 1].text : '';
      return aspirationLabels[key] + '（進度' + asp.progress + (latestMilestone ? '，最新進展：' + latestMilestone : '') + '）';
    });
    if (aspirationTexts.length > 0) {
      parts.push('玩家志向發展： ' + aspirationTexts.join('； '));
    }

    var relNames = Object.keys(worldMemory.relationships);
    if (relNames.length > 0) {
      var stageLabels = {
        incipient: '初萌', developing: '漸深', critical_trial: '風險考驗',
        defining_choice: '關鍵抉擇', resolved_bond: '穩定結合', resolved_apart: '疏離懸置'
      };
      var relTexts = relNames.map(function (name) {
        var rel = worldMemory.relationships[name];
        var daysInStage = (typeof currentDay === 'number') ? (currentDay - rel.stageEnteredDay) : null;
        var canAdvance = (daysInStage !== null) ? (daysInStage >= STAGE_MIN_DAYS) : false;
        var latestMilestone = rel.milestones.length ? rel.milestones[rel.milestones.length - 1].text : '';
        return name + '（階段：' + (stageLabels[rel.stage] || rel.stage) + '，信任' + rel.trust + '，親密' + rel.closeness + '，浪漫張力' + rel.romanticTension +
          '，已於本階段' + (daysInStage !== null ? daysInStage : '?') + '天' + (canAdvance ? '，可推進下一階段' : '，尚未滿' + STAGE_MIN_DAYS + '天不可推進階段') +
          (latestMilestone ? '，最新事件：' + latestMilestone : '') + '）';
      });
      parts.push('人物關係記錄（階段轉換需已在目前階段停留至少' + STAGE_MIN_DAYS + '天，未達天數者請勿觸發stage_transition）： ' + relTexts.join('； '));
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
    STAGE_ORDER: STAGE_ORDER,
    STAGE_MIN_DAYS: STAGE_MIN_DAYS,
    BACKGROUND_EVOLUTION_INTERVAL: BACKGROUND_EVOLUTION_INTERVAL
  };
})();
