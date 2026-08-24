/**
 * 折叠围栏 :::fold（阶段七，非兼容）
 *
 *   :::fold[text 悬停或点击查看]
 *   :::fold[details 摘要标题]
 *   :::fold[mode=text 剧透]
 *
 * 无 mode 关键字时默认 text。HTML 类名仍为 .md-text / .md-details。
 */
'use strict';

var FOLD_RULE = /^:::fold(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseFoldMeta(raw) {
  var s = String(raw || '').trim();
  var m = /^mode\s*=\s*(text|details)\s*(.*)$/i.exec(s);
  if (m) return { mode: m[1].toLowerCase(), label: (m[2] || '').trim() };
  m = /^(text|details)(?:\s+(.*))?$/i.exec(s);
  if (m) return { mode: m[1].toLowerCase(), label: (m[2] || '').trim() };
  return { mode: 'text', label: s };
}

function renderFoldHtml(mode, label, bodyHtml) {
  if (mode === 'text') {
    var hint = label || '悬停或点击查看';
    return '<div class="md-text" tabindex="0" role="button" aria-label="' +
      escapeHtml(hint) + '">\n<span class="md-text-hint">' + escapeHtml(hint) +
      '</span>\n<div class="md-text-body">' + bodyHtml + '</div>\n</div>';
  }
  var summary = label || '展开';
  return '<details class="md-details">\n<summary class="md-details-summary">' +
    escapeHtml(summary) + '</summary>\n<div class="md-details-body">' +
    bodyHtml + '</div>\n</details>';
}

function stripBracket(raw) {
  return (raw || '').replace(/^\[|\]$/g, '').trim();
}

var foldExtension = {
  name: 'mdFold',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::fold(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = FOLD_RULE.exec(src);
    if (!match) return undefined;
    var meta = parseFoldMeta(stripBracket(match[1]));
    var token = {
      type: 'mdFold',
      raw: match[0],
      mode: meta.mode,
      label: meta.label,
      tokens: []
    };
    this.lexer.blockTokens(match[2], token.tokens);
    return token;
  },
  renderer: function (token) {
    return renderFoldHtml(token.mode, token.label, this.parser.parse(token.tokens));
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [foldExtension] });
  });
}

module.exports = {
  foldExtension: foldExtension,
  parseFoldMeta: parseFoldMeta,
  renderFoldHtml: renderFoldHtml,
  FOLD_RULE: FOLD_RULE
};
