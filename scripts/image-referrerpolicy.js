/**
 * 外链图片 referrerpolicy 防盗链（拍板 M8）。
 *
 * 站内相对路径与 /img/ 不加；data: 不加。
 */
'use strict';

var imageReferrer = require('./lib/image-referrerpolicy');

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content) return data;
  data.content = imageReferrer.processExternalImages(data.content);
  return data;
});
