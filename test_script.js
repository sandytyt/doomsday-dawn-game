/* ============================================
   末日黎明：喪屍浩劫 — 離線測試劇本
   獨立於config.js，方便日後擴充更多測試情境
   格式與真正的AI回應JSON完全相同
   ============================================ */

var TEST_SCRIPT = [
  {
    narrative: '雨水順著破碎的招牌滴落，你躲在便利店的貨架後，聽著外頭拖行的腳步聲逐漸遠去。手電筒的電量只剩一半，貨架上散落著幾包過期的餅乾。這是你進入這座死城的第一個夜晚，四周只剩下風聲與偶爾傳來的、不屬於人類的低吼。',
    status_update: {
      time_advance_minutes: 30,
      stamina_change: -5,
      hunger_change: -3,
      current_location: '廢棄便利店',
      danger_level: 'warning',
      weather: '暴雨',
      injury_status: 'none',
      inventory_changes: [],
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '安靜地搜索貨架尋找補給品', risk_hint: '消耗少量體力，可能發現物資' },
      { id: 'B', label: '躲到收銀台後方等待天亮', risk_hint: '恢復少量體力，但會浪費時間' },
      { id: 'C', label: '從側門悄悄離開，尋找更安全的地方', risk_hint: '有遇敵風險' }
    ]
  },
  {
    narrative: '你翻開最底層的貨架，在一堆碎玻璃與過期罐頭中找到了一個急救包和半瓶礦泉水，角落還躺著一把生鏽但堪用的鐵撬。這些東西或許能在接下來的日子裡救你一命。你把它們仔細收進背包，動作放得極輕，不敢發出多餘的聲響。',
    status_update: {
      time_advance_minutes: 15,
      stamina_change: -3,
      hunger_change: -2,
      current_location: '廢棄便利店',
      danger_level: 'warning',
      weather: '暴雨',
      injury_status: 'none',
      inventory_changes: [
        { name: '急救包', quantity: 1, action: 'add' },
        { name: '礦泉水', quantity: 1, action: 'add' },
        { name: '鐵撬', quantity: 1, action: 'add' }
      ],
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '繼續搜索店內其他角落', risk_hint: '可能有更多物資，但延長停留時間' },
      { id: 'B', label: '喝一口礦泉水緩解口渴後離開', risk_hint: '消耗庫存但恢復飢餓值' },
      { id: 'C', label: '立刻離開，天快亮了', risk_hint: '' }
    ]
  },
  {
    narrative: '你的動作驚動了角落堆疊的鐵罐，刺耳的聲響在寂靜的店內迴盪。腳步聲瞬間停止，接著急速逼近。心跳聲蓋過了雨聲，你必須立刻做出反應——這是你在這座城市第一次真正感受到死亡的距離有多近。',
    status_update: {
      time_advance_minutes: 5,
      stamina_change: -8,
      hunger_change: 0,
      current_location: '廢棄便利店',
      danger_level: 'critical',
      weather: '暴雨',
      injury_status: 'none',
      inventory_changes: [],
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '掏出鐵撬準備迎戰', risk_hint: '高風險，消耗大量體力' },
      { id: 'B', label: '衝向側門強行突破', risk_hint: '中風險，可能受傷但能脫離' },
      { id: 'C', label: '屏息躲進貨架夾層', risk_hint: '低風險，但可能被發現' }
    ]
  },
  {
    narrative: '鐵撬狠狠砸中對方的頭骨，濺出的黑色體液中夾雜著一小塊透明結晶，隨著屍體倒地滾落到你腳邊。你彎腰拾起，那東西冰涼透明，內部彷彿有極微弱的光點在流動，與你聽過的傳聞描述一致——這是喪屍腦內的晶核，尚未變異的最原始型態。你的手臂傳來一陣刺痛，方才那一下攻擊似乎受了輕傷。',
    status_update: {
      time_advance_minutes: 10,
      stamina_change: -20,
      hunger_change: -2,
      current_location: '廢棄便利店外街道',
      danger_level: 'warning',
      weather: '雨勢漸小',
      injury_status: 'minor',
      inventory_changes: [
        { name: '透明晶核', quantity: 1, action: 'add' }
      ],
      special_event: 'none'
    },
    options: [
      { id: 'A', label: '檢視手臂的傷勢', risk_hint: '' },
      { id: 'B', label: '趁機遠離現場，尋找棲身之所', risk_hint: '消耗剩餘體力' },
      { id: 'C', label: '搜索屍體周圍是否還有其他物資', risk_hint: '延長暴露時間' }
    ]
  },
  {
    narrative: '在生死交關的瞬間，你的視野突然變得異常清晰，四肢傳來一股陌生卻熟悉的力量感，彷彿身體裡有什麼東西終於甦醒。那個畫面只持續了不到一秒，但已經足夠讓你避開致命的攻擊。你喘著氣，看著倒地的威脅，明白自己已經不再是原來的自己。',
    status_update: {
      time_advance_minutes: 10,
      stamina_change: -15,
      hunger_change: -1,
      current_location: '廢棄便利店外街道',
      danger_level: 'warning',
      weather: '雨勢漸小',
      humanity_change: -2,
      resonance_change: 100,
      injury_status: 'minor',
      inventory_changes: [],
      special_event: 'awakening',
      special_event_text: '極限恐懼觸發了你體內潛藏的異變因子，某種未知的感知能力正在覺醒。'
    },
    options: [
      { id: 'A', label: '嘗試感受這股新力量', risk_hint: '' },
      { id: 'B', label: '趁機遠離現場，尋找棲身之所', risk_hint: '消耗剩餘體力' },
      { id: 'C', label: '（測試結束，此為離線腳本最後一輪）', risk_hint: '將重複播放第一輪' }
    ]
  }
];
