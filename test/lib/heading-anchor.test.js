'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var anchor = require('../../scripts/lib/heading-anchor');

test('slugify 与 ink.js TOC 同规则', function () {
  assert.equal(anchor.slugify('做过什么'), '做过什么');
  assert.equal(anchor.slugify(' Hello, World! '), 'hello-world');
  assert.equal(anchor.slugify(''), '');
});

test('stripHeaderlinks 剥掉空 headerlink', function () {
  var html = '<h2 id="背景"><a href="#背景" class="headerlink" title="背景"></a>背景</h2>';
  assert.equal(anchor.stripHeaderlinks(html), '<h2 id="背景">背景</h2>');
});

test('stripHeaderlinks 不动普通链接', function () {
  var html = '<a href="/about/" class="post-link">关于</a>';
  assert.equal(anchor.stripHeaderlinks(html), html);
});

test('applyHeadingAnchors 剥 headerlink 并注入单个可见锚点', function () {
  var html = '<h2 id="背景"><a href="#背景" class="headerlink" title="背景"></a>背景</h2>';
  var out = anchor.applyHeadingAnchors(html);
  assert.equal(
    out,
    '<h2 id="背景"><a class="heading-anchor" href="#背景" aria-hidden="true">#</a>背景</h2>'
  );
  assert.equal((out.match(/<a\b/g) || []).length, 1);
});

test('applyHeadingAnchors 复用现有 id，无 id 时按 slug 补', function () {
  var out = anchor.applyHeadingAnchors('<h3>第一阶段：AI</h3>');
  assert.match(out, /^<h3 id="第一阶段-ai">/);
  assert.match(out, /class="heading-anchor" href="#第一阶段-ai"/);
});

test('applyHeadingAnchors 幂等：已有 heading-anchor 不重复注入', function () {
  var once = anchor.applyHeadingAnchors('<h2 id="a">标题</h2>');
  var twice = anchor.applyHeadingAnchors(once);
  assert.equal(twice, once);
});

test('applyHeadingAnchors 无文本标题不注入', function () {
  var html = '<h2 id="x"><img src="/a.png"></h2>';
  // img 无文本可 slug，但已有 id 时仍会注入锚点
  assert.match(anchor.applyHeadingAnchors(html), /heading-anchor/);
  var noId = '<h2><img src="/a.png"></h2>';
  assert.equal(anchor.applyHeadingAnchors(noId), noId);
});
