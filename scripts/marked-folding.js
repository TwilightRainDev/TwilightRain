/**
 * 折叠容器 folding（Butterfly 批二迁移）
 *
 * 与批一 :::fold（md-fold，轻量 details）区分：:::folding 为显式摘要条样式，
 * 适合长段补充说明、可扫读的折叠块。
 *
 *   :::folding[点击展开详细步骤]
 *   内容（完整 Markdown）
 *   :::
 */
'use strict';

var RULE = /^:::folding(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var foldingExtension = {
  name: 'foldingBlock',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::folding(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = RULE.exec(src);
    if (!match) return undefined;
    var label = (match[1] || '').replace(/^\[|\]$/g, '').trim();
    var token = {
      type: 'foldingBlock',
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
    return '<details class="md-folding">\n<summary class="md-folding-summary">' +
      escapeHtml(summary) + '</summary>\n<div class="md-folding-body">' +
      body + '</div>\n</details>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [foldingExtension] });
  });
}

module.exports = { foldingExtension: foldingExtension };
