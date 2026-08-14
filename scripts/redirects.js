/**
 * 重定向配置：Cloudflare Pages _redirects 文件
 *
 * 构建完成后写入 public/_redirects，Cloudflare Pages 会自动读取。
 * 语法：<源路径> <目标路径> <状态码>，规则按顺序匹配第一条命中。
 */
'use strict';

var fs = require('hexo-fs');

var REDIRECTS = [
  // 旧 hello-world 文章 → 关于页（永久重定向，带/不带尾斜杠都覆盖）
  '/2026/07/13/hello-world/ /about/ 301',
  '/2026/07/13/hello-world /about/ 301',
  // Hexo 分页从第 2 页开始（第 1 页即根路径 /），补 /page/1/ 的直觉 URL
  '/page/1/ / 301',
  '/page/1 / 301'
].join('\n');

hexo.extend.filter.register('after_generate', function () {
  return fs.writeFile(hexo.public_dir + '_redirects', REDIRECTS + '\n');
});
