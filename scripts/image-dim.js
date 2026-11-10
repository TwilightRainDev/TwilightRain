/**
 * 正文图亮底判定：读本地文件算平均亮度，亮底的图在 HTML 里带上 class="img-dim"。
 *
 * 暗色主题据此把浅底图压暗（见 style.min.css），浅色主题不受影响。
 * src 形如 /img/360px/xxx.jpg，读的是 source 下同名文件，也就是页面上实际展示的那张。
 * 文件不存在就跳过：不判亮度，也不让构建失败。
 */
'use strict';

var fs = require('fs');
var path = require('path');
var imageDim = require('./lib/image-dim');

// src → Promise<number|null>：同一次构建里每张图只算一遍
var luminanceCache = new Map();

function readLuminance(src) {
  var sourceRoot = path.join(hexo.base_dir, 'source');
  var abs = path.resolve(sourceRoot, src.replace(/^\//, ''));
  // 只读 source 下的文件：src 里带 ../ 时不追出去
  if (abs.indexOf(sourceRoot + path.sep) !== 0) return Promise.resolve(null);
  if (!fs.existsSync(abs)) return Promise.resolve(null);
  return Promise.resolve()
    .then(function () {
      return require('sharp')(abs).stats();
    })
    .then(function (stats) {
      return imageDim.perceptualLuminance({
        r: stats.channels[0].mean,
        g: stats.channels[1].mean,
        b: stats.channels[2].mean
      });
    })
    .catch(function (err) {
      hexo.log.warn('image-dim: 读取失败，跳过 ' + src + '（' + err.message + '）');
      return null;
    });
}

function luminanceOf(src) {
  if (!luminanceCache.has(src)) luminanceCache.set(src, readLuminance(src));
  return luminanceCache.get(src);
}

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('<img') === -1) return data;
  var srcs = imageDim.collectImageSrcs(data.content);
  if (!srcs.length) return data;

  return Promise.all(srcs.map(luminanceOf)).then(function (values) {
    var bright = {};
    srcs.forEach(function (src, i) {
      if (values[i] !== null && imageDim.isBrightLuminance(values[i])) bright[src] = true;
    });
    data.content = imageDim.applyDimClasses(data.content, function (src) {
      return !!bright[src];
    });
    return data;
  });
});
