'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var lib = require('../../scripts/lib/series-groups');
var blocks = require('../../scripts/lib/series-blocks');

test('parseSeriesName 优先显式 name，否则回退 front matter', function () {
  assert.equal(blocks.parseSeriesName('name="教程"', ''), '教程');
  assert.equal(blocks.parseSeriesName('', '写作特性验收'), '写作特性验收');
  assert.equal(blocks.parseSeriesName('name="教程"', '写作特性验收'), '教程');
});

test('replaceSeriesBlocks 无 ::series 时原样返回', function () {
  var input = 'hello\n\nworld';
  assert.equal(blocks.replaceSeriesBlocks(input, { path: '/a/', series: '教程' }, function () {
    return '<nav></nav>';
  }), input);
});

test('replaceSeriesBlocks 替换 ::series 并传入当前 path', function () {
  var seen = null;
  var out = blocks.replaceSeriesBlocks('前文\n\n::series\n\n后文', {
    path: '2026/08/17/blog-writing-features-part2/',
    series: '写作特性验收'
  }, function (name, path) {
    seen = { name: name, path: path };
    return '<nav class="post-series"></nav>';
  });
  assert.deepEqual(seen, {
    name: '写作特性验收',
    path: '2026/08/17/blog-writing-features-part2/'
  });
  assert.match(out, /<nav class="post-series"><\/nav>/);
});

test('buildSeriesGroups 按 series 聚合', function () {
  var groups = lib.buildSeriesGroups([
    { title: 'A', path: '/a/', date: 2, series: '教程' },
    { title: 'B', path: '/b/', date: 1, series: '教程' }
  ]);
  assert.equal(groups['教程'].length, 2);
});
