/**
 * 隐藏 / 折叠块（Butterfly 批一迁移，自写 marked 扩展，不复制主题 tag 源码）
 *
 * 语法：
 *   :::hide[按钮文案]
 *   内容（完整 Markdown）
 *   :::
 *   → 点击按钮后显示内容（默认隐藏）
 *
 *   :::fold[摘要标题]
 *   内容
 *   :::
 *   → <details>/<summary> 原生折叠（与站点 details 样式可并存）
 */
'use strict';

var RULE = /^:::(hide|fold)(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var hideExtension = {
  name: 'hideBlock',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::(hide|fold)(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = RULE.exec(src);
    if (!match) return undefined;
    var kind = match[1].toLowerCase();
    var label = (match[2] || '').replace(/^\[|\]$/g, '').trim();
    var token = {
      type: 'hideBlock',
      raw: match[0],
      kind: kind,
      label: label,
      tokens: []
    };
    this.lexer.blockTokens(match[3], token.tokens);
    return token;
  },
  renderer: function (token) {
    var body = this.parser.parse(token.tokens);
    if (token.kind === 'fold') {
      var summary = token.label || '展开';
      return '<details class="md-fold">\n<summary class="md-fold-summary">' +
        escapeHtml(summary) + '</summary>\n<div class="md-fold-body">' +
        body + '</div>\n</details>';
    }
    var btn = token.label || '点击显示';
    return '<div class="md-hide">\n<button type="button" class="md-hide-btn">' +
      escapeHtml(btn) + '</button>\n<div class="md-hide-content" hidden>' +
      body + '</div>\n</div>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [hideExtension] });
  });
}

module.exports = { hideExtension: hideExtension };
