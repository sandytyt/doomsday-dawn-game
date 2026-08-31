'use strict';

/*
 * app-schema.js
 * 職責：統一收斂 AI 回應資料的「正規化與防呆」邏輯。
 *
 * 【設計背景】
 * 目前 world_memory.js、app-api.js、app-engine.js 三個檔案裡，
 * 各自對 AI 回應的欄位做了大量重複、格式不一致的防呆判斷（原始碼中
 * 標註為「終極防呆」的區塊），例如：
 *   - new_safe_zone 可能是陣列，也可能是單一物件
 *   - safe_zone_update 可能是陣列，也可能是單一物件
 *   - world_memory_update 有時被多包一層在 update.world_memory_update 裡
 * 這些判斷邏輯分散在各檔案、各自維護，容易在新增欄位時漏改其中一處。
 *
 * 本檔案不改變任何既有欄位的合法值或行為，只是把「判斷格式、決定要不要
 * 採用某個值」的邏輯抽成獨立、可測試、可重用的函式，讓 world_memory.js、
 * app-api.js、app-engine.js 未來都能直接呼叫這裡的函式，不用各自重寫
 * 一遍防呆判斷。
 *
 * 【使用方式】
 * <script src="js/app-schema.js"></script> 需放在 world_memory.js 之前，
 * 因為 world_memory.js 之後會改為呼叫本檔案提供的正規化函式。
 */

var AppSchema = (function () {

  /* ---------- 基礎工具：陣列/單一物件正規化 ---------- */

  // 【對應原邏輯】new_safe_zone、safe_zone_update 等欄位，AI 有時回傳
  // 單一物件，有時回傳陣列。此函式統一轉換為陣列，方便呼叫端用同一套
  // forEach/for 迴圈處理，不用每個欄位各寫一次 Array.isArray 判斷。
  // requiredKey：物件必須含有此屬性才視為有效（例如 'name'）。
  function normalizeToArray(value, requiredKey) {
    if (Array.isArray(value)) {
      if (!requiredKey) return value.slice();
      return value.filter(function (item) {
        return item && Object.prototype.hasOwnProperty.call(item, requiredKey);
      });
    }
    if (value && (!requiredKey || Object.prototype.hasOwnProperty.call(value, requiredKey))) {
      return [value];
    }
    return [];
  }

  // 【對應原邏輯】world_memory.js 的 applyWorldMemoryUpdate() 開頭：
  // 「如果傳進來的 update 其實被包在 world_memory_update 屬性裡，就解開它」
  // 統一抽成函式，避免同類判斷邏輯散落在多個檔案各寫一次。
  function unwrapNestedUpdate(update, wrapperKey) {
    if (update && update[wrapperKey]) {
      return update[wrapperKey];
    }
    return update;
  }

  /* ---------- 列舉值防呆 ---------- */

  var VALID_DANGER_LEVELS = ['safe', 'warning', 'critical'];
  var VALID_INJURY_STATUSES = ['none', 'minor', 'severe'];
  var VALID_SPECIAL_EVENTS = ['none', 'awakening', 'multi_awakening', 'death', 'rescued', 'level_up'];
  var VALID_COMPANION_ACTIONS = ['join', 'leave', 'die'];
  var VALID_NPC_STATUSES = ['alive', 'dead', 'missing', 'unknown'];
  var VALID_INVENTORY_ACTIONS = ['add', 'remove', 'add_weapon'];
  var VALID_PROFICIENCY_KEYS = [
    'combat', 'shooting', 'agility', 'scouting',
    'medical', 'negotiation', 'searching', 'mechanics'
  ];
  var VALID_ASPIRATION_KEYS = [
    'shelterBuilder', 'cureSeeker', 'shadowHunter', 'factionLeader'
  ];
  var VALID_RELATIONSHIP_STAGES = [
    'acquainted', 'incipient', 'developing',
    'critical_trial', 'defining_choice', 'resolved_bond', 'resolved_apart'
  ];

  // 通用列舉值檢查：值不在白名單內時，回傳 fallback 並印出警告，
  // 避免 AI 偶爾回傳格式錯誤的字串時，髒資料直接寫進 gameState。
  function coerceEnum(value, validList, fallback, warnLabel) {
    if (validList.indexOf(value) !== -1) return value;
    if (value !== undefined && value !== null && value !== '') {
      console.warn('[AppSchema] 偵測到不合法的 ' + warnLabel + ' 值：' + value + '，已忽略。');
    }
    return fallback;
  }

  var VALID_ELEMENTS = ['金', '木', '水', '火', '土', '電', '狂化'];

  /* ---------- status_update 正規化 ---------- */

  // 【對應原邏輯】app-engine.js 的 applyStatusUpdate() 開頭一連串
  // typeof/存在性判斷。這裡不改變任何欄位的套用行為，只負責把
  // AI 回應清洗成一份「型別保證正確」的物件，讓 applyStatusUpdate()
  // 之後可以放心讀取，不需要重複寫 typeof 檢查。
  function normalizeStatusUpdate(rawUpdate) {
    var u = rawUpdate || {};

    return {
      time_advance_minutes: typeof u.time_advance_minutes === 'number' ? u.time_advance_minutes : 0,
      current_location: typeof u.current_location === 'string' ? u.current_location : '',
      weather: typeof u.weather === 'string' ? u.weather : '',
      danger_level: u.danger_level ? coerceEnum(u.danger_level, VALID_DANGER_LEVELS, null, 'danger_level') : null,

      stamina_change: typeof u.stamina_change === 'number' ? u.stamina_change : 0,
      hunger_change: typeof u.hunger_change === 'number' ? u.hunger_change : 0,
      humanity_change: typeof u.humanity_change === 'number' ? u.humanity_change : 0,
      resonance_change: typeof u.resonance_change === 'number' ? u.resonance_change : 0,
      ability_exp_change: typeof u.ability_exp_change === 'number' ? u.ability_exp_change : 0,

      injury_status: u.injury_status ? coerceEnum(u.injury_status, VALID_INJURY_STATUSES, null, 'injury_status') : null,
      injury_detail: typeof u.injury_detail === 'string' ? u.injury_detail : '',

      faction_trust_update: (u.faction_trust_update && typeof u.faction_trust_update === 'object')
        ? u.faction_trust_update
        : null,

      inventory_changes: normalizeInventoryChanges(u.inventory_changes),
      companion_changes: normalizeCompanionChanges(u.companion_changes),
      npc_status_updates: normalizeNpcStatusUpdates(u.npc_status_updates),
      proficiency_triggered: normalizeProficiencyKeys(u.proficiency_triggered),

      vehicle_update: (u.vehicle_update && u.vehicle_update.action) ? u.vehicle_update : null,
      stash_update: (u.stash_update && u.stash_update.action) ? u.stash_update : null,

      special_event: u.special_event ? coerceEnum(u.special_event, VALID_SPECIAL_EVENTS, 'none', 'special_event') : 'none',
      special_event_text: typeof u.special_event_text === 'string' ? u.special_event_text : '',
      awakened_element: u.awakened_element ? coerceEnum(u.awakened_element, VALID_ELEMENTS, null, 'awakened_element') : null
    };
  }

  // 【對應原邏輯】inventory_changes 陣列裡每一項的 action 欄位防呆。
  // 原本沒有檢查 action 是否合法，這裡加上白名單過濾，
  // 過濾掉的項目會印出警告，方便你在 console 抓到 AI 回傳異常格式。
  function normalizeInventoryChanges(rawChanges) {
    if (!Array.isArray(rawChanges)) return [];
    return rawChanges
      .filter(function (c) { return c && c.name; })
      .map(function (c) {
        return {
          name: c.name,
          quantity: typeof c.quantity === 'number' && c.quantity > 0 ? c.quantity : 1,
          action: coerceEnum(c.action, VALID_INVENTORY_ACTIONS, 'add', 'inventory_changes.action')
        };
      });
  }

  // 【對應原邏輯】companion_changes 陣列裡每一項的 action 欄位防呆。
  function normalizeCompanionChanges(rawChanges) {
    if (!Array.isArray(rawChanges)) return [];
    return rawChanges
      .filter(function (c) { return c && c.name; })
      .map(function (c) {
        return {
          name: c.name,
          action: coerceEnum(c.action, VALID_COMPANION_ACTIONS, null, 'companion_changes.action')
        };
      })
      .filter(function (c) { return c.action !== null; });
  }

  // 【對應原邏輯】npc_status_updates 陣列的巢狀防呆（每個 NPC 又各自帶
  // injury_status、inventory_changes、proficiency_triggered）。
  function normalizeNpcStatusUpdates(rawUpdates) {
    if (!Array.isArray(rawUpdates)) return [];
    return rawUpdates
      .filter(function (nu) { return nu && nu.name; })
      .map(function (nu) {
        return {
          name: nu.name,
          stamina_change: typeof nu.stamina_change === 'number' ? nu.stamina_change : 0,
          hunger_change: typeof nu.hunger_change === 'number' ? nu.hunger_change : 0,
          injury_status: nu.injury_status ? coerceEnum(nu.injury_status, VALID_INJURY_STATUSES, null, 'npc_status_updates.injury_status') : null,
          injury_detail: typeof nu.injury_detail === 'string' ? nu.injury_detail : '',
          inventory_changes: normalizeInventoryChanges(nu.inventory_changes),
          proficiency_triggered: normalizeProficiencyKeys(nu.proficiency_triggered)
        };
      });
  }

  // 【對應原邏輯】proficiency_triggered 陣列的 key 白名單過濾。
  function normalizeProficiencyKeys(rawKeys) {
    if (!Array.isArray(rawKeys)) return [];
    return rawKeys.filter(function (k) {
      return VALID_PROFICIENCY_KEYS.indexOf(k) !== -1;
    });
  }

  /* ---------- world_memory_update 正規化 ---------- */

  // 【對應原邏輯】world_memory.js 的 applyWorldMemoryUpdate() 開頭：
  // 解開 world_memory_update 巢狀包裝、把 new_safe_zone/safe_zone_update
  // 統一轉為陣列。這裡把整份 update 一次性清洗完成，world_memory.js
  // 之後只需要走訪清洗後的陣列，不需要重複判斷格式。
  function normalizeWorldMemoryUpdate(rawUpdate) {
    if (!rawUpdate) return null;
    var update = unwrapNestedUpdate(rawUpdate, 'world_memory_update');

    return {
      newSafeZones: normalizeToArray(update.new_safe_zone, 'name'),
      safeZoneUpdates: normalizeToArray(update.safe_zone_update, 'name'),
      npcMajorEvent: (update.npc_major_event && update.npc_major_event.name) ? update.npc_major_event : null,
      factionShift: (update.faction_shift && update.faction_shift.faction) ? update.faction_shift : null,
      worldLandmark: (update.world_landmark && update.world_landmark.eventText) ? update.world_landmark : null
    };
  }

  // 【對應原邏輯】background_evolution 欄位的陣列防呆
  // （npc_updates / safe_zone_updates / faction_updates）。
  function normalizeBackgroundEvolution(rawEvolution) {
    if (!rawEvolution) return null;
    return {
      npcUpdates: Array.isArray(rawEvolution.npc_updates)
        ? rawEvolution.npc_updates.filter(function (nu) { return nu && nu.name; })
        : [],
      safeZoneUpdates: Array.isArray(rawEvolution.safe_zone_updates)
        ? rawEvolution.safe_zone_updates.filter(function (su) { return su && su.name; })
        : [],
      factionUpdates: Array.isArray(rawEvolution.faction_updates)
        ? rawEvolution.faction_updates.filter(function (fu) { return fu && fu.faction; })
        : []
    };
  }

  // 【對應原邏輯】aspiration_update 的 key 白名單過濾與 progress_delta
  // 數值範圍檢查（原本這段 clamp 邏輯寫在 world_memory.js 內部，
  // 這裡只負責過濾非法 key，實際 clamp 仍交由 world_memory.js 處理，
  // 避免搬動太多數值運算邏輯到 schema 層）。
  function normalizeAspirationUpdate(rawUpdate) {
    if (!rawUpdate) return null;
    var result = {};
    VALID_ASPIRATION_KEYS.forEach(function (key) {
      if (rawUpdate[key]) result[key] = rawUpdate[key];
    });
    return Object.keys(result).length > 0 ? result : null;
  }

  // 【對應原邏輯】relationship_update 的 npc_name 必填檢查與
  // stage_transition 白名單檢查。
  function normalizeRelationshipUpdate(rawUpdate) {
    if (!rawUpdate || !rawUpdate.npc_name) return null;
    var result = {
      npc_name: rawUpdate.npc_name,
      gender: typeof rawUpdate.gender === 'string' ? rawUpdate.gender : '',
      trust_delta: typeof rawUpdate.trust_delta === 'number' ? rawUpdate.trust_delta : 0,
      closeness_delta: typeof rawUpdate.closeness_delta === 'number' ? rawUpdate.closeness_delta : 0,
      romantic_tension_delta: typeof rawUpdate.romantic_tension_delta === 'number' ? rawUpdate.romantic_tension_delta : 0,
      note: typeof rawUpdate.note === 'string' ? rawUpdate.note : '',
      background_note: typeof rawUpdate.background_note === 'string' ? rawUpdate.background_note : ''
    };
    if (rawUpdate.stage_transition && VALID_RELATIONSHIP_STAGES.indexOf(rawUpdate.stage_transition) !== -1) {
      result.stage_transition = rawUpdate.stage_transition;
    }
    return result;
  }

  /* ---------- 公開介面 ---------- */

  return {
    // 基礎工具（保留公開，未來若有新欄位需要同類正規化可直接複用）
    normalizeToArray: normalizeToArray,
    unwrapNestedUpdate: unwrapNestedUpdate,
    coerceEnum: coerceEnum,

    // 主要入口：三大類 AI 回應資料的正規化
    normalizeStatusUpdate: normalizeStatusUpdate,
    normalizeWorldMemoryUpdate: normalizeWorldMemoryUpdate,
    normalizeBackgroundEvolution: normalizeBackgroundEvolution,
    normalizeAspirationUpdate: normalizeAspirationUpdate,
    normalizeRelationshipUpdate: normalizeRelationshipUpdate,

    // 白名單常數（供其他檔案需要時直接引用，避免各自重複宣告）
    VALID_DANGER_LEVELS: VALID_DANGER_LEVELS,
    VALID_INJURY_STATUSES: VALID_INJURY_STATUSES,
    VALID_SPECIAL_EVENTS: VALID_SPECIAL_EVENTS,
    VALID_COMPANION_ACTIONS: VALID_COMPANION_ACTIONS,
    VALID_NPC_STATUSES: VALID_NPC_STATUSES,
    VALID_INVENTORY_ACTIONS: VALID_INVENTORY_ACTIONS,
    VALID_PROFICIENCY_KEYS: VALID_PROFICIENCY_KEYS,
    VALID_ASPIRATION_KEYS: VALID_ASPIRATION_KEYS,
    VALID_RELATIONSHIP_STAGES: VALID_RELATIONSHIP_STAGES,
    VALID_ELEMENTS: VALID_ELEMENTS
  };

})();
