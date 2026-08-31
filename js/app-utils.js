'use strict';

function simpleMarkdownToHtml(text) {
  var lines = text.split('\n');
  var html = '';
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf('## ') === 0) {
      html += '<h3>' + escapeHtml(line.slice(3)) + '</h3>';
    } else if (line.indexOf('# ') === 0) {
      html += '<h2>' + escapeHtml(line.slice(2)) + '</h2>';
    } else if (line.indexOf('- ') === 0) {
      html += '<p class="rules-li">• ' + escapeHtml(line.slice(2)) + '</p>';
    } else if (line.trim() === '') {
      html += '';
    } else {
      html += '<p>' + escapeHtml(line) + '</p>';
    }
  }
  return html;
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getRiskLevel(riskHint) {
  if (!riskHint) return 'low';
  var text = riskHint.toLowerCase();
  var highKeywords = ['死', '喪屍', '危險', '致命', '重傷', '衝突', '挑釁', '暴露', '追擊', '槍聲', 'high risk', 'extreme', 'lethal', 'critical'];
  var mediumKeywords = ['可能', '風險', '難以', '警戒', '驚動', '盤查', 'moderate', 'medium risk'];
  for (var i = 0; i < highKeywords.length; i++) {
    if (text.indexOf(highKeywords[i].toLowerCase()) !== -1) return 'high';
  }
  for (var j = 0; j < mediumKeywords.length; j++) {
    if (text.indexOf(mediumKeywords[j].toLowerCase()) !== -1) return 'medium';
  }
  return 'low';
}
