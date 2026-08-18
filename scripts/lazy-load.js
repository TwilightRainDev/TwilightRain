/**
 * 图片懒加载（2026-08-18，Reimu 批一迁移）：
 * after_post_render 给文章正文 <img> 注入 loading="lazy" + decoding="async"。
 *
 * 机制：构建期属性注入，零前端开销；浏览器对视口内的 lazy 图仍立即加载
 * （首屏无感知差异），视口外的图延迟加载省流量。
 * 首页封面池（index.ejs）已带 loading="lazy"，本脚本只管文章正文；
 * 无 src 的 img（如 data-random-cover 占位）跳过，避免破坏前端随机封面逻辑；
 * 已带 loading 的 img 跳过（不覆盖作者显式意图）。
 */
'use strict';

var IMG_RE = /<img\b[^>]*>/gi;

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('<img') === -1) return data;
  data.content = data.content.replace(IMG_RE, function (match) {
    if (/\sloading\s*=/.test(match)) return match; // 已有显式 loading
    if (!/\ssrc\s*=/.test(match)) return match; // 无 src（占位/前端赋值）
    return match.replace(/(\s*\/?>)$/, ' loading="lazy" decoding="async"' + '$1');
  });
  return data;
});
