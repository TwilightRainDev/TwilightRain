/**
 * 构建期外链安全与邮箱混淆（拍板 M7）。
 */
'use strict';

var A_TAG_RE = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
var MAILTO_RE = /^mailto:/i;
var HTTP_RE = /^https?:\/\//i;

function encodeHtmlEntities(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function encodeMailtoValue(value) {
  return encodeHtmlEntities(value)
    .replace(/@/g, '&#64;')
    .replace(/\./g, '&#46;');
}

function parseHref(attrs) {
  var m = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/i);
  if (!m) return '';
  return (m[2] != null ? m[2] : m[3]) || '';
}

function upgradeRel(attrs) {
  if (!/\brel\s*=/.test(attrs)) {
    return attrs + ' rel="noopener noreferrer"';
  }
  return attrs.replace(/\brel\s*=\s*("([^"]*)"|'([^']*)')/i, function (full, quoted, dbl, sgl) {
    var rel = (dbl != null ? dbl : sgl) || '';
    var parts = rel.split(/\s+/).filter(Boolean);
    if (parts.indexOf('noopener') === -1) parts.push('noopener');
    if (parts.indexOf('noreferrer') === -1) parts.push('noreferrer');
    return ' rel="' + parts.join(' ') + '"';
  });
}

function isExternalHttp(href) {
  return HTTP_RE.test(href);
}

function processAnchor(match, attrs, inner) {
  var href = parseHref(attrs);
  if (!href) return match;

  if (MAILTO_RE.test(href)) {
    var encodedHref = encodeMailtoValue(href);
    var nextAttrs = attrs.replace(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/i, ' href="' + encodedHref + '"');
    var encodedInner = encodeMailtoValue(inner.replace(/<[^>]+>/g, ''));
    if (encodedInner && encodedInner !== inner.replace(/<[^>]+>/g, '')) {
      return '<a' + nextAttrs + '>' + encodedInner + '</a>';
    }
    return '<a' + nextAttrs + '>' + inner + '</a>';
  }

  if (!isExternalHttp(href)) return match;
  return '<a' + upgradeRel(attrs) + '>' + inner + '</a>';
}

function processExternalLinks(html) {
  if (!html || html.indexOf('<a') === -1) return html;
  return html.replace(A_TAG_RE, processAnchor);
}

module.exports = {
  encodeMailtoValue: encodeMailtoValue,
  upgradeRel: upgradeRel,
  processExternalLinks: processExternalLinks
};
