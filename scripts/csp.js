/**
 * 安全头配置：CSP / X-Content-Type-Options / Referrer-Policy
 *
 * 生产模式（Cloudflare Pages）：after_generate 阶段写入 public/_headers，
 * Cloudflare Pages 会自动读取输出目录中的 _headers 文件并附加到响应。
 * 这样安全策略随代码入库，无需在 Dashboard 手动配置。
 *
 * 注意：不注册 hexo server 的开发模式响应头——hexo-server 3.x 的
 * server_middleware 过滤器在 scripts/ 加载（load()）之前就已执行，
 * 脚本注册的中间件赶不上首轮请求；开发预览以生产头为准即可。
 */
'use strict';

var fs = require('hexo-fs');

// 统一的安全头策略
var CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://giscus.app https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
  "img-src 'self' https: data:",
  "font-src 'self'",
  "frame-src https://giscus.app",
  "connect-src 'self'",
  "base-uri 'self'"
].join('; ');

// 生产模式：构建完成后写入 public/_headers（Cloudflare Pages 约定文件）
hexo.extend.filter.register('after_generate', function () {
  var lines = [
    '/*',
    '  Content-Security-Policy: ' + CSP_POLICY,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin'
  ].join('\n');

  return fs.writeFile(hexo.public_dir + '_headers', lines + '\n');
});
