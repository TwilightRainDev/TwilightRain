/**
 * 提示块（admonitions）：:::note / :::tip / :::important / :::warning / :::caution
 *
 * 语法（Twilight 迁移，与 markdown-it-container / remark-directive 一致）：
 *   :::note[可选自定义标题]
 *   内容（支持 Markdown，可含代码块/列表）
 *   :::
 * 标题省略时默认显示类型名（Note / Tip / ...）。
 * 渲染为 <blockquote class="admonition bdm-类型">，样式见 style.min.css。
 *
 * 机制：hexo-renderer-marked 每次渲染前执行 'marked:use' 过滤器
 * （renderer.js: execFilterSync('marked:use', marked.use)），在此注册
 * marked 块级扩展即可，无需切换渲染器、不影响既有 Markdown 解析。
 * 不闭合的 ::: 块按普通文本原样输出（写错时显眼暴露）。
 */
'use strict';

var ADMONITION_TYPES = ['note', 'tip', 'important', 'warning', 'caution'];
var RULE = /^:::(note|tip|important|warning|caution)(\[[^\]]*\])?\s*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var admonitionExtension = {
  name: 'admonition',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::(note|tip|important|warning|caution)(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = RULE.exec(src);
    if (!match) return undefined;
    var type = match[1].toLowerCase();
    var title = (match[2] || '').replace(/^\[|\]$/g, '').trim();
    var token = {
      type: 'admonition',
      raw: match[0],
      admonitionType: type,
      title: title || '',
      tokens: []
    };
    // 块内内容继续走完整 Markdown 解析（列表/代码块/强调等）
    this.lexer.blockTokens(match[3], token.tokens);
    return token;
  },
  renderer: function (token) {
    var title = token.title ||
      token.admonitionType.charAt(0).toUpperCase() + token.admonitionType.slice(1);
    var body = this.parser.parse(token.tokens);
    return '<blockquote class="admonition bdm-' + token.admonitionType +
      '" data-callout="' + token.admonitionType + '">\n' +
      '<div class="bdm-title">' + escapeHtml(title) + '</div>\n' +
      body +
      '\n</blockquote>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [admonitionExtension] });
  });
}

module.exports = { admonitionExtension: admonitionExtension };
