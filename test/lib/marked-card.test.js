'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var card = require('../../scripts/marked-card');

test('parseCardType 只接受 github / link', function () {
  assert.equal(card.parseCardType({ type: 'github' }), 'github');
  assert.equal(card.parseCardType({ type: 'link' }), 'link');
  assert.equal(card.parseCardType({ type: 'site' }), '');
  assert.equal(card.parseCardType({ type: 'intro' }), '');
  assert.equal(card.parseCardType({ type: 'nope' }), '');
});

test('::card github 输出 card-github', function () {
  var html = card.renderGithubCard({ repo: 'owner/repo', desc: '说明' });
  assert.match(html, /class="card-github"/);
  assert.match(html, /data-repo="owner\/repo"/);
});

test('::card github 缺 repo 输出可见 WARN', function () {
  var html = card.renderGithubCard({});
  assert.match(html, /card-error/);
  assert.match(html, /\[WARN\]/);
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

test('::card link 省略 title 时显示域名', function () {
  var html = card.renderLinkCard({ url: 'https://example.com/x' });
  assert.match(html, /class="lc-title">example\.com</);
});

test('::card link 拒绝非 http(s) url', function () {
  assert.match(card.renderLinkCard({ url: '/about/' }), /card-error/);
  assert.match(card.renderLinkCard({ url: 'javascript:alert(1)' }), /card-error/);
});

test('卡片围栏正则', function () {
  assert.ok(card.CARD_RULE.exec('::card{type="github" repo="o/r"}\n'));
  assert.equal(card.CARD_RULE.exec(':::card-group\n'), null);
});
