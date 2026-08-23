/* ============================================
   末日黎明：喪屍浩劫 — 個人化設定檔
   此檔案存放非機密的遊戲參數設定
   ============================================ */

const CONFIG = {

  // 使用的 Gemini 模型名稱
  // 2026/08實測：gemini-2.5-flash-lite 免費層每日僅20次(已大幅調降)
  // gemini-3.5-flash-lite / gemini-3.1-flash-lite 免費層每日500次，額度遠優於2.5系列，故改用此模型
  MODEL_NAME: 'gemini-3.5-flash-lite',

  // 開局初始體力/疲勇度數值上限
  INITIAL_STAMINA: 100,

  // 體力低於此百分比時，畫面觸發警示效果（對應 style.css 的 .low 樣式）
  STAMINA_LOW_THRESHOLD: 45,

  // 體力低於此百分比時，畫面觸發危急閃爍效果（對應 style.css 的 .critical 樣式）
  STAMINA_CRITICAL_THRESHOLD: 20,

  // 上下文保留的最近完整回合數量（超過會自動捨棄最舊的一筆，僅保留摘要）
  MAX_RECENT_TURNS: 5,

  /* ------------------------------------------
     測試模式設定
     啟用後，開局畫面會出現「離線測試模式」入口，
     不會呼叫真正的Gemini API，也不消耗任何配額，
     改用下方 TEST_SCRIPT 預設好的固定劇本，
     純粹用來驗證UI排版、按鈕互動、狀態欄更新等畫面邏輯。
     正式上線前，建議將 TEST_MODE_ENABLED 設為 false。
     ------------------------------------------ */

  TEST_MODE_ENABLED: true,

  // 測試模式的預設劇本，依序播放，格式與真正的AI回應JSON完全相同
  TEST_SCRIPT: [
    {
      narrative: '雨水順著破碎的招牌滴落，你躲在便利店的貨架後，聽著外頭拖行的腳步聲逐漸遠去。手電筒的電量只剩一半，貨架上散落著幾包過期的餅乾。這是你進入這座死城的第一個夜晚，四周只剩下風聲與偶爾傳來的、不屬於人類的低吼。',
      status_update: {
        time_advance_minutes: 30,
        stamina_change: -5,
        current_location: '廢棄便利店',
        danger_level: 'warning',
        weather: '暴雨',
        special_event: 'none'
      },
      options: [
        { id: 'A', label: '安靜地搜索貨架尋找補給品', risk_hint: '消耗少量體力，可能發現物資' },
        { id: 'B', label: '躲到收銀台後方等待天亮', risk_hint: '恢復少量體力，但會浪費時間' },
        { id: 'C', label: '從側門悄悄離開，尋找更安全的地方', risk_hint: '有遇敵風險' }
      ]
    },
    {
      narrative: '你的動作驚動了角落堆疊的鐵罐，刺耳的聲響在寂靜的店內迴盪。腳步聲瞬間停止，接著急速逼近。心跳聲蓋過了雨聲，你必須立刻做出反應——這是你在這座城市第一次真正感受到死亡的距離有多近。',
      status_update: {
        time_advance_minutes: 5,
        stamina_change: -10,
        current_location: '廢棄便利店',
        danger_level: 'critical',
        weather: '暴雨',
        humanity_change: 0,
        special_event: 'none'
      },
      options: [
        { id: 'A', label: '抓起手邊的鐵棍準備迎戰', risk_hint: '高風險，消耗大量體力' },
        { id: 'B', label: '衝向側門強行突破', risk_hint: '中風險，可能受傷但能脫離' },
        { id: 'C', label: '屏息躲進貨架夾層', risk_hint: '低風險，但可能被發現' }
      ]
    },
    {
      narrative: '在生死交關的瞬間，你的視野突然變得異常清晰，四肢傳來一股陌生卻熟悉的力量感，彷彿身體裡有什麼東西終於甦醒。那個畫面只持續了不到一秒，但已經足夠讓你避開致命的攻擊。你喘著氣，看著倒地的威脅，明白自己已經不再是原來的自己。',
      status_update: {
        time_advance_minutes: 10,
        stamina_change: -15,
        current_location: '廢棄便利店外街道',
        danger_level: 'warning',
        weather: '雨勢漸小',
        humanity_change: -2,
        special_event: 'awakening',
        special_event_text: '極限恐懼觸發了你體內潛藏的異變因子，某種未知的感知能力正在覺醒。'
      },
      options: [
        { id: 'A', label: '檢視自己身體的異狀', risk_hint: '' },
        { id: 'B', label: '趁機遠離現場，尋找棲身之所', risk_hint: '消耗剩餘體力' },
        { id: 'C', label: '(測試結束，此為離線腳本最後一輪)', risk_hint: '將重複播放第一輪' }
      ]
    }
  ]

  /* ------------------------------------------
     以下為選填：Notion 雲端同步設定
     若暫時不需要跨裝置同步存檔，保持留空即可，
     遊戲會自動僅使用瀏覽器本機儲存（localStorage）。
     ------------------------------------------ */
  ,
  NOTION_ENABLED: false,
  NOTION_PROXY_URL: '',
  NOTION_DATABASE_ID: ''

};
