'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var lib = require('../../scripts/lib/series-groups');

test('buildSeriesGroups 按 series 聚合', function () {
  var groups = lib.buildSeriesGroups([
    { title: 'A', path: '/a/', date: 2, series: '教程' },
    { title: 'B', path: '/b/', date: 1, series: '教程' },
    { title: 'C', path: '/c/', date: 3 }
  ]);
  assert.equal(groups['教程'].length, 2);
  assert.equal(groups['教程'][0].title, 'A');
});

test('sortSeriesItems 默认按 date 升序', function () {
  var sorted = lib.sortSeriesItems([
    { title: '晚', path: '/2/', date: 200 },
    { title: '早', path: '/1/', date: 100 }
  ]);
  assert.deepEqual(sorted.map(function (x) { return x.title; }), ['早', '晚']);
});

test('sortSeriesItems 有 series_index 时优先', function () {
  var sorted = lib.sortSeriesItems([
    { title: '三', path: '/3/', date: 300, seriesIndex: 3 },
    { title: '一', path: '/1/', date: 100, seriesIndex: 1 },
    { title: '二', path: '/2/', date: 200, seriesIndex: 2 }
  ]);
  assert.deepEqual(sorted.map(function (x) { return x.title; }), ['一', '二', '三']);
});
