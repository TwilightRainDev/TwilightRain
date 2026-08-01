/**
 * 安全头配置：CSP / X-Content-Type-Options / Referrer-Policy
 *
 * 两个作用：
 *   1. 开发模式（hexo server）：通过 server:set-headers 过滤器直接附加响应头
 *   2. 生产模式（Cloudflare Pages）：after_generate 阶段写入 public/_headers，
 *      Cloudflare Pages 会自动读取输出目录中的 _headers 文件并附加到响应。
 *      这样安全策略随代码入库，无需在 Dashboard 手动配置。
 */
'use strict';

var fs = require('hexo-fs');

// 统一的安全头策略（开发/生产共用一份定义）
var CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://giscus.app https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://chinese-fonts-cdn.deno.dev https://cdnjs.cloudflare.com",
  "img-src 'self' https: data:",
  "font-src 'self' https://chinese-fonts-cdn.deno.dev",
  "frame-src https://giscus.app",
  "connect-src 'self'",
  "base-uri 'self'"
].join('; ');

// 1) 开发模式：hexo server 直接附加响应头
hexo.extend.filter.register('server:set-headers', function (headers, req, res) {
  res.setHeader('Content-Security-Policy', CSP_POLICY);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// 2) 生产模式：构建完成后写入 public/_headers（Cloudflare Pages 约定文件）
hexo.extend.filter.register('after_generate', function () {
  var lines = [
    '/*',
    '  Content-Security-Policy: ' + CSP_POLICY,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin'
  ].join('\n');

  return fs.writeFile(hexo.public_dir + '_headers', lines + '\n');
});
