/**
 * 安全头配置：CSP / X-Content-Type-Options / Referrer-Policy
 * after_generate 写 public/_headers，Cloudflare Pages 自动读取输出目录的这个文件附加到
 * 响应，不必去 Dashboard 手动配置。
 *
 * 不注册 hexo server 的开发响应头：hexo-server 3.x 的 server_middleware 过滤器在
 * scripts/ 加载（load()）之前就已执行，脚本注册的中间件赶不上首轮请求；开发预览以生产头为准。
 */
'use strict';

var fs = require('hexo-fs');

var CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://giscus.app",
  // giscus.app 的 default.css（注入的 <link> 样式表）必须白名单，否则 iframe 宽度回退到 300px
  "style-src 'self' 'unsafe-inline' https://giscus.app",
  "img-src 'self' https: data:",
  "font-src 'self'",
  "frame-src https://giscus.app https://player.bilibili.com https://www.bilibili.com",
  // api.github.com：GitHub 仓库卡片数据（ink.js fetch，唯一第三方 fetch
  // 例外；localStorage 缓存 1h + 失败静默回退静态）
  "connect-src 'self' https://api.github.com",
  "base-uri 'self'"
].join('; ');

hexo.extend.filter.register('after_generate', function () {
  var lines = [
    '/*',
    '  Content-Security-Policy: ' + CSP_POLICY,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin'
  ].join('\n');

  return fs.writeFile(hexo.public_dir + '_headers', lines + '\n');
});
