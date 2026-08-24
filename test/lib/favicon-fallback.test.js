'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var favicon = require('../../scripts/lib/favicon-fallback');
var siteCards = require('../../scripts/marked-site-cards');

test('domainFromUrl 与 defaultAvatarUrl', function () {
  assert.equal(favicon.domainFromUrl('https://www.example.com/path'), 'example.com');
  assert.equal(favicon.defaultAvatarUrl('https://github.com/foo'), 'https://github.com/favicon.ico');
  assert.equal(favicon.defaultAvatarUrl('/about/'), '');
});

test('resolveAvatar / resolveScreenshot 回退', function () {
  assert.equal(
    favicon.resolveAvatar('https://example.com', ''),
    'https://example.com/favicon.ico'
  );
  assert.equal(favicon.resolveAvatar('https://example.com', '/img/a.png'), '/img/a.png');
  assert.equal(
    favicon.resolveScreenshot('https://example.com', ''),
    favicon.SITE_CARD_SCREENSHOT_PLACEHOLDER
  );
});

test('renderSiteCard 空 avatar/screenshot 自动补全', function () {
  var html = siteCards.renderSiteCard({
    url: 'https://example.com',
    title: '示例站'
  });
  assert.match(html, /https:\/\/example\.com\/favicon\.ico/);
  assert.match(html, /site-card-placeholder\.svg/);
  assert.match(html, /data-site-url="https:\/\/example\.com"/);
});
