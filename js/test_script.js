if (typeof CONFIG === 'undefined') { var CONFIG = {}; }

CONFIG.TEST_SCRIPT = [
  {
    "narrative": "【測試回合 1：建立基地與自動倉庫】\n你來到了一處廢棄的工廠。這裡地勢隱蔽，非常適合做為長期基地。你們清理了入口的喪屍，並決定將此地命名為「工廠基地」。\n\n(💡 系統提示：請打開【👤 角色】確認基地是否建立。接著打開【🎒 物品】介面，你會發現系統已經「自動」幫你開通了同名的基地倉庫！\n👉 請將身上的物資轉移進倉庫裡。)",
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
        "name": "工廠基地",
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
        "name": "工廠基地",
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
    "narrative": "【測試回合 3：時間流逝與快速旅行】\n整整三天的時間過去了。廢土的日夜交替，但你的基地依舊維持著運作。\n\n(💡 系統提示：你應該已經看到橘黃色的日結算報表了！\n\n👉 接下來，請關閉報表，打開【👤 角色】頁籤，點擊工廠基地旁邊的「➔ 前往」按鈕。享受你全新的行前確認視窗與快速旅行吧！)\n\n※ 如果距離太近不扣體力，你可以先徒步去別的區域，再傳送回來測試。",
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
  },
  {
    "narrative": "【測試回合 1.5：NPC 入隊與進食驗證】\n一名倖存者「阿凱」加入了你的隊伍。他隨身帶著一些乾糧，但看起來已經有些飢餓。你們決定在基地稍作休息，讓阿凱自己找東西吃。\n\n(💡 系統提示：請打開【👥 隊員】面板，記下阿凱目前的「飽食度」數值。本回合結束後，若下一回合阿凱的飽食度有透過 npc_status_updates 上升，代表 AI 有正確依規則回報 NPC 進食；若飽食度完全沒變化或只靠系統自動衰減公式緩慢下降，代表 Bug #18 的假設成立——AI 沒有主動回報 NPC 進食事件。)",
    "status_update": {
      "time_advance_minutes": 60,
      "stamina_change": 0,
      "current_location": "市郊工業區",
      "danger_level": "safe",
      "weather": "晴朗",
      "companion_changes": [
        { "name": "阿凱", "action": "join" }
      ],
      "npc_status_updates": [
        {
          "name": "阿凱",
          "hunger_change": -10,
          "inventory_changes": [
            { "name": "乾糧", "quantity": 2, "action": "add" }
          ]
        }
      ]
    },
    "options": [
      { "id": "A", "label": "讓阿凱自行進食休息", "risk_hint": "觀察NPC是否自動進食", "risk_level": "low" },
      { "id": "B", "label": "直接分配食物給阿凱", "risk_hint": "手動測試對照組", "risk_level": "low" }
    ]
  },
  /* ===== 新增回合 B：接續驗證，AI 若正確回報，這裡應該看到阿凱飽食度回升 ===== */
  {
    "narrative": "【測試回合 1.6：NPC 進食結果回報】\n阿凱翻出隨身的乾糧，狼吞虎嚥地吃了起來，臉色也漸漸好轉。\n\n(💡 系統提示：請再次打開【👥 隊員】面板核對阿凱的飽食度。本回合 npc_status_updates 已模擬 AI「正確回報進食」的理想情境（inventory_changes 內 action:remove 乾糧、hunger_change 為正值）。這是用來對照：若正式遊玩時 AI 從未主動送出這種格式的回報，就能確認 Bug #18 出在 AI 未依規則觸發，而非程式碼邏輯本身處理不了這種回報。)",
    "status_update": {
      "time_advance_minutes": 30,
      "current_location": "市郊工業區",
      "danger_level": "safe",
      "weather": "晴朗",
      "npc_status_updates": [
        {
          "name": "阿凱",
          "hunger_change": 25,
          "inventory_changes": [
            { "name": "乾糧", "quantity": 1, "action": "remove" }
          ]
        }
      ]
    },
    "options": [
      { "id": "A", "label": "確認阿凱飽食度已回升，繼續測試", "risk_hint": "驗收成果", "risk_level": "low" },
      { "id": "B", "label": "跳過，直接進行藍圖攔截測試", "risk_hint": "跳過", "risk_level": "low" }
    ]
  },


  /* ============================================================
    下面這個回合請取代原本的「測試回合 3」，插入在其後方，
    新增「測試回合 4」以驗證 Bug #13（連續推進 5 天，觀察中間天數
    報表是否正確記錄）。
    ============================================================ */

  /* ===== 新增回合 C：驗證 Bug #13（多天報表記錄完整性）===== */

  {
    "narrative": "【測試回合 4：連續五天長期觀察】\n你決定讓阿凱留守基地，自己則外出執行一趟長達五天的偵察任務。\n\n(💡 系統提示：這是關鍵測試。time_advance_minutes 設定為 7200 分鐘（整整 5 天），基地在這 5 天內每天都會結算一次。\n👉 請觀察彈出的「日結算報表」：\n  1. 報表標題應顯示「經過 5 天」。\n  2. 若基地物資供應穩定（無死亡、無被襲），依原始邏輯只有「最後一天」的數據會顯示在報表卡片中，中間 4 天的生產/消耗細節不會個別列出。\n  3. 如果你認為應該要看到每一天的個別記錄（而非只有最後一天彙總），這就是 Bug #13 的實際影響：中間天數的報表資訊在跨多天時會被省略，只呈現首尾或有事件的天數。\n請截圖或記下報表實際顯示的天數卡片數量，回報給我核對是否符合你的預期。)",
    "status_update": {
      "time_advance_minutes": 7200,
      "current_location": "市郊工業區",
      "danger_level": "safe",
      "weather": "多雲轉晴",
      "injury_status": "none"
    },
    "options": [
      { "id": "A", "label": "報表顯示符合預期，結束測試", "risk_hint": "驗收成果", "risk_level": "low" },
      { "id": "B", "label": "報表遺漏了中間天數的細節", "risk_hint": "回報問題", "risk_level": "low" }
    ]
  }
];
