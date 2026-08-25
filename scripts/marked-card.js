/**
 * 统一卡片 ::card（阶段七，非兼容；2026-08-25 再收敛为 github + link 两种）
 *
 *   ::card{type="github" repo="owner/repo" desc="..."}
 *   ::card{type="link" url="https://..." title="..." desc="..."}
 *
 * HTML 类名为 .card-github / .card-link。
 */
'use strict';

var CARD_RULE = /^::card\{([\s\S]*?)\}[ \t]*(?:\n|$)/;

var GITHUB_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';
var LINK_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .75.75 0 0 1 .106-1.06l.106-.106.424-.424a.75.75 0 0 1 .636-.131 2.001 2.001 0 0 0 2.121-.354l2.5-2.5a2 2 0 0 0-2.828-2.828l-1.25 1.25a.75.75 0 0 1-1.042-.018l-.07-.07a.75.75 0 0 1 .036-1.037ZM4.019 7.833l-1.25 1.25a2 2 0 0 0 2.828 2.828l1.25 1.25a.75.75 0 0 1 1.042.018l.07.07a.75.75 0 0 1-.036 1.037l-1.25 1.25a3.5 3.5 0 0 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .75.75 0 0 1-.106-1.06l.106-.106.424-.424a.75.75 0 0 1 .636-.131 2.001 2.001 0 0 0 2.121-.354Z"/></svg>';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseAttrs(raw) {
  var attrs = {};
  var re = /([a-zA-Z-]+)="([^"]*)"/g;
  var m;
  while ((m = re.exec(raw)) !== null) attrs[m[1]] = m[2];
  return attrs;
}

function parseCardType(attrs) {
  var t = String((attrs && attrs.type) || '').trim().toLowerCase();
  if (t === 'github' || t === 'link') return t;
  return '';
}

function renderGithubCard(attrs) {
  var repo = (attrs.repo || '').trim();
  if (!repo || repo.indexOf('/') === -1) {
    return '<p class="card-error">[WARN] 无效的仓库卡片语法，应为 ::card{type="github" repo="owner/repo"}</p>';
  }
  var slash = repo.indexOf('/');
  var owner = repo.slice(0, slash);
  var name = repo.slice(slash + 1);
  var desc = (attrs.desc || '').trim()
    ? '<div class="gc-description">' + escapeHtml(attrs.desc) + '</div>'
    : '<div class="gc-description" data-gc-desc></div>';
  return '<a class="card-github" href="https://github.com/' + escapeHtml(repo) +
    '" target="_blank" rel="noopener" data-repo="' + escapeHtml(repo) + '">' +
    '<div class="gc-titlebar">' +
    '<div class="gc-titlebar-left">' +
    '<span class="gc-owner">' + escapeHtml(owner) + '</span>' +
    '<span class="gc-divider">/</span>' +
    '<span class="gc-repo">' + escapeHtml(name) + '</span>' +
    '</div>' +
    '<span class="github-logo">' + GITHUB_LOGO_SVG + '</span>' +
    '</div>' +
    desc +
    '<div class="gc-meta">' +
    '<span class="gc-stars"></span>' +
    '<span class="gc-forks"></span>' +
    '<span class="gc-language"></span>' +
    '<span class="gc-license"></span>' +
    '</div>' +
    '</a>';
}

function renderLinkCard(attrs) {
  var url = (attrs.url || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    return '<p class="card-error">[WARN] 无效的链接卡片语法，应为 ::card{type="link" url="https://..."}</p>';
  }
  var host = '';
  try {
    host = new URL(url).host;
  } catch (e) { /* 非法 url */ }
  if (!host) {
    return '<p class="card-error">[WARN] 无效的链接卡片语法，应为 ::card{type="link" url="https://..."}</p>';
  }
  var title = (attrs.title || '').trim() || host;
  var desc = (attrs.desc || '').trim()
    ? '<div class="lc-description">' + escapeHtml(attrs.desc) + '</div>' : '';
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

function renderByType(kind, attrs) {
  if (kind === 'github') return renderGithubCard(attrs);
  if (kind === 'link') return renderLinkCard(attrs);
  return '<p class="card-error">[WARN] 无效卡片类型，应为 github|link</p>';
}

var cardExtension = {
  name: 'mdCard',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::card(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = CARD_RULE.exec(src);
    if (!match) return undefined;
    return { type: 'mdCard', raw: match[0], attrs: parseAttrs(match[1]) };
  },
  renderer: function (token) {
    return renderByType(parseCardType(token.attrs), token.attrs);
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [cardExtension] });
  });
}

module.exports = {
  cardExtension: cardExtension,
  parseCardType: parseCardType,
  renderGithubCard: renderGithubCard,
  renderLinkCard: renderLinkCard,
  CARD_RULE: CARD_RULE
};
