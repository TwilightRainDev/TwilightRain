/**
 * 块级折叠 :::details（拍板 M2）
 *
 *   :::details[摘要标题]
 *   内容（完整 Markdown）
 *   :::
 *
 * 渲染为 <details class="md-details">。
 */
'use strict';

var RULE = /^:::details(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var detailsExtension = {
  name: 'mdDetails',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::details(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = RULE.exec(src);
    if (!match) return undefined;
    var label = (match[1] || '').replace(/^\[|\]$/g, '').trim();
    var token = {
      type: 'mdDetails',
      raw: match[0],
      label: label,
      tokens: []
    };
    this.lexer.blockTokens(match[2], token.tokens);
    return token;
  },
  renderer: function (token) {
    var body = this.parser.parse(token.tokens);
    var summary = token.label || '展开';
    return '<details class="md-details">\n<summary class="md-details-summary">' +
      escapeHtml(summary) + '</summary>\n<div class="md-details-body">' +
      body + '</div>\n</details>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [detailsExtension] });
  });
}

module.exports = { detailsExtension: detailsExtension };
