/**
 * GitHub 仓库卡片：::github{repo="owner/repo"} 指令 → 仓库卡片
 *
 * 语法（Twilight 迁移，与 remark-directive leaf 一致，单行）：
 *   ::github{repo="TwilightRainDev/TwilightRain" desc="可选描述"}
 * 渲染为 <a class="card-github">：owner/repo 标题 + GitHub 图标 + 可选描述，
 * 点击跳转仓库页（新标签）。
 *
 * 设计：静态卡片，不调 GitHub API——博客 CSP connect-src 仅 'self'（fetch
 * 会被拦），且无 token 的 API 有 IP 限流；卡片不展示 stars/forks 等动态
 * 数据（Twilight 用内联脚本 + api.github.com，与 CSP 不兼容，未迁移）。
 * repo 格式校验（必须含 "/"），无效时输出可见错误提示。
 *
 * 机制：注册 marked:use 过滤器（同 scripts/marked-admonitions.js），
 * marked 块级扩展。注意：本语法是行内指令非围栏代码块，不受 hexo
 * backtick_code_block 占位符替换影响（参见 scripts/marked-mermaid.js 注释）。
 */
'use strict';

// GitHub Octicon mark（单色 path，颜色由 CSS 控制）
var GITHUB_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var githubCardExtension = {
  name: 'githubCard',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::github(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = /^::github\{([\s\S]*?)\}[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    var attrs = {};
    var re = /([a-zA-Z-]+)="([^"]*)"/g;
    var m;
    while ((m = re.exec(match[1])) !== null) attrs[m[1]] = m[2];
    return {
      type: 'githubCard',
      raw: match[0],
      repo: (attrs.repo || '').trim(),
      desc: (attrs.desc || '').trim()
    };
  },
  renderer: function (token) {
    var repo = token.repo;
    if (!repo || repo.indexOf('/') === -1) {
      return '<p class="github-card-error">[WARN] 无效的仓库卡片语法，应为 ::github{repo="owner/repo"}</p>';
    }
    var slash = repo.indexOf('/');
    var owner = repo.slice(0, slash);
    var name = repo.slice(slash + 1);
    var desc = token.desc
      ? '<div class="gc-description">' + escapeHtml(token.desc) + '</div>'
      : '';
    return '<a class="card-github" href="https://github.com/' + escapeHtml(repo) +
      '" target="_blank" rel="noopener">' +
      '<div class="gc-titlebar">' +
      '<div class="gc-titlebar-left">' +
      '<span class="gc-owner">' + escapeHtml(owner) + '</span>' +
      '<span class="gc-divider">/</span>' +
      '<span class="gc-repo">' + escapeHtml(name) + '</span>' +
      '</div>' +
      '<span class="github-logo">' + GITHUB_LOGO_SVG + '</span>' +
      '</div>' +
      desc +
      '</a>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [githubCardExtension] });
  });
}

module.exports = { githubCardExtension: githubCardExtension };
