/* ============================================
   末日黎明：喪屍浩劫 — 體格與異能系統 (proficiency.js)
   職責：儲存體格常數、背景加成計算與熟練度升級邏輯
   ============================================ */
'use strict';

// --- 常數設定 ---
var PROFICIENCY_CATEGORIES = ['combat', 'shooting', 'agility', 'scouting', 'medical', 'negotiation', 'searching', 'mechanics'];
var PROFICIENCY_LEVEL_THRESHOLDS = [0, 50, 150, 300, 500]; // 1-5級門檻

var PROFICIENCY_LABELS = {
  combat: '格鬥', shooting: '射擊', agility: '敏捷', scouting: '偵察',
  medical: '醫療', negotiation: '談判', searching: '搜索', mechanics: '機械'
};

var BACKGROUND_TYPE_PRESETS = {
  combat_survivor: { label: '搏擊倖存者（格鬥+2，射擊+1）', bonuses: { combat: 2, shooting: 1 } },
  healer_heart: { label: '醫者仁心（醫療+2，談判+1）', bonuses: { medical: 2, negotiation: 1 } },
  tinkerer: { label: '拆解匠（機械+2，搜索+1）', bonuses: { mechanics: 2, searching: 1 } },
  social_hand: { label: '交際手腕（談判+2，搜索+1）', bonuses: { negotiation: 2, searching: 1 } },
  wilderness_ranger: { label: '荒野遊俠（偵察+2，敏捷+1）', bonuses: { scouting: 2, agility: 1 } },
  generalist: { label: '一般背景（自選1-3項分類，共+3點）', isCustomizable: true, totalPoints: 3, minPicks: 1, maxPicks: 3 }
};

// --- 邏輯運算 ---
function getBackgroundBonuses(backgroundTypeKey, customPicks) {
  var preset = BACKGROUND_TYPE_PRESETS[backgroundTypeKey];
  if (!preset) return {};
  if (!preset.isCustomizable) return preset.bonuses;
  return customPicks || {};
}

function getProficiencyLevel(exp) {
  for (var i = PROFICIENCY_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= PROFICIENCY_LEVEL_THRESHOLDS[i]) return i + 1; // 0 是 1級，150 是 3級
  }
  return 1;
}

// 供 AI 回報時呼叫，增加熟練度 (每次成功判定 +15 EXP)
function applyProficiencyGrowth(entityProficiency, triggeredCategories) {
  if (!entityProficiency || !Array.isArray(triggeredCategories)) return;
  triggeredCategories.forEach(function(cat) {
    if (entityProficiency[cat] !== undefined) {
      entityProficiency[cat] = Math.min(entityProficiency[cat] + 15, PROFICIENCY_LEVEL_THRESHOLDS[PROFICIENCY_LEVEL_THRESHOLDS.length - 1]);
    }
  });
}