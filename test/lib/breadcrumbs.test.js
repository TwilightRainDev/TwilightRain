'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var lib = require('../../scripts/lib/breadcrumbs');

test('无分类：首页 + 当前标题', function () {
  var items = lib.buildBreadcrumbItems([], { title: 'Hello' });
  assert.deepEqual(items, [
    { label: '首页', path: '/' },
    { label: 'Hello', path: null }
  ]);
});

test('扁平分类保持顺序', function () {
  var items = lib.buildBreadcrumbItems(
    [{ name: '技术笔记', path: '/categories/技术笔记/' }],
    { title: '某文' }
  );
  assert.equal(items.length, 3);
  assert.equal(items[1].label, '技术笔记');
  assert.equal(items[1].path, '/categories/技术笔记/');
  assert.equal(items[2].path, null);
});

test('父子分类按根到叶排序', function () {
  var parent = { _id: 'p1', name: '技术', path: '/categories/技术/', parent: null };
  var child = { _id: 'c1', name: '前端', path: '/categories/技术/前端/', parent: 'p1' };
  var ordered = lib.orderCategoriesRootToLeaf([child, parent]);
  assert.deepEqual(ordered.map(function (c) { return c.name; }), ['技术', '前端']);
  var items = lib.buildBreadcrumbItems([child, parent], { title: 'Vite 笔记' });
  assert.deepEqual(items.map(function (x) { return x.label; }), ['首页', '技术', '前端', 'Vite 笔记']);
});
