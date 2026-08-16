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
  '/page/1 / 301',
  // 2026-08-16 文章统一英文 kebab-case 命名：中文文件名 -> 英文 slug
  // （明文与百分号编码双份，覆盖 CF 对请求路径的不同匹配行为）
  '/2026/08/13/如果我想成为时间管理大师/ /2026/08/13/time-management-master/ 301',
  '/2026/08/13/%E5%A6%82%E6%9E%9C%E6%88%91%E6%83%B3%E6%88%90%E4%B8%BA%E6%97%B6%E9%97%B4%E7%AE%A1%E7%90%86%E5%A4%A7%E5%B8%88/ /2026/08/13/time-management-master/ 301',
  '/2026/08/13/带上她的眼睛。/ /2026/08/13/with-her-eyes/ 301',
  '/2026/08/13/%E5%B8%A6%E4%B8%8A%E5%A5%B9%E7%9A%84%E7%9C%BC%E7%9D%9B%E3%80%82/ /2026/08/13/with-her-eyes/ 301'
].join('\n');

hexo.extend.filter.register('after_generate', function () {
  return fs.writeFile(hexo.public_dir + '_redirects', REDIRECTS + '\n');
});
