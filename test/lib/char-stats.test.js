'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var computeCharStats = require('../../scripts/lib/char-stats').computeCharStats;

function stripHTML(html) {
  return String(html).replace(/<[^>]+>/g, '');
}

test('空正文至少 1 分钟，字数为 0', function () {
  var s = computeCharStats('', { stripHTML: stripHTML });
  assert.equal(s.charCount, 0);
  assert.equal(s.readingMinutes, 1);
});

test('去标签后去空白计中文字符', function () {
  var s = computeCharStats('<p>你好 世界</p>', { stripHTML: stripHTML });
  assert.equal(s.charCount, 4);
  assert.equal(s.readingMinutes, 1);
});

test('约 400 字计 1 分钟，800 字计 2 分钟', function () {
  var fourHundred = '字'.repeat(400);
  var eightHundred = '字'.repeat(800);
  assert.equal(computeCharStats(fourHundred, { stripHTML: stripHTML }).readingMinutes, 1);
  assert.equal(computeCharStats(eightHundred, { stripHTML: stripHTML }).readingMinutes, 2);
  assert.equal(computeCharStats(eightHundred, { stripHTML: stripHTML }).charCount, 800);
});

test('缺少 stripHTML 时抛错', function () {
  assert.throws(function () {
    computeCharStats('x', {});
  }, /stripHTML/);
});
