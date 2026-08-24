/**
 * 剧透/行内揭示 :::text（拍板 M2）
 *
 *   :::text[悬停或点击查看]
 *   剧透内容（Markdown）
 *   :::
 *
 * 悬停或点击后揭示；替代 :::hide（旧语法保留至阶段四删除）。
 */
'use strict';

var RULE = /^:::text(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var textExtension = {
  name: 'mdText',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::text(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = RULE.exec(src);
    if (!match) return undefined;
    var hint = (match[1] || '').replace(/^\[|\]$/g, '').trim();
    var token = {
      type: 'mdText',
      raw: match[0],
      hint: hint,
      tokens: []
    };
    this.lexer.blockTokens(match[2], token.tokens);
    return token;
  },
  renderer: function (token) {
    var body = this.parser.parse(token.tokens);
    var label = token.hint || '悬停或点击查看';
    return '<div class="md-text" tabindex="0" role="button" aria-label="' +
      escapeHtml(label) + '">\n<span class="md-text-hint">' + escapeHtml(label) +
      '</span>\n<div class="md-text-body">' + body + '</div>\n</div>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [textExtension] });
  });
}

module.exports = { textExtension: textExtension };
