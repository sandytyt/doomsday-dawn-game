/* ============================================================
   app-api.js（重構後完整版，請整份取代原檔案內容）
   本次重構：職責收斂為「純粹呼叫 AI 供應商 API」。
   buildContextPayload()／buildFullPrompt() 已搬移至 app-prompt.js。
   handleAIResponse() 已搬移至 app-response-handler.js。

   【行為保證】callGeminiAPI()／callOpenAICompatibleAPI()／
   callAIProvider() 內容與原本完全一致，僅搬移檔案位置。

   【載入順序要求】
   app-prompt.js 需在此檔案之前載入（因為 callGeminiAPI／
   callOpenAICompatibleAPI 會呼叫 app-prompt.js 的 buildFullPrompt）。
   app-response-handler.js 需在此檔案之後載入。
   ============================================================ */

'use strict';

function callAIProvider(payload) {
  var providerConf = CONFIG.PROVIDERS[gameState.provider] || CONFIG.PROVIDERS.gemini;
  if (providerConf.format === 'gemini') {
    return callGeminiAPI(payload, providerConf);
  }
  return callOpenAICompatibleAPI(payload, providerConf);
}

function callGeminiAPI(payload, providerConf) {
  var model = providerConf.defaultModel;
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + gameState.apiKey;
  var fullPrompt = buildFullPrompt(payload);

  var requestBody = {
    system_instruction: {
      parts: [
        { text: gameState.rulesText || '' }, // AI 核心規則與 JSON 格式要求
        { text: '\\n\\n【世界觀與主線真相】\\n' + (gameState.loreText || '') },
        { text: '\\n\\n【技能樹與判定鐵律】\\n' + (gameState.skillTreesText || '') },
        { text: '\\n\\n【勢力與地緣政治】\\n' + (gameState.factionsText || '') }
      ]
    },
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: { temperature: 1.0, responseMimeType: 'application/json' }
  };

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  }).then(function (res) {
    if (!res.ok) {
      return res.json().catch(function () { return {}; }).then(function (errData) {
        var msg = (errData.error && errData.error.message) || ('HTTP ' + res.status);
        throw new Error(msg);
      });
    }
    return res.json();
  }).then(function (data) {
    var rawText = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!rawText) throw new Error('AI 未回傳有效內容');
    return JSON.parse(rawText);
  });
}

function callOpenAICompatibleAPI(payload, providerConf) {
  var fullPrompt = buildFullPrompt(payload);
  var systemText = gameState.rulesText + '\\n\\n世界觀密檔參考資料：\\n' + gameState.loreText;

  var requestBody = {
    model: providerConf.defaultModel,
    messages: [
      { role: 'system', content: systemText },
      { role: 'user', content: fullPrompt }
    ],
    temperature: 1.0,
    response_format: { type: 'json_object' }
  };

  return fetch(providerConf.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + gameState.apiKey
    },
    body: JSON.stringify(requestBody)
  }).then(function (res) {
    if (!res.ok) {
      return res.json().catch(function () { return {}; }).then(function (errData) {
        var msg = (errData.error && errData.error.message) || ('HTTP ' + res.status);
        throw new Error(msg);
      });
    }
    return res.json();
  }).then(function (data) {
    var rawText = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!rawText) throw new Error('AI 未回傳有效內容');
    return JSON.parse(rawText);
  });
}