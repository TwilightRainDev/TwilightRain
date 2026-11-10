/**
 * 正文图亮底判定：给浅底图打 .img-dim，暗色主题据此压暗。
 *
 * 亮度按 Rec.709 加权，取 0-255 量纲；阈值 128 是「亮底 / 暗底」的分界。
 * 浅底图在深色页面上是一整块亮面，比正文文字（#f0f0f0）还亮，所以只压这一档；
 * 深色截图本来就贴着底色，压了反而发灰。
 *
 * 判定放在构建期而不是浏览器里：浏览器要先解码才能算均值，暗色下每张图会先满亮
 * 再变暗，闪一下。构建期写进 class，首屏就是最终亮度。
 */
'use strict';

var BRIGHT_THRESHOLD = 128;
var IMG_RE = /<img\b[^>]*>/gi;

/**
 * @param {{r: number, g: number, b: number}} rgb 各通道均值，0-255
 * @returns {number} 感知亮度，0-255
 */
function perceptualLuminance(rgb) {
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

/**
 * @param {number} luminance perceptualLuminance 的结果
 * @returns {boolean} 亮到需要压暗
 */
function isBrightLuminance(luminance) {
  return luminance >= BRIGHT_THRESHOLD;
}

function parseSrc(tag) {
  var m = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i);
  if (!m) return '';
  return (m[2] != null ? m[2] : m[3]) || '';
}

/**
 * 站内图片路径（/img/ 开头）。外链、data:、相对路径一律不管：
 * 亮度要在构建期读本地文件，读不到的就不判。
 */
function isSiteImageSrc(src) {
  return /^\/img\//.test(String(src || '').trim());
}

/**
 * @param {string} html 文章正文
 * @returns {string[]} 需要判定的站内图片 src，去重
 */
function collectImageSrcs(html) {
  var seen = {};
  var out = [];
  var match;
  IMG_RE.lastIndex = 0;
  while ((match = IMG_RE.exec(html))) {
    var src = parseSrc(match[0]);
    if (!isSiteImageSrc(src) || seen[src]) continue;
    seen[src] = true;
    out.push(src);
  }
  return out;
}

function addDimClass(tag) {
  var m = tag.match(/\bclass\s*=\s*("([^"]*)"|'([^']*)')/i);
  if (m) {
    var current = (m[2] != null ? m[2] : m[3]) || '';
    if (/(^|\s)img-dim(\s|$)/.test(current)) return tag;
    var merged = (current.trim() + ' img-dim').trim();
    return tag.replace(m[0], 'class="' + merged + '"');
  }
  return tag.replace(/\s*\/?>$/, ' class="img-dim"$&');
}

/**
 * @param {string} html 文章正文
 * @param {function(string): boolean} isBright src → 是否亮底
 * @returns {string} 亮底图带上 .img-dim 的正文
 */
function applyDimClasses(html, isBright) {
  if (!html || html.indexOf('<img') === -1) return html;
  return html.replace(IMG_RE, function (tag) {
    var src = parseSrc(tag);
    if (!isSiteImageSrc(src) || !isBright(src)) return tag;
    return addDimClass(tag);
  });
}

module.exports = {
  BRIGHT_THRESHOLD: BRIGHT_THRESHOLD,
  perceptualLuminance: perceptualLuminance,
  isBrightLuminance: isBrightLuminance,
  isSiteImageSrc: isSiteImageSrc,
  collectImageSrcs: collectImageSrcs,
  applyDimClasses: applyDimClasses
};
