'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var fs = require('node:fs');
var path = require('node:path');

var root = path.join(__dirname, '..', '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('文章页不再引入 jQuery / fancybox / cdnjs', function () {
  var ejs = read('themes/ink/layout/post.ejs');
  assert.doesNotMatch(ejs, /jquery/i);
  assert.doesNotMatch(ejs, /fancybox/i);
  assert.doesNotMatch(ejs, /cdnjs/);
});

test('CSP 不再白名单 cdnjs', function () {
  var csp = read('scripts/csp.js');
  assert.doesNotMatch(csp, /cdnjs/);
});

test('ink.js 自研灯箱，不再依赖 jQuery / fancybox', function () {
  var js = read('themes/ink/source/js/ink.js');
  assert.doesNotMatch(js, /jQuery|fancybox|afterClose\.fb|data-fancybox/);
  assert.match(js, /ink-lb/);
});

test('主题样式不再使用 fancybox 类名', function () {
  var css = read('themes/ink/source/css/style.min.css');
  assert.doesNotMatch(css, /fancybox/);
  assert.match(css, /\.ink-lb\b/);
});
