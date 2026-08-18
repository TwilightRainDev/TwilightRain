/**
 * 通用链接卡片：::link{url="..." title="..." desc="..."} 指令 → 网页卡片
 *
 * 语法（Reimu 批二迁移，与 ::github 同模式，单行）：
 *   ::link{url="https://example.com/page" title="可选标题" desc="可选描述"}
 * 渲染为 <a class="card-link">：link 图标 + 标题（缺省取域名）+ 可选描述，
 * 点击跳转目标页（新标签）。
 *
 * 设计：纯静态卡片——不调 API、无前端 JS、CSP 零新增白名单（与 GitHub
 * 卡片不同，那个有 api.github.com 动态数据例外；本卡片完全静态）。
 * 安全：url 仅放行 http/https（防 javascript: 等伪协议注入），
 * 全部文本 escapeHtml 转义。title/desc 缺省时 title 取域名。
 *
 * 机制：注册 marked:use 过滤器（同 scripts/marked-admonitions.js /
 * marked-github-card.js）。行内指令不受 hexo backtick_code_block
 * 占位符替换影响（参见 marked-mermaid.js 注释）。
 */
'use strict';

// Octicon link（16px，单色 path，颜色由 CSS 控制）
var LINK_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .75.75 0 0 1 .106-1.06l.106-.106.424-.424a.75.75 0 0 1 .636-.131 2.001 2.001 0 0 0 2.121-.354l2.5-2.5a2 2 0 0 0-2.828-2.828l-1.25 1.25a.75.75 0 0 1-1.042-.018l-.07-.07a.75.75 0 0 1 .036-1.037ZM4.019 7.833l-1.25 1.25a2 2 0 0 0 2.828 2.828l1.25-1.25a.75.75 0 0 1 1.042.018l.07.07a.75.75 0 0 1-.036 1.037l-1.25 1.25a3.5 3.5 0 0 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .75.75 0 0 1-.106 1.06l-.106.106-.424.424a.75.75 0 0 1-.636.131 2.001 2.001 0 0 0 2.121-.354Z"/></svg>';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var linkCardExtension = {
  name: 'linkCard',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::link(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = /^::link\{([\s\S]*?)\}[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    var attrs = {};
    var re = /([a-zA-Z-]+)="([^"]*)"/g;
    var m;
    while ((m = re.exec(match[1])) !== null) attrs[m[1]] = m[2];
    return {
      type: 'linkCard',
      raw: match[0],
      url: (attrs.url || '').trim(),
      title: (attrs.title || '').trim(),
      desc: (attrs.desc || '').trim()
    };
  },
  renderer: function (token) {
    var url = token.url;
    // 仅放行 http/https（防 javascript: 等伪协议注入）
    if (!/^https?:\/\//i.test(url)) {
      return '<p class="link-card-error">[WARN] 无效的链接卡片语法，应为 ::link{url="https://..."}</p>';
    }
    var host = '';
    try {
      host = new URL(url).host;
    } catch (e) { /* url 格式非法走下方错误路径 */ }
    if (!host) {
      return '<p class="link-card-error">[WARN] 无效的链接卡片语法，应为 ::link{url="https://..."}</p>';
    }
    var title = token.title || host;
    var desc = token.desc
      ? '<div class="lc-description">' + escapeHtml(token.desc) + '</div>' : '';
    return '<a class="card-link" href="' + escapeHtml(url) +
      '" target="_blank" rel="noopener">' +
      '<div class="lc-titlebar">' +
      '<span class="link-logo">' + LINK_LOGO_SVG + '</span>' +
      '<span class="lc-title">' + escapeHtml(title) + '</span>' +
      '<span class="lc-host">' + escapeHtml(host) + '</span>' +
      '</div>' +
      desc +
      '</a>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [linkCardExtension] });
  });
}

module.exports = { linkCardExtension: linkCardExtension };
