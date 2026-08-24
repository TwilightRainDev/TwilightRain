/**
 * 站点卡 avatar / screenshot 缺省回退（拍板 M5）。
 */
'use strict';

var SITE_CARD_SCREENSHOT_PLACEHOLDER = '/img/site-card-placeholder.svg';

function domainFromUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) return '';
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch (e) {
    return '';
  }
}

function defaultAvatarUrl(url) {
  var host = domainFromUrl(url);
  return host ? 'https://' + host + '/favicon.ico' : '';
}

function resolveAvatar(url, avatar) {
  var trimmed = (avatar || '').trim();
  if (trimmed) return trimmed;
  return defaultAvatarUrl(url);
}

function resolveScreenshot(url, screenshot) {
  var trimmed = (screenshot || '').trim();
  if (trimmed) return trimmed;
  return SITE_CARD_SCREENSHOT_PLACEHOLDER;
}

function isScreenshotPlaceholder(src) {
  return String(src || '').trim() === SITE_CARD_SCREENSHOT_PLACEHOLDER;
}

module.exports = {
  SITE_CARD_SCREENSHOT_PLACEHOLDER: SITE_CARD_SCREENSHOT_PLACEHOLDER,
  domainFromUrl: domainFromUrl,
  defaultAvatarUrl: defaultAvatarUrl,
  resolveAvatar: resolveAvatar,
  resolveScreenshot: resolveScreenshot,
  isScreenshotPlaceholder: isScreenshotPlaceholder
};
