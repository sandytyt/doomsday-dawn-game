if (typeof CONFIG === 'undefined') { var CONFIG = {}; }

CONFIG.TEST_SCRIPT = [
  {
    "narrative": "【測試回合 1：建立避難所與獲取物資】\n你與愛麗絲來到了一處廢棄的銅礦坑。這裡地勢隱蔽，非常適合做為長期據點。你們清理了入口的喪屍，並決定將此地命名為「銅礦避難所」。\n\n(💡 系統提示：請打開「角色檔案」確認安全區是否建立。接著打開「物品」介面，勾選「啟用物資轉移模式」，將你剛獲得的罐頭與水存入「暫存點：銅礦避難所」，為明天的結算做準備！)",
    "status_update": {
      "time_advance_minutes": 120,
      "stamina_change": -10,
      "current_location": "廢棄銅礦",
      "danger_level": "safe",
      "weather": "晴朗",
      "inventory_changes": [
        { "name": "軍用罐頭", "quantity": 5, "action": "add" },
        { "name": "過濾水", "quantity": 5, "action": "add" },
        { "name": "廢鐵", "quantity": 10, "action": "add" }
      ]
    },
    "world_memory_update": {
      "new_safe_zone": {
        "name": "銅礦避難所",
        "location": "廢棄銅礦",
        "population": 2,
        "facilities": ["基礎防禦", "拾荒"]
      }
    },
    "options": [
      { "id": "A", "label": "已將物資放入倉庫，準備擴建", "risk_hint": "推進劇情", "risk_level": "low" },
      { "id": "B", "label": "不放物資，我想測試飢荒懲罰", "risk_hint": "高風險測試", "risk_level": "high" }
    ]
  },
  {
    "narrative": "【測試回合 2：設施升級與勞動力配置】\n你利用手邊的廢鐵，指導避難所的居民在礦坑內部搭建了簡易的「農場」與「集水」設施。有了這些設施，基地每天就能穩定產出生肉與過濾水了。\n\n(💡 系統提示：現在基地有「拾荒」、「農場」、「集水」3座設施，但人口只有 2 人。明天的結算將會測試「勞動力不足」的停工機制。)",
    "status_update": {
      "time_advance_minutes": 240,
      "stamina_change": -15,
      "current_location": "廢棄銅礦",
      "danger_level": "safe",
      "weather": "微風",
      "inventory_changes": [
        { "name": "廢鐵", "quantity": 10, "action": "remove" }
      ]
    },
    "world_memory_update": {
      "safe_zone_update": {
        "name": "銅礦避難所",
        "population": 2,
        "facilities_add": ["農場", "集水"],
        "faction_relation_note": "基地的雛形已然建立。"
      }
    },
    "options": [
      { "id": "A", "label": "在基地深眠兩天 (測試跨日結算)", "risk_hint": "時間大幅推進", "risk_level": "low" },
      { "id": "B", "label": "離開基地去探索 (測試跨日結算)", "risk_hint": "時間大幅推進", "risk_level": "medium" }
    ]
  },
  {
    "narrative": "【測試回合 3：時間流逝與基地日結算】\n整整兩天的時間過去了。廢土的日夜交替，但你的基地依舊維持著運作。每天早上 06:00，基地的無線電都會準時傳來晨間匯報。\n\n(💡 系統提示：你應該已經看到橘黃色的「📻 避難所晨間匯報」彈出！請檢查居民是否正確消耗了食物？農場是否有產出？如果有設施因為人數不足而停工，報表上也會顯示警告。)",
    "status_update": {
      "time_advance_minutes": 2880, 
      "stamina_change": 50,
      "current_location": "廢棄銅礦",
      "danger_level": "safe",
      "weather": "陰天",
      "inventory_changes": [],
      "injury_status": "none"
    },
    "options": [
      { "id": "A", "label": "打開基地倉庫查看盈餘", "risk_hint": "驗收成果", "risk_level": "low" },
      { "id": "B", "label": "繼續推進測試", "risk_hint": "結束", "risk_level": "low" }
    ]
  }
];
