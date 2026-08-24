/**
 * 站点卡构建期截图（拍板 M5，可选）。
 *
 * after_post_render 阶段尝试用 Playwright 为占位截图（data-site-url）
 * 生成静态图；CF Pages 无浏览器时静默跳过，保留占位 SVG。
 *
 * 缓存目录：source/img/site-screenshots/（gitignore，构建产物）
 */
'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

if (process.platform === 'win32' && !process.env.PLAYWRIGHT_BROWSERS_PATH &&
    fs.existsSync('D:/work_temp/ms-playwright')) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = 'D:/work_temp/ms-playwright';
}

var PLACEHOLDER = '/img/site-card-placeholder.svg';
var IMG_RE = /<img\b[^>]*class="[^"]*cs-cover-img--placeholder[^"]*"[^>]*>/gi;

function siteKey(url) {
  return crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
}

function parseAttr(tag, name) {
  var re = new RegExp('\\s' + name + '="([^"]*)"');
  var m = tag.match(re);
  return m ? m[1] : '';
}

function setAttr(tag, name, value) {
  if (new RegExp('\\s' + name + '="').test(tag)) {
    return tag.replace(new RegExp('\\s' + name + '="[^"]*"'), ' ' + name + '="' + value + '"');
  }
  return tag.replace(/\s*\/?>$/, ' ' + name + '="' + value + '"$&');
}

var browserPromise = null;

function getBrowser() {
  if (browserPromise) return browserPromise;
  browserPromise = (async function () {
    var playwright;
    try {
      playwright = require('playwright');
    } catch (e) {
      console.warn('[screenshot-cards] playwright 不可用，跳过站点截图:', e.message);
      return null;
    }
    try {
      return await playwright.chromium.launch({ headless: true });
    } catch (e) {
      console.warn('[screenshot-cards] 浏览器启动失败，跳过站点截图:', e.message);
      return null;
    }
  })();
  return browserPromise;
}

async function captureScreenshot(url, outAbs) {
  var browser = await getBrowser();
  if (!browser) return false;
  var page;
  try {
    page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(800);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    await page.screenshot({ path: outAbs, type: 'jpeg', quality: 82 });
    return true;
  } catch (e) {
    console.warn('[screenshot-cards] 截图失败 ' + url + ':', e.message);
    return false;
  } finally {
    if (page) await page.close().catch(function () {});
  }
}

function relativePublicPath(absPath, rootDir) {
  var rel = path.relative(path.join(rootDir, 'source', 'img', 'site-screenshots'), absPath)
    .replace(/\\/g, '/');
  return '/img/site-screenshots/' + rel;
}

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('cs-cover-img--placeholder') === -1) return data;

  var rootDir = hexo.base_dir;
  var cacheDir = path.join(rootDir, 'source', 'img', 'site-screenshots');
  var tags = data.content.match(IMG_RE);
  if (!tags || !tags.length) return data;

  var tasks = tags.map(function (tag) {
    var url = parseAttr(tag, 'data-site-url');
    if (!url || !/^https?:\/\//i.test(url)) return Promise.resolve({ tag: tag, next: tag });

    var key = siteKey(url);
    var outAbs = path.join(cacheDir, key + '.jpg');
    var publicPath = relativePublicPath(outAbs, rootDir);

    if (fs.existsSync(outAbs) && fs.statSync(outAbs).size > 0) {
      var cached = setAttr(tag, 'src', publicPath);
      cached = cached.replace(/\sdata-site-url="[^"]*"/, '');
      cached = cached.replace(' cs-cover-img--placeholder', '');
      return Promise.resolve({ tag: tag, next: cached });
    }

    return captureScreenshot(url, outAbs).then(function (ok) {
      if (!ok) return { tag: tag, next: tag };
      var next = setAttr(tag, 'src', publicPath);
      next = next.replace(/\sdata-site-url="[^"]*"/, '');
      next = next.replace(' cs-cover-img--placeholder', '');
      return { tag: tag, next: next };
    });
  });

  return Promise.all(tasks).then(function (results) {
    var html = data.content;
    results.forEach(function (item) {
      if (item.next !== item.tag) {
        html = html.replace(item.tag, item.next);
      }
    });
    data.content = html;
    return data;
  });
});

module.exports = {
  siteKey: siteKey,
  PLACEHOLDER: PLACEHOLDER
};
