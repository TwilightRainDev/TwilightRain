/**
 * 统一卡片 ::card（阶段七，非兼容）
 *
 *   ::card{type="github" repo="owner/repo" desc="..."}
 *   ::card{type="link" url="https://..." title="..." desc="..."}
 *   ::card{type="site" url="..." title="..." screenshot="..." avatar="..." desc="..."}
 *   ::card{type="intro" url="..." img="..." title="..."}
 *   :::card-group[标题]
 *   ::card{type="site" ...}
 *   :::
 *
 * HTML 类名仍为 .card-github / .card-link / .card-site / .card-intro / .site-group。
 */
'use strict';

var faviconFallback = require('./lib/favicon-fallback');

var CARD_RULE = /^::card\{([\s\S]*?)\}[ \t]*(?:\n|$)/;
var CARD_GROUP_RULE = /^:::card-group(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

var GITHUB_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';
var LINK_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .75.75 0 0 1 .106-1.06l.106-.106.424-.424a.75.75 0 0 1 .636-.131 2.001 2.001 0 0 0 2.121-.354l2.5-2.5a2 2 0 0 0-2.828-2.828l-1.25 1.25a.75.75 0 0 1-1.042-.018l-.07-.07a.75.75 0 0 1 .036-1.037ZM4.019 7.833l-1.25 1.25a2 2 0 0 0 2.828 2.828l1.25-1.25a.75.75 0 0 1 1.042.018l.07.07a.75.75 0 0 1-.036 1.037l-1.25 1.25a3.5 3.5 0 0 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .75.75 0 0 1-.106 1.06l-.106.106-.424.424a.75.75 0 0 1-.636.131 2.001 2.001 0 0 0 2.121-.354Z"/></svg>';

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

function isSafeUrl(url) {
  if (!url) return false;
  if (/^https?:\/\//i.test(url)) return true;
  if (/^\/(?!\/)/.test(url)) return true;
  return false;
}

function linkAttrs(url) {
  var external = /^https?:\/\//i.test(url);
  return external ? ' target="_blank" rel="noopener noreferrer"' : '';
}

function parseCardType(attrs) {
  var t = String((attrs && attrs.type) || '').trim().toLowerCase();
  if (t === 'github' || t === 'link' || t === 'site' || t === 'intro') return t;
  return '';
}

function renderGithubCard(attrs) {
  var repo = (attrs.repo || '').trim();
  if (!repo || repo.indexOf('/') === -1) {
    return '<p class="github-card-error">[WARN] 无效的仓库卡片语法，应为 ::card{type="github" repo="owner/repo"}</p>';
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
    return '<p class="link-card-error">[WARN] 无效的链接卡片语法，应为 ::card{type="link" url="https://..."}</p>';
  }
  var host = '';
  try {
    host = new URL(url).host;
  } catch (e) { /* 非法 url */ }
  if (!host) {
    return '<p class="link-card-error">[WARN] 无效的链接卡片语法，应为 ::card{type="link" url="https://..."}</p>';
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

function renderSiteCard(attrs) {
  var url = (attrs.url || '').trim();
  var title = (attrs.title || '').trim();
  if (!isSafeUrl(url) || !title) {
    return '<p class="card-site-error">[WARN] 无效站点卡，需 url 与 title</p>';
  }
  var screenshot = faviconFallback.resolveScreenshot(url, attrs.screenshot);
  var avatar = faviconFallback.resolveAvatar(url, attrs.avatar);
  var desc = (attrs.desc || '').trim();
  var screenshotIsPlaceholder = faviconFallback.isScreenshotPlaceholder(screenshot);

  var cover = screenshot && isSafeUrl(screenshot)
    ? '<div class="cs-cover"><img class="cs-cover-img' +
      (screenshotIsPlaceholder ? ' cs-cover-img--placeholder' : '') + '" src="' +
      escapeHtml(screenshot) + '" alt="" loading="lazy" decoding="async"' +
      (screenshotIsPlaceholder && /^https?:\/\//i.test(url)
        ? ' data-site-url="' + escapeHtml(url) + '"' : '') +
      '></div>'
    : '<div class="cs-cover cs-cover--empty"></div>';

  var avatarHtml = avatar && isSafeUrl(avatar)
    ? '<img class="cs-avatar" src="' + escapeHtml(avatar) + '" alt="" loading="lazy" decoding="async">'
    : '';

  var descHtml = desc
    ? '<p class="cs-desc">' + escapeHtml(desc) + '</p>'
    : '';

  return '<a class="card-site" href="' + escapeHtml(url) + '"' + linkAttrs(url) + '>' +
    cover +
    '<div class="cs-info">' + avatarHtml +
    '<span class="cs-title">' + escapeHtml(title) + '</span></div>' +
    descHtml +
    '</a>';
}

function renderIntroCard(attrs) {
  var url = (attrs.url || '').trim();
  var img = (attrs.img || '').trim();
  if (!isSafeUrl(url) || !img || !isSafeUrl(img)) {
    return '<p class="card-intro-error">[WARN] 无效介绍卡，需 url 与 img（http(s) 或 /path）</p>';
  }

  var tip = (attrs.tip || '').trim();
  var cardtitle = (attrs.cardtitle || attrs.cardTitle || '').trim();
  var title = (attrs.title || '').trim();
  var subtitle = (attrs.subtitle || '').trim();
  var logo = (attrs.logo || '').trim();
  var hasBottom = logo || title || subtitle;

  var topMeta = (tip || cardtitle)
    ? '<div class="ci-meta">' +
      (tip ? '<span class="ci-tip">' + escapeHtml(tip) + '</span>' : '') +
      (cardtitle ? '<span class="ci-cardtitle">' + escapeHtml(cardtitle) + '</span>' : '') +
      '</div>'
    : '';

  var bottom = hasBottom
    ? '<div class="ci-bottom">' +
      '<div class="ci-bottom-left">' +
      (logo && isSafeUrl(logo)
        ? '<img class="ci-logo" src="' + escapeHtml(logo) + '" alt="" loading="lazy" decoding="async">'
        : '') +
      '<div class="ci-text">' +
      (title ? '<div class="ci-title">' + escapeHtml(title) + '</div>' : '') +
      (subtitle ? '<div class="ci-subtitle">' + escapeHtml(subtitle) + '</div>' : '') +
      '</div></div>' +
      '<span class="ci-go">前往</span></div>'
    : '';

  return '<a class="card-intro" href="' + escapeHtml(url) + '"' + linkAttrs(url) + '>' +
    '<div class="ci-top">' + topMeta +
    '<img class="ci-hero" src="' + escapeHtml(img) + '" alt="" loading="lazy" decoding="async">' +
    '</div>' + bottom + '</a>';
}

function renderByType(kind, attrs) {
  if (kind === 'github') return renderGithubCard(attrs);
  if (kind === 'link') return renderLinkCard(attrs);
  if (kind === 'site') return renderSiteCard(attrs);
  if (kind === 'intro') return renderIntroCard(attrs);
  return '<p class="card-site-error">[WARN] 无效卡片类型，应为 github|link|site|intro</p>';
}

function parseGroupBody(body) {
  var inner = '';
  var count = 0;
  var re = /^::card\{([\s\S]*?)\}[ \t]*(?:\n|$)/gm;
  var m;
  while ((m = re.exec(body)) !== null) {
    var attrs = parseAttrs(m[1]);
    if (parseCardType(attrs) !== 'site') continue;
    inner += renderSiteCard(attrs);
    count += 1;
  }
  return { inner: inner, count: count };
}

function renderGroupHtml(label, body) {
  var parsed = parseGroupBody(body);
  if (!parsed.count) {
    return '<p class="card-site-error">[WARN] 分组内须包含 ::card{type="site" ...}</p>';
  }
  var head = label
    ? '<p class="site-group-title">' + escapeHtml(label) + '</p>'
    : '';
  return '<div class="site-group">' + head +
    '<div class="site-group-grid">' + parsed.inner + '</div></div>';
}

function stripBracket(raw) {
  return (raw || '').replace(/^\[|\]$/g, '').trim();
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

var cardGroupExtension = {
  name: 'cardGroup',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::card-group(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = CARD_GROUP_RULE.exec(src);
    if (!match) return undefined;
    return {
      type: 'cardGroup',
      raw: match[0],
      label: stripBracket(match[1]),
      body: match[2]
    };
  },
  renderer: function (token) {
    return renderGroupHtml(token.label, token.body);
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [cardExtension, cardGroupExtension] });
  });
}

module.exports = {
  cardExtension: cardExtension,
  cardGroupExtension: cardGroupExtension,
  parseCardType: parseCardType,
  parseGroupBody: parseGroupBody,
  renderGithubCard: renderGithubCard,
  renderLinkCard: renderLinkCard,
  renderSiteCard: renderSiteCard,
  renderIntroCard: renderIntroCard,
  CARD_RULE: CARD_RULE,
  CARD_GROUP_RULE: CARD_GROUP_RULE
};

