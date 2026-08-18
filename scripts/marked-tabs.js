/**
 * 标签页（tabs）：:::tabs 容器 + "--- 标题" 分隔子页
 *
 * 语法（Reimu 批二迁移，与提示块 ::: 体系统一，markdown-it-container 风格）：
 *   :::tabs
 *   --- 标题A
 *   内容 A（完整 Markdown）
 *   --- 标题B
 *   内容 B
 *   :::
 * 渲染为 <div class="tabs">：tabs-nav 按钮条 + 各 tabs-panel，
 * 默认激活第一个；ink.js 事件委托切换（无框架依赖）。
 *
 * 机制：marked:use 块级扩展（同 scripts/marked-admonitions.js），
 * 块内用 this.lexer.blockTokens 二次解析（列表/代码块/强调均支持）。
 * 容错：无 "--- 标题" 分隔的块输出 [WARN] 可见错误（写错时显眼暴露）；
 * "--- 标题" 后无内容允许（空面板）。注意：tabs 内容里的 "---" 水平线
 * 必须是顶格才与分隔符混淆；分隔符要求 "--- " 后跟标题文本。
 */
'use strict';

var TABS_RE = /^:::tabs[ \t]*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var tabsExtension = {
  name: 'tabs',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::tabs(?=[\s\n])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = TABS_RE.exec(src);
    if (!match) return undefined;
    var inner = match[1];
    // 按 "--- 标题" 行切块：首块是分隔前内容（语法约定为空，忽略）
    var blocks = inner.split(/^---[ \t]+/m);
    var tabs = [];
    for (var i = 1; i < blocks.length; i++) {
      var b = blocks[i];
      var nl = b.indexOf('\n');
      var title = (nl === -1 ? b : b.slice(0, nl)).trim();
      var body = (nl === -1 ? '' : b.slice(nl + 1)).replace(/^\n+|\n+$/g, '');
      var t = {
        title: title || ('Tab ' + i),
        tokens: []
      };
      if (body) this.lexer.blockTokens(body, t.tokens);
      tabs.push(t);
    }
    return {
      type: 'tabs',
      raw: match[0],
      tabs: tabs
    };
  },
  renderer: function (token) {
    if (!token.tabs.length) {
      return '<p class="tabs-error">[WARN] 无效的标签页语法，应为 :::tabs + "--- 标题" 分隔 + :::</p>';
    }
    var html = '<div class="tabs">\n<div class="tabs-nav" role="tablist">';
    for (var i = 0; i < token.tabs.length; i++) {
      html += '\n<button type="button" class="tabs-tab' + (i === 0 ? ' is-active' : '') +
        '" role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') +
        '" data-tab="' + i + '">' + escapeHtml(token.tabs[i].title) + '</button>';
    }
    html += '\n</div>';
    for (var j = 0; j < token.tabs.length; j++) {
      html += '\n<div class="tabs-panel' + (j === 0 ? ' is-active' : '') +
        '" role="tabpanel" data-tab="' + j + '">' +
        this.parser.parse(token.tabs[j].tokens) + '</div>';
    }
    return html + '\n</div>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [tabsExtension] });
  });
}

module.exports = { tabsExtension: tabsExtension };
