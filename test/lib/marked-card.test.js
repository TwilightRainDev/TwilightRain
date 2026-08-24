'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var card = require('../../scripts/marked-card');

test('parseCardType 只接受四种 type', function () {
  assert.equal(card.parseCardType({ type: 'github' }), 'github');
  assert.equal(card.parseCardType({ type: 'link' }), 'link');
  assert.equal(card.parseCardType({ type: 'site' }), 'site');
  assert.equal(card.parseCardType({ type: 'intro' }), 'intro');
  assert.equal(card.parseCardType({ type: 'nope' }), '');
});

test('::card github 输出 card-github', function () {
  var html = card.renderGithubCard({ repo: 'owner/repo', desc: '说明' });
  assert.match(html, /class="card-github"/);
  assert.match(html, /data-repo="owner\/repo"/);
});

test('::card link 输出 card-link', function () {
  var html = card.renderLinkCard({
    url: 'https://example.com/x',
    title: '示例',
    desc: '描述'
  });
  assert.match(html, /class="card-link"/);
  assert.match(html, /example\.com/);
});

test('renderSiteCard 空 avatar/screenshot 自动补全', function () {
  var html = card.renderSiteCard({ url: 'https://example.com', title: '示例站' });
  assert.match(html, /class="card-site"/);
  assert.match(html, /https:\/\/example\.com\/favicon\.ico/);
  assert.match(html, /site-card-placeholder\.svg/);
});

test('parseGroupBody 只接受 ::card type=site', function () {
  var body = [
    '::card{type="site" url="https://a.com" title="A"}',
    '::card{type="site" url="https://b.com" title="B"}',
    '::card{type="github" repo="o/r"}'
  ].join('\n');
  var parsed = card.parseGroupBody(body);
  assert.equal(parsed.count, 2);
  assert.match(parsed.inner, /class="card-site"/);
});

test('卡片围栏正则', function () {
  assert.ok(card.CARD_RULE.exec('::card{type="github" repo="o/r"}\n'));
  assert.ok(card.CARD_GROUP_RULE.exec(':::card-group[组]\n::card{type="site" url="https://a.com" title="A"}\n:::\n'));
});
