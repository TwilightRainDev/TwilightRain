/**
 * 站点卡 / 介绍卡（Butterfly 批三迁移，对照 AZY site/intCard 思路自写）
 *
 *   ::site{url="https://..." title="..." screenshot="..." avatar="..." desc="..."}
 *   ::intro{url="..." img="..." title="..." subtitle="..." tip="..." cardtitle="..." logo="..."}
 *   :::site-group[分组标题]
 *   ::site{...}
 *   :::
 */
'use strict';

var faviconFallback = require('./lib/favicon-fallback');

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

var siteExtension = {
  name: 'mdSite',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::site(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = /^::site\{([\s\S]*?)\}[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    return { type: 'mdSite', raw: match[0], attrs: parseAttrs(match[1]) };
  },
  renderer: function (token) {
    return renderSiteCard(token.attrs);
  }
};

var introExtension = {
  name: 'mdIntro',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::intro(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = /^::intro\{([\s\S]*?)\}[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    return { type: 'mdIntro', raw: match[0], attrs: parseAttrs(match[1]) };
  },
  renderer: function (token) {
    return renderIntroCard(token.attrs);
  }
};

var SITE_GROUP_RULE = /^:::site-group(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

var siteGroupExtension = {
  name: 'siteGroup',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::site-group(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = SITE_GROUP_RULE.exec(src);
    if (!match) return undefined;
    var label = (match[1] || '').replace(/^\[|\]$/g, '').trim();
    return {
      type: 'siteGroup',
      raw: match[0],
      label: label,
      body: match[2]
    };
  },
  renderer: function (token) {
    var inner = '';
    var re = /^::site\{([\s\S]*?)\}[ \t]*(?:\n|$)/gm;
    var m;
    var count = 0;
    while ((m = re.exec(token.body)) !== null) {
      inner += renderSiteCard(parseAttrs(m[1]));
      count += 1;
    }
    if (!count) {
      return '<p class="card-site-error">[WARN] site-group 内须包含 ::site{...}</p>';
    }
    var head = token.label
      ? '<p class="site-group-title">' + escapeHtml(token.label) + '</p>'
      : '';
    return '<div class="site-group">' + head +
      '<div class="site-group-grid">' + inner + '</div></div>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [siteExtension, introExtension, siteGroupExtension] });
  });
}

module.exports = {
  siteExtension: siteExtension,
  introExtension: introExtension,
  siteGroupExtension: siteGroupExtension,
  renderSiteCard: renderSiteCard,
  renderIntroCard: renderIntroCard
};
