/**
 * 提示块（:::admon[类型 可选标题]；2026-08-25 收敛自 :::note 等五种容器头）
 *
 *   :::admon[warning]
 *   内容（支持 Markdown，可含代码块/列表）
 *   :::
 *
 *   :::admon[warning 自定义标题]
 *   内容
 *   :::
 *
 * 类型：note / tip / important / warning / caution（不区分大小写）。
 * 省略方括号时默认 note（与 CSS 兜底 --admonitions-color-note 一致）；
 * 方括号首词非类型时宽容处理——默认 note、全串作标题（同 fold 的
 * mode 兜底先例）。标题省略时默认显示类型名（Note / Tip / ...）。
 * 渲染为 <blockquote class="admonition bdm-类型">，样式见 style.min.css。
 *
 * 机制：hexo-renderer-marked 每次渲染前执行 'marked:use' 过滤器
 * （renderer.js: execFilterSync('marked:use', marked.use)），在此注册
 * marked 块级扩展即可，无需切换渲染器、不影响既有 Markdown 解析。
 * 不闭合的 ::: 块按普通文本原样输出（写错时显眼暴露）。
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
