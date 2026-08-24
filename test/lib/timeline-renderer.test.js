'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var renderer = require('../../scripts/lib/timeline-renderer');

test('renderPostTimeline 空节点输出错误提示', function () {
  var html = renderer.renderPostTimeline({ headline: '版本史', items: [] });
  assert.equal(
    html,
    '<p class="post-timeline-error">[WARN] 无效的时间线语法，应为 :::timeline + "--- 标题" 分隔 + :::</p>'
  );
});

test('renderPostTimeline 输出 headline 与已解析正文', function () {
  var html = renderer.renderPostTimeline({
    headline: '版本史',
    items: [{ title: 'v1', bodyHtml: '<p>初版</p>' }]
  });
  assert.equal(
    html,
    '<div class="post-timeline">\n' +
      '<div class="post-timeline-headline">版本史</div>\n' +
      '<div class="post-timeline-item">\n' +
      '<div class="post-timeline-title">v1</div>\n' +
      '<div class="post-timeline-body"><p>初版</p></div>\n' +
      '</div>\n' +
      '</div>'
  );
});

test('renderPostTimeline 转义标题中的 HTML', function () {
  var html = renderer.renderPostTimeline({
    headline: '<script>',
    items: [{ title: 'a&b', bodyHtml: '<p>ok</p>' }]
  });
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /a&amp;b/);
  assert.doesNotMatch(html, /<script>/);
});

test('renderPostTimeline 无 headline 时不输出 headline 节点', function () {
  var html = renderer.renderPostTimeline({
    headline: '',
    items: [{ title: 'v1', bodyHtml: '' }]
  });
  assert.doesNotMatch(html, /post-timeline-headline/);
});

test('renderPageTimeline 无记录', function () {
  assert.equal(renderer.renderPageTimeline([]), '<p>暂无记录。</p>');
  assert.equal(renderer.renderPageTimeline(null), '<p>暂无记录。</p>');
});

test('renderPageTimeline 按日期降序并按年分组', function () {
  var html = renderer.renderPageTimeline([
    { date: '2025-12-01', title: '旧事', desc: '去年' },
    { date: '2026-08-17', title: '新事', desc: '今年' },
    { date: '2026-01-02', title: '年初', desc: '' }
  ]);
  assert.match(html, /<h2 class="timeline-year">2026<\/h2>/);
  assert.match(html, /<h2 class="timeline-year">2025<\/h2>/);
  assert.ok(html.indexOf('2026') < html.indexOf('2025'));
  assert.ok(html.indexOf('新事') < html.indexOf('年初'));
  assert.match(html, /<span class="timeline-date">08-17<\/span>/);
  assert.match(html, /<p class="timeline-desc">今年<\/p>/);
  assert.match(html, /<span class="timeline-title">年初<\/span>\s*<\/div>/);
});

test('renderPageTimeline 转义标题与描述', function () {
  var html = renderer.renderPageTimeline([
    { date: '2026-08-01', title: '<b>x</b>', desc: 'a&b' }
  ]);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(html, /a&amp;b/);
});
