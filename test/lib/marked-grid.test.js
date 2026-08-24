'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var grid = require('../../scripts/marked-grid');

test('parseGridCols 默认与边界', function () {
  assert.equal(grid.parseGridCols(undefined), 2);
  assert.equal(grid.parseGridCols(''), 2);
  assert.equal(grid.parseGridCols('3'), 3);
  assert.equal(grid.parseGridCols('0'), 2);
  assert.equal(grid.parseGridCols('99'), 6);
});

test(':::grid 围栏正则', function () {
  var RULE = /^:::grid(?:\[(\d+)\])?[ \t]*\n([\s\S]*?)\n:::/i;
  var sample = ':::grid[3]\n![a](/img/a.jpg)\n![b](/img/b.jpg)\n:::';
  var m = RULE.exec(sample);
  assert.ok(m);
  assert.equal(m[1], '3');
  assert.match(m[2], /!\[a\]/);
});
