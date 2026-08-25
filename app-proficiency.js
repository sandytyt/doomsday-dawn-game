'use strict';

/**
 * 宣告八分類定義與熟練度資料
 */
var PROFICIENCY_CATEGORIES = ['combat', 'shooting', 'agility', 'scouting', 'medical', 'negotiation', 'searching', 'mechanics'];
var PROFICIENCY_LEVEL_THRESHOLDS = [0, 50, 150, 300, 500]; // 1-5級門檻

var BACKGROUND_TYPE_PRESETS = {
  combat_survivor: {
    label: '搏擊倖存者（格鬥+2，射擊+1）',
    bonuses: { combat: 2, shooting: 1 }
  },
  healer_heart: {
    label: '醫者仁心（醫療+2，談判+1）',
    bonuses: { medical: 2, negotiation: 1 }
  },
  tinkerer: {
    label: '拆解匠（機械+2，搜索+1）',
    bonuses: { mechanics: 2, searching: 1 }
  },
  social_hand: {
    label: '交際手腕（談判+2，搜索+1）',
    bonuses: { negotiation: 2, searching: 1 }
  },
  wilderness_ranger: {
    label: '荒野遊俠（偵察+2，敏捷+1）',
    bonuses: { scouting: 2, agility: 1 }
  },
  generalist: {
    label: '一般背景（自選1-3項分類，共+3點）',
    isCustomizable: true,
    totalPoints: 3,
    minPicks: 1,
    maxPicks: 3
  }
};

/**
 * 取得背景點數加成
 */
function getBackgroundBonuses(backgroundTypeKey, customPicks) {
  var preset = BACKGROUND_TYPE_PRESETS[backgroundTypeKey];
  if (!preset) return {};
  if (!preset.isCustomizable) return preset.bonuses;

  var picks = customPicks || [];
  var bonuses = {};
  if (picks.length === 1) {
    bonuses[picks[0]] = 3;
  } else if (picks.length === 2) {
    bonuses[picks[0]] = 2; // 第一個視為主要
    bonuses[picks[1]] = 1; // 第二個視為次要
  } else if (picks.length === 3) {
    picks.forEach(function (key) {
      bonuses[key] = 1;
    });
  }
  return bonuses;
}
