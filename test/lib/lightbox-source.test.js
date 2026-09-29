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

// 主题客户端脚本全集：入口 + js/ink/ 下的模块。
// 跳过 vendored 的 mermaid.min.js 与 mathjax/（第三方产物，与灯箱无关）。
function themeJs() {
  var dir = path.join(root, 'themes', 'ink', 'source', 'js');
  var files = [];
  var all = fs.readdirSync(dir);
  var i;
  for (i = 0; i < all.length; i++) {
    if (all[i].endsWith('.js') && all[i] !== 'mermaid.min.js') {
      files.push(path.join(dir, all[i]));
    }
  }
  var modDir = path.join(dir, 'ink');
  if (fs.existsSync(modDir)) {
    var mods = fs.readdirSync(modDir);
    for (i = 0; i < mods.length; i++) {
      if (mods[i].endsWith('.js')) files.push(path.join(modDir, mods[i]));
    }
  }
  return files.map(function (f) { return fs.readFileSync(f, 'utf8'); }).join('\n');
}

test('主题脚本已无 jQuery / fancybox，自研灯箱在位', function () {
  var js = themeJs();
  assert.ok(js.length > 0, '没扫到主题脚本');
  assert.doesNotMatch(js, /jQuery|fancybox|afterClose\.fb|data-fancybox/);
  assert.match(js, /ink-lb/);
});

test('主题样式不再使用 fancybox 类名', function () {
  var css = read('themes/ink/source/css/style.min.css');
  assert.doesNotMatch(css, /fancybox/);
  assert.match(css, /\.ink-lb\b/);
});
