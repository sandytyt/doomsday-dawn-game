'use strict';

/*
 * test_script.js
 * 離線測試腳本：用來測試基地建立、藍圖建材攔截、日報表與快速旅行
 */

var testStep = 0;

window.playNextTestScript = function(playerAction) {
  console.log("【測試模式】收到玩家行動:", playerAction);
  
  var response = {};

  if (testStep === 0) {
    response = {
      narrative: "【系統測試：基地與移動機制】\n你醒來在「市郊工業區」的邊緣。前方有一座廢棄的工廠，結構完整，非常適合當作據點。\n\n💡 測試任務 1：\n請在下方輸入框輸入「清理工廠，建立名為『工廠基地』的安全區」。",
      status_updates: { current_location: "市郊工業區" }
    };
  } 
  else if (testStep === 1) {
    response = {
      narrative: "你清除了裡面的遊蕩者，用鐵網封死了大門。「工廠基地」正式成立！\n\n💡 檢查點：\n1. 打開【👤 角色】頁籤，確認「工廠基地」是否出現。\n2. 打開【🎒 物品】頁籤，確認是否自動開通了「工廠基地」的暫存點。\n\n💡 測試任務 2：\n請輸入「搜索建材」，我會發放建築材料給你。",
      world_memory_update: {
        new_safe_zone: { name: "工廠基地", location: "市郊工業區", population: 1, facilities: [] }
      }
    };
  }
  else if (testStep === 2) {
    response = {
      narrative: "你在附近找到了一大堆可用的建材，已經放進你的隨身背包！\n\n💡 測試任務 3：\n1. 打開【🎒 物品】頁籤，勾選「🔄 啟用物資轉移模式」。\n2. 將「木材、廢鐵、雜物」全部轉移到「工廠基地」暫存點裡。\n3. 轉移完成後，輸入「利用建材蓋一座農場與集水器」。",
      status_updates: {
        inventory_changes: [
          { name: "木材", quantity: 10, action: "add" },
          { name: "廢鐵", quantity: 10, action: "add" },
          { name: "雜物", quantity: 5, action: "add" }
        ]
      }
    };
  }
  else if (testStep === 3) {
    response = {
      narrative: "你開始照著藍圖敲敲打打...\n\n💡 檢查點：\n請注意畫面的綠色/紅色系統字體。如果你剛才有乖乖把材料放進倉庫，農場和集水器就會蓋好，並扣除材料！如果沒放進倉庫，系統應該會無情地攔截建設。\n\n💡 測試任務 4：\n請輸入「在基地睡覺度過3天」，我們來測試每日結算日報表。",
      world_memory_update: {
        // 嘗試蓋農場(需木材2,廢鐵1) 與 集水(木材1,雜物1)
        safe_zone_update: { name: "工廠基地", facilities_add: ["農場", "集水"] }
      }
    };
  }
  else if (testStep === 4) {
    response = {
      narrative: "時間飛逝... 這3天你的設施開始自動運轉，居民也消耗了糧食。\n\n💡 檢查點：\n畫面上應該會跳出【📻 避難所晨間匯報】，仔細看看產出與消耗！\n\n💡 測試任務 5：\n關閉日報後，請打開【👤 角色】頁籤，點擊工廠基地旁邊的「➔ 前往」按鈕。享受你全新的行前確認視窗與快速旅行吧！\n(如果距離太近不扣體力，你可以先徒步去「灰堡」，再傳送回來測試)",
      status_updates: { time_advance_minutes: 4320 } // 推進 3 天 (3 * 24 * 60 分鐘)
    };
  }
  else {
    // 捕獲所有其他的任意行動 (包含快速旅行後系統自動發送的到達提示)
    response = {
      narrative: "系統收到了行動/提示：「" + playerAction + "」。\n\n🎉 恭喜！各項測試應該已經圓滿完成！\n你可以繼續隨意點擊 UI 測試，或者重整頁面關閉測試模式，享受你完美重構的生存遊戲！",
      status_updates: { stamina_change: 0 }
    };
  }

  testStep++;

  // 模擬網路延遲 0.8 秒，讓 UI 的「輸入中...」動畫有時間播放
  setTimeout(function() {
    if (typeof handleAIResponse === 'function') {
      handleAIResponse(response);
    } else {
      console.error("找不到 handleAIResponse 函數！");
    }
    
    // 關閉輸入狀態
    if (typeof window.isWaitingForAI !== 'undefined') window.isWaitingForAI = false;
    if (typeof showTyping === 'function') showTyping(false);
  }, 800);
};
