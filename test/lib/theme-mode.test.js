'use strict';

/**
 * 主题判定的静态契约（样式层，挡的是「深色/浅色互相打架」这一类回归）。
 *
 * 背景（2026-10 的两个线上 BUG）：
 *   1. 列表模式下文章标题在黑底上仍是黑字——`[data-theme="dark"]` 里把文字色
 *      写成了 `var(--color-light)`，而 `--color-light` 在本主题是**背景色**
 *      （深色主题下 = #1a1a1a），于是字与底同色。
 *   2. 系统深色 + 站内选「浅色」无效——style.min.css 里有 4 处
 *      `@media (prefers-color-scheme: dark)`，其中一处是 :root 变量兜底，
 *      没有 `:not([data-theme])` 守卫，JS 写下的浅色偏好被它盖掉。
 *
 * 契约（本文件断言）：
 *   A. 主题单一来源是 `html[data-theme=light|dark]`；`@media (prefers-color-scheme: dark)`
 *      只能用于 JS 执行前的首屏兜底，且块内每个选择器都必须带 `:not([data-theme...])` 守卫。
 *   B. `--color-light` 是本主题的「背景色」，不得直接当 `color` 用（反色面请走 --code-color）。
 *   C. prefs.js 必须把 light/dark 都显式写进 data-theme，不能靠删属性表达浅色。
 *
 * 只做静态检查：本机无浏览器，媒体查询与 var() 的解析结果拿不到运行时证据。
 */

var assert = require('node:assert/strict');
var test = require('node:test');
var fs = require('node:fs');
var path = require('node:path');

var root = path.join(__dirname, '..', '..');
var CSS_PATH = path.join(root, 'themes', 'ink', 'source', 'css', 'style.min.css');
var PREFS_PATH = path.join(root, 'themes', 'ink', 'source', 'js', 'ink', 'prefs.js');

function readCss() {
  return fs.readFileSync(CSS_PATH, 'utf8');
}

/** 去注释：主题 CSS 注释里会引用选择器本身，不剥掉会误判 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** 取所有 @media (prefers-color-scheme: dark) 块的块内文本（花括号配对，不用正则硬吃嵌套） */
function darkMediaBodies(css) {
  var bodies = [];
  var re = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/g;
  var m;
  while ((m = re.exec(css))) {
    var open = m.index + m[0].length - 1;
    var depth = 0;
    var i = open;
    for (; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    assert.equal(depth, 0, '@media 块花括号未配对：' + m[0]);
    bodies.push(css.slice(open + 1, i));
  }
  return bodies;
}

/** 块内每条规则的「选择器部分」（单层块，选择器里不含花括号） */
function selectorsOf(body) {
  return Array.from(body.matchAll(/([^{}]+)\{/g), function (s) { return s[1].trim(); });
}

test('背景色变量 --color-light 不得当文字色用', function () {
  var css = stripComments(readCss());
  // 允许自定义属性定义（--code-color: var(--color-light)），只挡 color: 声明
  var bad = Array.from(css.matchAll(/(?:^|[;{\s])color:\s*var\(--color-light\)/g));
  assert.equal(
    bad.length,
    0,
    '出现 color: var(--color-light)：--color-light 是背景色，深色主题下等于让字与底同色；' +
      '正文/列表文字请用 var(--color-dark)，反色面（代码块）走 var(--code-color)'
  );
});

test('深色变量在 [data-theme="dark"] 里成对互换', function () {
  var css = stripComments(readCss());
  var m = /\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css);
  assert.ok(m, '找不到 [data-theme="dark"] 的变量块');
  assert.match(m[1], /--color-dark:\s*#/, '[data-theme="dark"] 未定义 --color-dark（文字色）');
  assert.match(m[1], /--color-light:\s*#/, '[data-theme="dark"] 未定义 --color-light（背景色）');
});

test('系统深色兜底的媒体查询块都带 :not([data-theme...]) 守卫', function () {
  var bodies = darkMediaBodies(stripComments(readCss()));
  assert.ok(bodies.length > 0, '一个 @media (prefers-color-scheme: dark) 都没有，本测试已失效，请更新');
  bodies.forEach(function (body, idx) {
    var selectors = selectorsOf(body);
    assert.ok(selectors.length > 0, '第 ' + (idx + 1) + ' 个媒体查询块里没有规则');
    selectors.forEach(function (sel) {
      assert.ok(
        sel.includes(':not([data-theme'),
        '第 ' + (idx + 1) + ' 个媒体查询块的选择器缺 data-theme 守卫：' + sel +
          ' —— 无守卫则系统深色会盖掉站内「浅色」，浅色偏好压不回来'
      );
    });
  });
});

test('prefs.js 把 light / dark 都写进 data-theme', function () {
  var src = fs.readFileSync(PREFS_PATH, 'utf8');
  assert.match(
    src,
    /setAttribute\('data-theme',\s*actual\)/,
    'prefs.js 未把实际主题（含 light）写进 data-theme；' +
      '不写 light 时 CSS 的媒体查询兜底会继续命中，系统深色下选浅色无效'
  );
  assert.ok(
    !/removeAttribute\('data-theme'\)/.test(src),
    "prefs.js 又出现了 removeAttribute('data-theme')：浅色必须显式写 light（见 @media 兜底守卫）"
  );
});
