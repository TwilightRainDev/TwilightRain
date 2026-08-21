/**
 * Hexo before_generate：兜底从 ori/ 生成缺失或过期的 360px 展示图。
 */
'use strict';

var generateThumbs = require('./gen-thumbs').generateThumbs;

hexo.extend.filter.register('before_generate', async function () {
  var root = hexo.base_dir;
  var result = await generateThumbs({
    rootDir: root,
    log: function (m) { hexo.log.info(m); }
  });
  if (result.errors.length) {
    hexo.log.warn('img-thumbs: ' + result.errors.length + ' file(s) failed');
  }
}, 0);
