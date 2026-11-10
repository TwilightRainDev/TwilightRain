'use strict';

/**
 * 暗色下压暗浅底图的约定（构建期判定 + 样式层落规则）。
 *
 * 背景：暗色主题原本只管文字和底色，图片像素一个没动。本站正文大量是白底截图，
 * 21 张里 14 张平均亮度 128 及以上，最亮的一张近白像素占 73.5%，深色页面上一整块亮面，
 * 比正文文字（#f0f0f0）还亮。
 *
 * 契约：
 *   A. 亮底判定按 Rec.709 加权、0-255 量纲，阈值 128 是亮底与暗底的分界。
 *   B. 只给站内图片（/img/ 开头）打类：亮度要读本地文件，外链读不到就不判。
 *   C. 样式层只在 [data-theme="dark"] 下压，浅色主题的图片像素不变；
 *      系统深色的首屏兜底块里那条也必须带 :not([data-theme]) 守卫
 *      （否则系统深色 + 站内选浅色时，兜底会命中并压暗）。
 */

var assert = require('node:assert/strict');
var test = require('node:test');
var fs = require('node:fs');
var path = require('node:path');

var imageDim = require('../../scripts/lib/image-dim');

var root = path.join(__dirname, '..', '..');
var CSS_PATH = path.join(root, 'themes', 'ink', 'source', 'css', 'style.min.css');

test('感知亮度按 Rec.709 加权', function () {
  assert.equal(Math.round(imageDim.perceptualLuminance({ r: 255, g: 255, b: 255 })), 255);
  assert.equal(Math.round(imageDim.perceptualLuminance({ r: 0, g: 0, b: 0 })), 0);
  // 纯绿比纯红亮，纯蓝最暗
  var green = imageDim.perceptualLuminance({ r: 0, g: 255, b: 0 });
  var red = imageDim.perceptualLuminance({ r: 255, g: 0, b: 0 });
  var blue = imageDim.perceptualLuminance({ r: 0, g: 0, b: 255 });
  assert.ok(green > red && red > blue, '通道权重应为 G > R > B');
});

test('阈值 128 是亮底与暗底的分界', function () {
  assert.equal(imageDim.isBrightLuminance(127.9), false);
  assert.equal(imageDim.isBrightLuminance(128), true);
  assert.equal(imageDim.BRIGHT_THRESHOLD, 128);
});

test('只认站内 /img/ 路径', function () {
  assert.equal(imageDim.isSiteImageSrc('/img/360px/a.jpg'), true);
  assert.equal(imageDim.isSiteImageSrc('https://example.com/a.jpg'), false);
  assert.equal(imageDim.isSiteImageSrc('//example.com/a.jpg'), false);
  assert.equal(imageDim.isSiteImageSrc('data:image/png;base64,AAA'), false);
  assert.equal(imageDim.isSiteImageSrc('images/a.jpg'), false);
  assert.equal(imageDim.isSiteImageSrc(''), false);
});

test('收集站内图片 src 并去重', function () {
  var html = [
    '<img src="/img/360px/a.jpg" alt="甲">',
    '<img src="/img/360px/a.jpg" alt="甲重复">',
    '<img src="https://example.com/b.png" alt="外链">',
    '<img src="/img/360px/c.png" alt="">'
  ].join('\n');
  assert.deepEqual(imageDim.collectImageSrcs(html), ['/img/360px/a.jpg', '/img/360px/c.png']);
});

test('只给亮底图打类，其余原样返回', function () {
  var html = [
    '<img src="/img/360px/bright.png" alt="白底截图">',
    '<img src="/img/360px/dark.png" alt="深色截图">',
    '<img src="https://example.com/x.png" alt="外链">'
  ].join('\n');
  var out = imageDim.applyDimClasses(html, function (src) {
    return src === '/img/360px/bright.png';
  });
  assert.match(out, /<img src="\/img\/360px\/bright\.png" alt="白底截图" class="img-dim">/);
  assert.match(out, /<img src="\/img\/360px\/dark\.png" alt="深色截图">/);
  assert.match(out, /<img src="https:\/\/example\.com\/x\.png" alt="外链">/);
});

test('已有 class 时追加，不覆盖', function () {
  var html = '<img class="lazy" src="/img/360px/a.png" alt="">';
  var out = imageDim.applyDimClasses(html, function () { return true; });
  assert.match(out, /class="lazy img-dim"/);
  // 重复调用不叠加
  assert.equal(imageDim.applyDimClasses(out, function () { return true; }), out);
});

test('自闭合写法也能加上属性', function () {
  var html = '<img src="/img/360px/a.png" />';
  assert.match(imageDim.applyDimClasses(html, function () { return true; }), /class="img-dim" \/>/);
});

function readCss() {
  return fs.readFileSync(CSS_PATH, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

test('暗色主题下压暗 .img-dim，浅色主题不碰', function () {
  var css = readCss();
  var dark = /\[data-theme="dark"\]\s*img\.img-dim\s*\{([^}]*)\}/.exec(css);
  assert.ok(dark, 'style.min.css 缺少 [data-theme="dark"] img.img-dim 规则');
  assert.match(dark[1], /filter:\s*brightness\(0\.85\)/, '暗色下的 .img-dim 必须压亮度到 0.85');

  // 压暗规则不许出现在暗色作用域之外：浅色主题的图片像素必须原样
  var outside = css.replace(/\[data-theme="dark"\][^{]*img\.img-dim[^{]*\{[^}]*\}/g, '');
  var stray = outside.match(/[^{}]*img\.img-dim[^{}]*\{/g) || [];
  stray.forEach(function (sel) {
    assert.ok(
      sel.includes(':not([data-theme'),
      '这条 img.img-dim 规则没有暗色作用域也没有 data-theme 守卫：' + sel.trim()
    );
  });
});

test('系统深色兜底块里的压暗规则带 data-theme 守卫', function () {
  var css = readCss();
  var re = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/g;
  var found = 0;
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
    var body = css.slice(open + 1, i);
    Array.from(body.matchAll(/([^{}]+)\{/g)).forEach(function (s) {
      var sel = s[1].trim();
      if (!sel.includes('img.img-dim')) return;
      found++;
      assert.ok(
        sel.includes(':not([data-theme'),
        '兜底块里的压暗规则缺 data-theme 守卫：' + sel +
          ' —— 系统深色时会把站内选「浅色」也一起压暗'
      );
    });
  }
  assert.ok(found > 0, '首屏兜底块里没有 img.img-dim 规则：系统深色的访客会先看到满亮的图再变暗');
});
