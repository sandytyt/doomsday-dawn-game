/* ============================================
   末日黎明：喪屍浩劫 — 載具系統測試劇本
   獨立於config.js，專門測試載具的取得、修復、
   耐久度、油量、貨艙容量、危險等級雙面效果、
   分頁動態顯示/隱藏等完整流程
   格式與真正的AI回應JSON完全相同
   ============================================ */

var TEST_SCRIPT = [
  {
    narrative: '你沿著廢棄的省道往前走，遠處一座傾頹的加油站映入眼簾。站內停著一輛皮卡，車頭引擎蓋半開，輪胎還算完整，只是佈滿塵土與蛛網。你末世前曾在修車廠打工三年，指尖幾乎是反射性地伸向那具引擎，心裡盤算著這輛車還有沒有救。',
    status_update: {
      time_advance_minutes: 20,
      stamina_change: -5,
      hunger_change: -2,
      current_location: '荒廢加油站',
      danger_level: 'safe',
      weather: '陰',
      injury_status: 'none',
      inventory_changes: [],
      vehicle_update: {},
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '檢查引擎，評估修復的可能性', risk_hint: '需要技工背景判定' },
      { id: 'B', label: '在加油站內搜索零件與工具', risk_hint: '可能找到修車用零件' },
      { id: 'C', label: '不理會這輛車，繼續趕路', risk_hint: '' }
    ]
  },
  {
    narrative: '憑藉著末世前的修車經驗，你花了將近一小時拆解、清潔、重新接上鬆脫的線路，又用隨身攜帶的零件補上缺損的部分。引擎在你轉動鑰匙的瞬間發出低沉的轟鳴聲，儘管聲音不太穩定，但這輛皮卡確實活過來了。你抹去額頭的汗水，看著這輛未來可能救你一命的鐵皮盒子。',
    status_update: {
      time_advance_minutes: 60,
      stamina_change: -15,
      hunger_change: -5,
      current_location: '荒廢加油站',
      danger_level: 'safe',
      weather: '陰',
      injury_status: 'none',
      inventory_changes: [
        { name: '汽車零件', quantity: 2, action: 'remove' }
      ],
      vehicle_update: {
        action: 'acquire',
        vehicle_name: '銹蝕皮卡',
        vehicle_tier: 'light_four_wheel'
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '在加油站周邊搜索燃料', risk_hint: '油量目前偏低' },
      { id: 'B', label: '將背包物資搬進貨艙後立刻上路', risk_hint: '測試貨艙存取' },
      { id: 'C', label: '先在附近觀察是否安全再出發', risk_hint: '' }
    ]
  },
  {
    narrative: '你在加油站後方的儲藏室翻出兩桶還算乾淨的柴油，小心翼翼地灌進油箱。油表指針緩緩爬升，引擎的運轉聲也變得更加平穩。你把找到的醫療用品與備用彈藥一併搬上貨艙，這輛皮卡的載貨空間比你想像中更寬敞，足以裝下不少物資。',
    status_update: {
      time_advance_minutes: 20,
      stamina_change: -8,
      hunger_change: -2,
      current_location: '荒廢加油站',
      danger_level: 'safe',
      weather: '陰',
      injury_status: 'none',
      inventory_changes: [
        { name: '醫療用品', quantity: 3, action: 'remove' },
        { name: '備用彈藥', quantity: 20, action: 'remove' }
      ],
      vehicle_update: {
        action: 'refuel',
        vehicle_name: '銹蝕皮卡',
        fuel_change: 45
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '駕車前往下一個安全區', risk_hint: '長途駕駛，消耗油量' },
      { id: 'B', label: '再次確認貨艙內的物資是否擺放妥當', risk_hint: '' },
      { id: 'C', label: '把剩下的醫療用品也一併裝上車', risk_hint: '測試貨艙cargo_change' }
    ]
  },
  {
    narrative: '你把剩餘的醫療用品也搬上貨艙，順手清點了一下——急救包、止痛藥、繃帶，整整齊齊地固定在車廂角落。做完這一切，你終於發動引擎，朝著記憶中那座安全區的方向駛去，輪胎碾過龜裂的柏油路面，揚起一陣塵土。',
    status_update: {
      time_advance_minutes: 10,
      stamina_change: -2,
      hunger_change: -1,
      current_location: '荒廢加油站',
      danger_level: 'safe',
      weather: '陰',
      injury_status: 'none',
      inventory_changes: [],
      vehicle_update: {
        action: 'cargo_change',
        vehicle_name: '銹蝕皮卡',
        cargo_changes: [
          { name: '急救包', quantity: 2, action: 'add' },
          { name: '止痛藥', quantity: 4, action: 'add' },
          { name: '繃帶', quantity: 5, action: 'add' }
        ]
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '沿主幹道長途駕駛前往安全區', risk_hint: '消耗大量油量與耐久度' },
      { id: 'B', label: '改走小路避開可能的喪屍群', risk_hint: '較安全但耗時較長' },
      { id: 'C', label: '停在路邊稍作休息', risk_hint: '' }
    ]
  },
  {
    narrative: '你選擇沿著主幹道全速前進，皮卡在坑洞遍布的路面上劇烈顛簸。轉過一個彎道時，你猛然發現前方聚集著一小群徘徊的喪屍——引擎的轟鳴聲顯然已經驚動了牠們。你來不及煞車，只能硬著頭皮從邊緣擦撞而過，車身傳來刺耳的金屬摩擦聲。',
    status_update: {
      time_advance_minutes: 15,
      stamina_change: -5,
      hunger_change: -2,
      current_location: '省道中段',
      danger_level: 'critical',
      weather: '陰',
      injury_status: 'none',
      inventory_changes: [],
      vehicle_update: {
        action: 'damage',
        vehicle_name: '銹蝕皮卡',
        durability_change: 25,
        fuel_change: 15
      },
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '不減速，強行衝出包圍圈', risk_hint: '持續消耗耐久度但能快速脫離' },
      { id: 'B', label: '緊急煞車評估車輛受損狀況', risk_hint: '可能被追上' },
      { id: 'C', label: '棄車徒步逃跑', risk_hint: '將失去這輛皮卡' }
    ]
  },
  {
    narrative: '你咬牙踩下油門，皮卡的引擎發出不堪負荷的怒吼，總算甩開了那群拖行而來的喪屍。夜色漸深，你把車停在一處視野開闊的空地，熄火後靜靜聆聽四周的動靜——只有風聲，沒有追兵。儀表板上的油量指針已經逼近底線，耐久度也在方才那陣衝撞中明顯下降，這輛皮卡撐不了太久了，你知道自己得盡快找地方好好整備。',
    status_update: {
      time_advance_minutes: 30,
      stamina_change: -10,
      hunger_change: -3,
      current_location: '省道旁空地',
      danger_level: 'warning',
      weather: '晴朗夜空',
      injury_status: 'none',
      inventory_changes: [],
      vehicle_update: {},
      special_event: 'none',
      special_event_text: ''
    },
    options: [
      { id: 'A', label: '檢查貨艙內的物資是否還完整', risk_hint: '' },
      { id: 'B', label: '在原地過夜，明天再繼續趕路', risk_hint: '' },
      { id: 'C', label: '（測試結束，此為離線腳本最後一輪）', risk_hint: '將重複播放第一輪' }
    ]
  }
];
