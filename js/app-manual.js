'use strict';

// 1. 將手冊的 HTML 結構封裝為字串 (同時修復了基地分頁的 ID 衝突與按鈕)
window.MANUAL_TEMPLATE = `
  <div class="modal-content" style="max-width: 800px; width: 90%; height: 80vh; padding: 0; display: flex; flex-direction: column; background: #121212; border: 1px solid #333;">
    
    <!-- 手冊標題列 -->
    <div style="padding: 15px 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background: #1a1a1a;">
      <h2 style="margin: 0; font-size: 1.2em; color: #e0e0e0;">📖 倖存者生存指南</h2>
      <button id="manual-close-btn" style="background: transparent; border: none; color: #888; font-size: 1.5em; cursor: pointer;">&times;</button>
    </div>

    <!-- 手冊主體 (雙欄佈局) -->
    <div class="manual-body">
      
      <!-- 左側 / 上方 頁籤選單 -->
      <div class="manual-tabs">
        <button class="manual-tab-btn active" data-target="manual-survival">生存機制</button>
        <button class="manual-tab-btn" data-target="manual-base">基地運作</button>
        <button class="manual-tab-btn" data-target="manual-inventory">探索與物資</button>
        <button class="manual-tab-btn" data-target="manual-combat">戰鬥與體格</button>
        <button class="manual-tab-btn" data-target="manual-npc">同行者與陣營</button>
        <button class="manual-tab-btn" data-target="manual-vehicle">載具系統</button>
      </div>

      <!-- 右側 / 下方 內容區 -->
      <div class="manual-content-container">
        
        <!-- 分頁：生存機制 -->
        <div id="manual-survival" class="manual-pane">
          <h3 style="color: #4a90e2; margin-top: 0;">體力與飢餓</h3>
          <p>在這個末世，你的體力決定了你能走多遠。每一次行動（如搜索、戰鬥、趕路）都會消耗體力。當體力低於 20 時，你將無法奔跑，甚至可能在危機中暈厥。</p>
          <ul>
            <li><strong>飢餓枷鎖：</strong>飢餓度會隨時間自然下降。若飢餓低於 40%，你的體力最高只能恢復到 70%；低於 15% 時，每回合更會額外流失體力。</li>
            <li><strong>恢復體力：</strong>在安全的據點深眠可大幅恢復，臨時假寐則只能恢復少許。吃飽肚子是保持體力的關鍵。</li>
          </ul>
          <h3 style="color: #4a90e2;">廢土食物字典</h3>
          <ul>
            <li><strong>軍用罐頭：</strong>+35 飽食 / +20 體力</li>
            <li><strong>生肉：</strong>+20 飽食 / +5 體力</li>
            <li><strong>能量棒/蔬菜/水果：</strong>+15 飽食 / +5~10 體力</li>
            <li><strong>乾癟的野果：</strong>+5 飽食 / +0 體力</li>
            <li><strong>純水：</strong>+0 飽食 / +35 體力</li>
            <li><strong>過濾水：</strong>+0 飽食 / +20 體力</li>
            <li><strong>半瓶礦泉水：</strong>+0 飽食 / +15 體力</li>
          </ul>
          <h3 style="color: #4a90e2;">危險等級與夜晚</h3>
          <p>每天的 <strong>19:00 至 05:00</strong> 是喪屍最活躍的時刻，變異體出現的機率也會大增。非必要請避免在夜間進行長途遷徙。右上角的危險標籤（安全、警戒、危險）能幫助你判斷當前局勢。</p>
        </div>

        <!-- 分頁：避難所基地運作 (修復 ID 衝突) -->
        <div id="manual-base" class="manual-pane hidden">
          <h3 style="color: #f39c12; margin-top: 0;">🏕️ 避難所建設與藍圖系統</h3>
          <p>基地是你在廢土中的最後堡壘，當你指示建立設施時，系統將自動從倉庫扣除對應建材，若材料不足則會建造失敗。</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 0.9em; text-align: left;">
            <tr style="border-bottom: 1px solid #444; color: #4a90e2;">
              <th style="padding: 5px;">設施名稱</th><th style="padding: 5px;">建材需求</th><th style="padding: 5px;">產出/功能 (每日)</th>
            </tr>
            <tr style="border-bottom: 1px solid #222;">
              <td style="padding: 5px;">農場 / 溫室</td><td style="padding: 5px;">木材x2, 廢鐵x1</td><td style="padding: 5px; color: #4CAF50;">產出生肉x4 / 水果x4</td>
            </tr>
            <tr style="border-bottom: 1px solid #222;">
              <td style="padding: 5px;">集水 / 雨水過濾</td><td style="padding: 5px;">木材x1, 雜物x1</td><td style="padding: 5px; color: #4CAF50;">產出過濾水x4</td>
            </tr>
            <tr style="border-bottom: 1px solid #222;">
              <td style="padding: 5px;">水培 / 淨水</td><td style="padding: 5px;">電子零件x1, 廢鐵x2</td><td style="padding: 5px; color: #4CAF50;">產出蔬菜x4 / 純水x4</td>
            </tr>
            <tr style="border-bottom: 1px solid #222;">
              <td style="padding: 5px;">拒馬 / 哨塔</td><td style="padding: 5px;">木材x3~5, 廢鐵x1~3</td><td style="padding: 5px; color: #4a90e2;">提供 10~20 點治安值</td>
            </tr>
          </table>

          <h3 style="color: #f39c12;">👥 勞動力與基地治安</h3>
          <ul>
            <li><strong>勞動力分配：</strong>每 1 名人口每日僅能運作 1 座設施。若設施過多，將有部分設施停工。</li>
            <li><strong>襲擊威脅 (懷璧其罪)：</strong>倉庫中每存放 10 件物資，會增加 1 點「威脅值」。若威脅值大於基地的「治安值」，每晚有極高機率遭遇掠奪者洗劫倉庫。</li>
            <li><strong>巡邏隊與拾荒：</strong>你可以分配 1 名人口作為「巡邏隊」(提供15點治安)，或分配至少 2 名人口組成「拾荒隊」(產出廢鐵/電子零件)。</li>
          </ul>
        </div>

        <!-- 分頁：探索與物資 -->
        <div id="manual-inventory" class="manual-pane hidden">
          <h3 style="color: #4a90e2; margin-top: 0;">背包負重</h3>
          <p>帶太多東西會成為你在末日中的致命傷。你的負重分為三級：</p>
          <ul>
            <li><strong>輕裝 (0-5件)：</strong>行動自如。</li>
            <li><strong>標準 (6-10件)：</strong>常規狀態。</li>
            <li><strong>超載 (11件以上)：</strong>所有行動消耗的體力大幅增加，移動將變得極度吃力。</li>
            <p style="font-size: 0.9em; color: #888;">*註：喪屍晶核與某些關鍵任務物品不計入負重。</p>
          </ul>
          <h3 style="color: #4a90e2;">物資暫存點</h3>
          <p>遇到帶不走的物資？你可以選擇將它們藏在隱蔽的死胡同或廢棄建築中。只要你記得地點，日後隨時可以回來取走。但要注意，若超過數週未返回，物資可能被他人拾走。</p>
        </div>

        <!-- 分頁：戰鬥與體格 -->
        <div id="manual-combat" class="manual-pane hidden">
          <h3 style="color: #4a90e2; margin-top: 0;">傷勢與治療</h3>
          <p>受傷分為「輕傷」與「重傷」。若不幸重傷且未即時處理，你將持續流失體力，歸零即面臨死亡。</p>
          <h3 style="color: #4a90e2;">體格熟練度與等級壓制</h3>
          <p>共有 8 項核心體格。等級不僅會降低體力消耗，Lv.3 以上更會解鎖專屬的「生存特權」。</p>
          <p style="color: #e57373; font-weight: bold;">【極度警告】：請衡量自身能力！若未達相應等級卻試圖執行高難度動作，你將面臨極高的失敗率。</p>
          <h3 style="color: #f5a623;">凡人與覺醒者的界線</h3>
          <p>在生死關頭累積滿 100 點共鳴值，你將 100% 覺醒專屬異能。吸收變異體的「晶核」是升級的唯一捷徑。</p>
        </div>

        <!-- 分頁：同行者與陣營 -->
        <div id="manual-npc" class="manual-pane hidden">
          <h3 style="color: #4a90e2; margin-top: 0;">同行者生存法則</h3>
          <p>你最多可以帶領 2 名 NPC 結伴同行。他們會受傷、飢餓。你必須分配食物給他們，否則當信任不足時，可能會拋棄你。</p>
          <h3 style="color: #4a90e2;">關係發展與陣營</h3>
          <p>與 NPC 的互動會影響三項數值：信任、親密、浪漫張力。世界中存在五大陣營，幫助其中一方可能會激怒其敵對陣營。</p>
        </div>

        <!-- 分頁：載具系統 -->
        <div id="manual-vehicle" class="manual-pane hidden">
          <h3 style="color: #4a90e2; margin-top: 0;">載具優勢與風險</h3>
          <p>一輛車能為你提供防護與巨大的空間。但引擎聲在夜間可能成為致命的催命符。</p>
          <ul>
            <li><strong>油量與耐久：</strong>移動會消耗油量，碰撞會降低耐久。耐久歸零則車輛報廢。</li>
            <li><strong>修復條件：</strong>若想修復車輛，必須具備工程或機械相關背景，並備妥足夠的零件。</li>
          </ul>
        </div>

      </div>
    </div>
  </div>
`;

// 2. 初始化手冊系統的邏輯
window.initManualSystem = function() {
  var modal = document.getElementById('manual-modal');
  if (!modal) return;

  // 將 HTML 模板注入到容器中
  modal.innerHTML = window.MANUAL_TEMPLATE;

  // 綁定右上角關閉按鈕
  var closeBtn = document.getElementById('manual-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      modal.classList.add('hidden');
    });
  }

  // 綁定頁籤切換邏輯
  var tabBtns = modal.querySelectorAll('.manual-tab-btn');
  var panes = modal.querySelectorAll('.manual-pane');

  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      // 移除所有啟動狀態
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      panes.forEach(function(p) { p.classList.add('hidden'); });
      
      // 啟動當前點擊的頁籤
      btn.classList.add('active');
      var targetId = btn.getAttribute('data-target');
      var targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.remove('hidden');
      }
    });
  });
};

// 3. 確保網頁載入後，自動執行初始化
document.addEventListener('DOMContentLoaded', window.initManualSystem);