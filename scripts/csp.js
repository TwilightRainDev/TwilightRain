/**
 * 安全头配置：CSP / HSTS / X-Content-Type-Options / Referrer-Policy
 * after_generate 写 public/_headers，Cloudflare Pages 自动读取输出目录的这个文件附加到
 * 响应，不必去 Dashboard 手动配置。
 *
 * 改这里的头只影响 Cloudflare 上的生产站；hexo server 本地预览不经过 public/_headers。
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
  "base-uri 'self'",
  // 站内没有任何页面需要被别的页面套进 iframe，一律禁掉，防点击劫持。
  // 只约束「被套」这一侧，不影响本站自己嵌 giscus / B 站播放器（那是 frame-src）。
  "frame-ancestors 'none'"
].join('; ');

// 一年有效期，不写 includeSubDomains、不进 preload 列表：
// 加了 includeSubDomains，以后任何子域想跑明文 http 都会被浏览器直接拦死；
// preload 一旦提交进浏览器内置列表，撤回要等版本更新，代价远大于收益。
var HSTS = 'max-age=31536000';

hexo.extend.filter.register('after_generate', function () {
  var lines = [
    '/*',
    '  Content-Security-Policy: ' + CSP_POLICY,
    '  Strict-Transport-Security: ' + HSTS,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin'
  ].join('\n');

  return fs.writeFile(hexo.public_dir + '_headers', lines + '\n');
});
