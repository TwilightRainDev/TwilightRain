/**
 * 构建期外链安全与邮箱混淆（拍板 M7）。
 */
'use strict';

var externalLinks = require('./lib/external-links');

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content) return data;
  data.content = externalLinks.processExternalLinks(data.content);
  return data;
});
