/**
 * 外链图片 referrerpolicy（拍板 M8）。
 */
'use strict';

var IMG_RE = /<img\b[^>]*>/gi;

function isExternalImageSrc(src) {
  var value = String(src || '').trim();
  if (!value || value.indexOf('data:') === 0) return false;
  if (/^https?:\/\//i.test(value)) return true;
  if (value.indexOf('//') === 0) return true;
  return false;
}

function parseSrc(tag) {
  var m = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i);
  if (!m) return '';
  return (m[2] != null ? m[2] : m[3]) || '';
}

function addReferrerPolicy(tag) {
  if (/\sreferrerpolicy\s*=/i.test(tag)) return tag;
  var src = parseSrc(tag);
  if (!isExternalImageSrc(src)) return tag;
  return tag.replace(/\s*\/?>$/, ' referrerpolicy="no-referrer"$&');
}

function processExternalImages(html) {
  if (!html || html.indexOf('<img') === -1) return html;
  return html.replace(IMG_RE, addReferrerPolicy);
}

module.exports = {
  isExternalImageSrc: isExternalImageSrc,
  processExternalImages: processExternalImages
};
