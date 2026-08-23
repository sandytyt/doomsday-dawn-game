'use strict';

/*
 * world_memory.js
 * 獨立管理長期世界記憶：安全區、關鍵NPC、勢力歷史、重大事件。
 * 目的：取代原本形同虛設的 gameState.summary 字串，
 * 用結構化資料承載超出 recentTurns 滑動視窗的世界觀事實，
 * 避免長期遊玩後AI「忘記」主角建立的安全區、重要NPC等內容。
 *
 * 兩條獨立更新來源：
 * 1) world_memory_update：主角親身經歷或被明確告知的事件（由AI每回合視情況回報）
 * 2) background_evolution：不依賴主角在場，定期強制觸發的背景世界推演
 *
 * app.js 只需呼叫本檔案提供的函式，不需了解內部資料結構細節。
 */

var WorldMemory = (function () {

  var BACKGROUND_EVOLUTION_INTERVAL = 8; // 每隔多少回合強制觸發一次背景推演請求
  var MAX_SAFE_ZONES = 20;
  var MAX_NPCS = 40;
  var MAX_FACTION_HISTORY = 60;
  var MAX_MAJOR_EVENTS = 60;
  var TEXT_TRUNCATE_LENGTH = 200;

  function createInitial() {
    return {
      safeZones: [],
      keyNpcs: [],
      factionHistory: [],
      majorEvents: [],
      lastBackgroundEvolutionTurn: 0
    };
  }

  function ensureShape(worldMemory) {
    if (!worldMemory) return createInitial();
    if (!worldMemory.safeZones) worldMemory.safeZones = [];
    if (!worldMemory.keyNpcs) worldMemory.keyNpcs = [];
    if (!worldMemory.factionHistory) worldMemory.factionHistory = [];
    if (!worldMemory.majorEvents) worldMemory.majorEvents = [];
    if (typeof worldMemory.lastBackgroundEvolutionTurn !== 'number') worldMemory.lastBackgroundEvolutionTurn = 0;
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

  /* ---------- 主角見聞事件寫入（world_memory_update） ---------- */
  /*
   * update 結構（皆為選填，AI只在符合下列類型時才填）：
   * {
   *   new_safe_zone: { name, location, population, facilities: [] },
   *   safe_zone_update: { name, population, facilities_add: [], facilities_remove: [], faction_relation_note },
   *   npc_major_event: { name, ability, note, status },
   *   faction_shift: { faction, eventText },
   *   world_landmark: { eventText }
   * }
   */
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
  /*
   * evolution 結構（AI在被要求觸發時填寫，可為空陣列）：
   * {
   *   npc_updates: [ { name, note, status, ability } ],
   *   safe_zone_updates: [ { name, note } ],
   *   faction_updates: [ { faction, eventText } ]
   * }
   * 這些事件標記為背景發生，暫存於同一份資料結構，
   * 之後AI可透過劇情自然揭露給主角（傳聞、路人轉述等）。
   */
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

  /* ---------- 組裝要塞進AI提示詞的文字段落 ---------- */
  function buildWorldMemoryPrompt(worldMemory) {
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

    if (parts.length === 0) return '';
    return '【長期世界記憶，務必納入考量，不可忽略或遺忘】 ' + parts.join(' ');
  }

  return {
    createInitial: createInitial,
    ensureShape: ensureShape,
    applyWorldMemoryUpdate: applyWorldMemoryUpdate,
    applyBackgroundEvolution: applyBackgroundEvolution,
    shouldTriggerBackgroundEvolution: shouldTriggerBackgroundEvolution,
    buildWorldMemoryPrompt: buildWorldMemoryPrompt,
    BACKGROUND_EVOLUTION_INTERVAL: BACKGROUND_EVOLUTION_INTERVAL
  };
})();
