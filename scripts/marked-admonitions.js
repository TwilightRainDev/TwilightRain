/**
 * 提示块 :::admon[类型 可选标题] … :::（note/tip/important/warning/caution，不分大小写），
 * 渲染为 <blockquote class="admonition bdm-类型">，样式见 style.min.css。
 * 省略方括号默认 note；方括号首词不是类型时宽容处理——默认 note、全串作标题。
 * 不闭合的 ::: 块按普通文本原样输出（写错时显眼暴露）。
 * 用 'marked:use' 块级扩展接进去（hexo-renderer-marked 每次渲染前执行），不换渲染器，
 * 故既有 Markdown 解析不受影响。
 */
'use strict';

var ADMONITION_TYPES = ['note', 'tip', 'important', 'warning', 'caution'];
var RULE = /^:::admon(?:\[([^\]]*)\])?\s*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseAdmonMeta(raw) {
  var s = String(raw || '').trim();
  if (!s) return { type: 'note', title: '' };
  var m = /^(\S+)(?:\s+([\s\S]*))?$/.exec(s);
  var first = m[1].toLowerCase();
  if (ADMONITION_TYPES.indexOf(first) !== -1) {
    return { type: first, title: (m[2] || '').trim() };
  }
  return { type: 'note', title: s };
}

function renderAdmonHtml(type, title, bodyHtml) {
  var display = title || type.charAt(0).toUpperCase() + type.slice(1);
  return '<blockquote class="admonition bdm-' + type +
    '" data-callout="' + type + '">\n' +
    '<div class="bdm-title">' + escapeHtml(display) + '</div>\n' +
    bodyHtml +
    '\n</blockquote>';
}

var admonitionExtension = {
  name: 'admonition',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::admon(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = RULE.exec(src);
    if (!match) return undefined;
    var meta = parseAdmonMeta(match[1]);
    var token = {
      type: 'admonition',
      raw: match[0],
      admonitionType: meta.type,
      title: meta.title,
      tokens: []
    };
    // 块内内容继续走完整 Markdown 解析（列表/代码块/强调等）
    this.lexer.blockTokens(match[2], token.tokens);
    return token;
  },
  renderer: function (token) {
    return renderAdmonHtml(token.admonitionType, token.title, this.parser.parse(token.tokens));
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [admonitionExtension] });
  });
}

module.exports = {
  admonitionExtension: admonitionExtension,
  parseAdmonMeta: parseAdmonMeta,
  renderAdmonHtml: renderAdmonHtml,
  ADMONITION_TYPES: ADMONITION_TYPES,
  RULE: RULE
};
