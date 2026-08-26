'use strict';

// ==========================================
// 視覺動態引擎 (背景與立繪切換)
// ==========================================
function updateDynamicVisuals() {
  var appEl = document.getElementById('app');
  var avatarEl = document.getElementById('player-avatar-box');
  if (!appEl || !avatarEl) return;

  // --- 1. 背景圖片判斷 ---
  var loc = gameState.location || "未知";
  var bgImage = "images/bg/default.png"; // 預設背景

  // 根據地標/區域來配對圖片 (可依需求自行擴充)
  if (loc.indexOf("仁愛醫院") !== -1) bgImage = "images/bg/hospital.png";
  else if (loc.indexOf("警戒隔離區") !== -1 || loc.indexOf("軍方") !== -1) bgImage = "images/bg/military_zone.png";
  else if (loc.indexOf("貧民窟") !== -1) bgImage = "images/bg/slum.png";
  else if (loc.indexOf("地鐵") !== -1) bgImage = "images/bg/subway.png";
  else if (loc.indexOf("摩天樓") !== -1 || loc.indexOf("辦公大樓") !== -1) bgImage = "images/bg/skyscraper.png";
  else if (loc.indexOf("灰堡") !== -1 || loc.indexOf("軍械庫") !== -1) bgImage = "images/bg/ash_fort.png";
  else if (loc.indexOf("靜默聖所") !== -1 || loc.indexOf("教堂") !== -1) bgImage = "images/bg/sanctuary.png";
  else if (loc.indexOf("方舟") !== -1) bgImage = "images/bg/ark.png";
  else if (loc.indexOf("市") !== -1 || loc.indexOf("街") !== -1) bgImage = "images/bg/city_ruins.png";

  appEl.style.backgroundImage = "url('" + bgImage + "')";

  // --- 2. 主角立繪判斷 ---
  var gender = gameState.charSetup.gender || "男性";
  var occ = gameState.charSetup.occupation || "";
  var avatarImage = "images/chars/default.png"; // 預設頭像

  if (gender === "男性") {
    if (occ.indexOf("軍") !== -1 || occ.indexOf("警") !== -1) avatarImage = "images/chars/male_soldier.png";
    else if (occ.indexOf("醫") !== -1) avatarImage = "images/chars/male_doctor.png";
    else avatarImage = "images/chars/male_survivor.png";
  } else if (gender === "女性") {
    if (occ.indexOf("軍") !== -1 || occ.indexOf("警") !== -1) avatarImage = "images/chars/female_soldier.png";
    else if (occ.indexOf("醫") !== -1) avatarImage = "images/chars/female_doctor.png";
    else avatarImage = "images/chars/female_survivor.png";
  }

  avatarEl.style.backgroundImage = "url('" + avatarImage + "')";

  // --- 3. 異能覺醒發光特效 ---
  if (gameState.awakeningLevel && gameState.awakeningLevel > 0) {
    avatarEl.classList.add('awakened');
  } else {
    avatarEl.classList.remove('awakened');
  }
}
