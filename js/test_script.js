if (typeof CONFIG === 'undefined') { var CONFIG = {}; }

CONFIG.TEST_SCRIPT = [
  {
    "narrative": "【測試回合 1：建立避難所與自動倉庫】\n你來到了一處廢棄的工廠。這裡地勢隱蔽，非常適合做為長期據點。你們清理了入口的喪屍，並決定將此地命名為「工廠避難所」。\n\n(💡 系統提示：請打開【👤 角色】確認安全區是否建立。接著打開【🎒 物品】介面，你會發現系統已經「自動」幫你開通了同名的基地倉庫！\n👉 請將身上的物資轉移進倉庫裡。)",
    "status_update": {
      "time_advance_minutes": 120,
      "stamina_change": -10,
      "current_location": "市郊工業區",
      "danger_level": "safe",
      "weather": "晴朗",
      "inventory_changes": [
        { "name": "軍用罐頭", "quantity": 5, "action": "add" },
        { "name": "過濾水", "quantity": 5, "action": "add" },
        { "name": "木材", "quantity": 10, "action": "add" },
        { "name": "廢鐵", "quantity": 10, "action": "add" },
        { "name": "雜物", "quantity": 5, "action": "add" }
      ]
    },
    "world_memory_update": {
      "new_safe_zone": {
        "name": "工廠避難所",
        "location": "市郊工業區",
        "population": 2,
        "facilities": []
      }
    },
    "options": [
      { "id": "A", "label": "已將物資放入倉庫，準備擴建", "risk_hint": "推進劇情", "risk_level": "low" },
      { "id": "B", "label": "不放物資，我想測試藍圖攔截與飢荒", "risk_hint": "高風險測試", "risk_level": "high" }
    ]
  },
  {
    "narrative": "【測試回合 2：藍圖攔截機制】\n你打算利用手邊的廢鐵，指導居民在工廠內部搭建「農場」與「集水」設施。有了這些設施，基地每天就能穩定產出生肉與過濾水了。\n\n(💡 系統提示：請注意畫面的綠色/紅色系統字體。如果你剛才有乖乖把材料放進倉庫，農場(需木材x2,廢鐵x1)和集水(需木材x1,雜物x1)就會蓋好，並扣除材料！如果沒放進倉庫，系統應該會無情地攔截建設。)",
    "status_update": {
      "time_advance_minutes": 240,
      "stamina_change": -15,
      "current_location": "市郊工業區",
      "danger_level": "safe",
      "weather": "微風",
      "inventory_changes": []
    },
    "world_memory_update": {
      "safe_zone_update": {
        "name": "工廠避難所",
        "population": 2,
        "facilities_add": ["農場", "集水"],
        "faction_relation_note": "基地的雛形已然建立。"
      }
    },
    "options": [
      { "id": "A", "label": "在基地深眠三天 (測試跨日結算)", "risk_hint": "時間大幅推進", "risk_level": "low" },
      { "id": "B", "label": "離開基地去探索 (測試跨日結算)", "risk_hint": "時間大幅推進", "risk_level": "medium" }
    ]
  },
  {
    "narrative": "【測試回合 3：時間流逝與快速旅行】\n整整三天的時間過去了。廢土的日夜交替，但你的基地依舊維持著運作。\n\n(💡 系統提示：你應該已經看到橘黃色的日結算報表了！\n\n👉 接下來，請關閉報表，打開【👤 角色】頁籤，點擊工廠避難所旁邊的「➔ 前往」按鈕。享受你全新的行前確認視窗與快速旅行吧！)\n\n※ 如果距離太近不扣體力，你可以先徒步去別的區域，再傳送回來測試。",
    "status_update": {
      "time_advance_minutes": 4320, 
      "stamina_change": 50,
      "current_location": "市郊工業區",
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
