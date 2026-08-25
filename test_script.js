// test_script.js
if (typeof CONFIG === 'undefined') { var CONFIG = {}; }

CONFIG.TEST_SCRIPT = [
  {
    "narrative": "【測試回合 1：開局與隊友加入】你從一間破舊的避難所中醒來，空氣中瀰漫著霉味。門口傳來腳步聲，名叫「愛麗絲」的倖存者走了進來，她遞給你一些補給品，並表示願意與你同行。",
    "status_update": {
      "time_advance_minutes": 30,
      "stamina_change": -5,
      "current_location": "破舊避難所",
      "danger_level": "safe",
      "weather": "陰天",
      "inventory_changes": [
        { "name": "軍用罐頭", "quantity": 2, "action": "add" },
        { "name": "烹煮的野味", "quantity": 1, "action": "add" }
      ],
      "companion_changes": [
        { "name": "愛麗絲", "action": "join" }
      ],
      "proficiency_triggered": ["scouting", "negotiation"],
      "injury_status": "none"
    },
    "options": [
      { "id": "A", "label": "詢問愛麗絲外面的情況", "risk_hint": "安全交談", "risk_level": "low" },
      { "id": "B", "label": "整理背包準備出發", "risk_hint": "耗費體力", "risk_level": "low" }
    ],
    "relationship_update": {
      "npc_name": "愛麗絲",
      "gender": "女性",
      "trust_delta": 10,
      "closeness_delta": 5,
      "romantic_tension_delta": 0,
      "note": "愛麗絲對你的警覺心降低了。"
    }
  },
  {
    "narrative": "【測試回合 2：遭遇危機與戰鬥】你們離開避難所不久，一隻變異喪屍從廢棄車輛後方撲了出來！你憑藉本能進行反擊，雖然擊退了牠，但你也受了輕傷，體力大幅消耗。",
    "status_update": {
      "time_advance_minutes": 45,
      "stamina_change": -40,
      "current_location": "廢棄街道",
      "danger_level": "warning",
      "weather": "微雨",
      "inventory_changes": [],
      "injury_status": "minor",
      "injury_detail": "手臂擦傷",
      "proficiency_triggered": ["combat", "agility"]
    },
    "options": [
      { "id": "A", "label": "在原地包紮傷口", "risk_hint": "可能引來更多喪屍", "risk_level": "medium" },
      { "id": "B", "label": "立刻逃離現場", "risk_hint": "高消耗", "risk_level": "medium" }
    ]
  },
  {
    "narrative": "【測試回合 3：瀕死與異能覺醒】危機並未解除，更多的喪屍將你們包圍。在千鈞一髮之際，你感覺到體內深處湧現出一股未知的熱流，強大的能量爆發開來，震退了周圍的敵人！",
    "status_update": {
      "time_advance_minutes": 10,
      "stamina_change": -30,
      "current_location": "廢棄街道",
      "danger_level": "critical",
      "weather": "大雨",
      "inventory_changes": [],
      "injury_status": "severe",
      "injury_detail": "失血過多",
      "special_event": "awakening",
      "special_event_text": "在生死關頭，你覺醒了未知的異能！"
    },
    "options": [
      { "id": "A", "label": "嘗試使用新力量突圍", "risk_hint": "未知風險", "risk_level": "high" },
      { "id": "B", "label": "掩護愛麗絲撤退", "risk_hint": "捨己為人", "risk_level": "high" }
    ]
  }
];
