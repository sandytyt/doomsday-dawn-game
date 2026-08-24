/* ============================================
   末日黎明：喪屍浩劫 — 側邊面板改版端到端測試劇本
   涵蓋：NPC背景記錄累積(含篩選規則正反例)、暫存點存取、
   載具取得、手風琴多分類並存情境、可滾動驗證
   格式與真正的AI回應JSON完全相同
   ============================================ */

var TEST_SCRIPT = [
  {
    narrative: '雨水順著鏽蝕的鐵皮屋簷滴落，你在便利店後巷遇見了一名蜷縮在紙箱堆裡的年輕男子。他自稱林克，末世前是一名護理系學生，左腿因為逃亡時被鐵絲網劃傷，傷口已經開始發炎。他警戒地盯著你，手裡緊握一把生鏽的美工刀。',
    status_update: {
      time_advance_minutes: 15,
      stamina_change: -3,
      hunger_change: -2,
      current_location: '城北巷弄',
      danger_level: 'warning',
      weather: '小雨',
      injury_status: 'none',
      inventory_changes: [],
      companion_changes: [],
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '出示食物示好，嘗試建立信任', risk_hint: '低風險' },
      { id: 'B', label: '主動提出協助處理他的腿傷', risk_hint: '消耗醫療用品' },
      { id: 'C', label: '保持距離，先觀察對方意圖', risk_hint: '' }
    ]
  },
  {
    narrative: '你蹲下身，用隨身攜帶的醫療用品替林克清理左腿的傷口，動作雖然生疏，但足夠讓他放下戒心。他斷斷續續地說起自己在醫院實習時親眼目睹感染爆發的第一晚，聲音顫抖。這是你們第一次真正意義上的交談，他決定加入你的隊伍一同前行。',
    status_update: {
      time_advance_minutes: 20,
      stamina_change: -5,
      hunger_change: -2,
      current_location: '城北巷弄',
      danger_level: 'warning',
      weather: '小雨',
      injury_status: 'none',
      inventory_changes: [
        { name: '醫療用品', quantity: 1, action: 'remove' }
      ],
      companion_changes: [
        { name: '林克', action: 'join' }
      ],
      relationship_update: {
        npc_name: '林克',
        gender: '男性',
        trust_delta: 15,
        closeness_delta: 10,
        note: '協助處理腿傷並建立初步信任',
        background_note: '林克左腿撕裂傷已初步包紮但未完全痊癒；末世前為醫院護理系實習生，親眼目睹感染爆發首夜。'
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '詢問林克接下來的打算', risk_hint: '' },
      { id: 'B', label: '找個地方閒聊休息，讓彼此更熟悉', risk_hint: '測試日常閒聊不應記錄背景' },
      { id: 'C', label: '繼續趕路，尋找安全的落腳處', risk_hint: '' }
    ]
  },
  {
    narrative: '你們找了個相對乾燥的騎樓稍作休息，隨口聊了些末日前的瑣事——林克說他以前很愛喝手搖飲料，你則抱怨起雨天行動有多麻煩。氣氛輕鬆，但都只是無關緊要的閒聊，沒有觸及任何重要的過去或抉擇。',
    status_update: {
      time_advance_minutes: 30,
      stamina_change: 10,
      hunger_change: -3,
      current_location: '城北巷弄騎樓',
      danger_level: 'safe',
      weather: '雨勢漸小',
      injury_status: 'none',
      inventory_changes: [],
      relationship_update: {
        npc_name: '林克',
        trust_delta: 2,
        closeness_delta: 3,
        note: '日常閒聊，氣氛輕鬆',
        background_note: ''
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '把多餘的食物暫時藏在騎樓的通風管內', risk_hint: '測試暫存store' },
      { id: 'B', label: '檢查隨身背包還剩下什麼物資', risk_hint: '' },
      { id: 'C', label: '繼續往城北工業區前進', risk_hint: '' }
    ]
  },
  {
    narrative: '你把用不上的罐頭與一件多餘的外套塞進騎樓角落的通風管深處，用磚塊擋住入口做掩護，記下這個位置——「城北巷弄騎樓通風管」，打算日後有需要時再回來取用，輕裝上路能讓你們的腳步快上不少。',
    status_update: {
      time_advance_minutes: 10,
      stamina_change: -2,
      hunger_change: -1,
      current_location: '城北巷弄騎樓',
      danger_level: 'safe',
      weather: '雨停',
      injury_status: 'none',
      inventory_changes: [
        { name: '罐頭', quantity: 3, action: 'remove' },
        { name: '外套', quantity: 1, action: 'remove' }
      ],
      stash_update: {
        action: 'store',
        location_name: '城北巷弄騎樓通風管',
        items: [
          { name: '罐頭', quantity: 3 },
          { name: '外套', quantity: 1 }
        ]
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '前往城北工業區廢棄車間', risk_hint: '' },
      { id: 'B', label: '再次確認暫存位置是否隱蔽', risk_hint: '' },
      { id: 'C', label: '（測試暫存完成，繼續劇情）', risk_hint: '' }
    ]
  },
  {
    narrative: '你們抵達城北工業區時，天色已暗。一群喪屍從廢棄車間裡湧出，林克在混亂中被劃傷了手臂，你也在閃避時扭傷了腳踝。這是一場慘烈的遭遇戰，你們勉強擊退了喪屍群，但都掛了彩。共鳴烙印在你胸口隱隱作痛，一股陌生的力量似乎正在體內覺醒。',
    status_update: {
      time_advance_minutes: 25,
      stamina_change: -30,
      hunger_change: -5,
      current_location: '城北工業區廢棄車間',
      danger_level: 'critical',
      weather: '陰',
      humanity_change: 0,
      resonance_change: 100,
      injury_status: 'minor',
      injury_detail: [
        { part: '右腳踝', severity: 'minor' }
      ],
      inventory_changes: [],
      relationship_update: {
        npc_name: '林克',
        trust_delta: 10,
        closeness_delta: 8,
        note: '共同經歷遭遇戰，生死與共',
        background_note: '林克右臂在城北工業區遭遇戰中被喪屍劃傷，已簡單包紮，傷勢為輕度。'
      },
      special_event: 'awakening',
      special_event_text: '生死交關之際，你體內潛藏的異變因子被徹底激發，一股名為「共鳴感知」的能力就此覺醒。'
    },
    options: [
      { id: 'A', label: '嘗試感受這股新覺醒的力量', risk_hint: '' },
      { id: 'B', label: '檢查林克的傷勢並協助包紮', risk_hint: '測試NPC治療' },
      { id: 'C', label: '先確認四周是否還有殘留威脅', risk_hint: '' }
    ]
  },
  {
    narrative: '你翻找背包，取出僅剩的醫療用品替林克包紮手臂的傷口，血漬滲透紗布，但至少止住了持續的出血。他咬牙道謝，眼神裡多了幾分依賴與信任。你自己的腳踝也因為方才的包紮稍微舒緩了刺痛感。',
    status_update: {
      time_advance_minutes: 15,
      stamina_change: 5,
      hunger_change: -1,
      current_location: '城北工業區廢棄車間',
      danger_level: 'warning',
      weather: '陰',
      injury_status: 'minor',
      injury_detail: [
        { part: '右腳踝', severity: 'minor' }
      ],
      inventory_changes: [
        { name: '醫療用品', quantity: 1, action: 'remove' }
      ],
      relationship_update: {
        npc_name: '林克',
        trust_delta: 5,
        closeness_delta: 5,
        note: '協助包紮手臂傷勢',
        background_note: '林克右臂傷口已包紮處理，出血止住，仍需觀察是否感染。'
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '在車間內找到一輛拋錨的越野機車', risk_hint: '測試載具acquire' },
      { id: 'B', label: '先讓林克休息，觀察傷勢變化', risk_hint: '' },
      { id: 'C', label: '（測試繼續，準備觸發載具事件）', risk_hint: '' }
    ]
  },
  {
    narrative: '車間角落停著一輛積滿灰塵的越野機車，鑰匙還插在上頭。你憑著先前修復經驗檢查了一下油路與電瓶，狀況比想像中好，稍微調整後應該就能騎乘上路，這對接下來快速移動會有很大幫助。',
    status_update: {
      time_advance_minutes: 20,
      stamina_change: -8,
      hunger_change: -2,
      current_location: '城北工業區廢棄車間',
      danger_level: 'warning',
      weather: '陰',
      injury_status: 'minor',
      injury_detail: [
        { part: '右腳踝', severity: 'minor' }
      ],
      inventory_changes: [],
      vehicle_update: {
        action: 'acquire',
        vehicle_name: '灰塵越野機車',
        vehicle_tier: 'light_two_wheel'
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '打開側邊面板檢查物品／人物／載具是否正確顯示', risk_hint: '手動測試步驟' },
      { id: 'B', label: '返回城北巷弄取回先前暫存的物資', risk_hint: '測試暫存retrieve' },
      { id: 'C', label: '（測試腳本結束，將重複播放）', risk_hint: '' }
    ]
  },
  {
    narrative: '你們沿原路折返，摸黑找到先前藏放物資的通風管，磚塊還好端端地擋在原處沒有被動過。你搬開磚塊，取出當初留下的罐頭與外套，重新收進背包，準備繼續接下來的旅程。',
    status_update: {
      time_advance_minutes: 25,
      stamina_change: -6,
      hunger_change: -3,
      current_location: '城北巷弄騎樓',
      danger_level: 'safe',
      weather: '晴',
      injury_status: 'minor',
      injury_detail: [
        { part: '右腳踝', severity: 'minor' }
      ],
      inventory_changes: [
        { name: '罐頭', quantity: 3, action: 'add' },
        { name: '外套', quantity: 1, action: 'add' }
      ],
      stash_update: {
        action: 'retrieve',
        location_name: '城北巷弄騎樓通風管',
        items: [
          { name: '罐頭', quantity: 3 },
          { name: '外套', quantity: 1 }
        ]
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '確認暫存點已從清單中消失', risk_hint: '測試暫存清空自動移除' },
      { id: 'B', label: '檢查林克背景記錄是否可滾動查看', risk_hint: '手動測試步驟' },
      { id: 'C', label: '（測試腳本結束，此為最後一輪，將重複播放）', risk_hint: '' }
    ]
  }
];
