/**
 * 图片懒加载：after_post_render 给文章正文 <img> 注入 loading="lazy" + decoding="async"。
 *
 * 只管文章正文（首页封面池 index.ejs 自带 loading="lazy"）。
 * 无 src 的 img 跳过：那是前端随机封面占位，加属性会破坏取图逻辑。
 * 已带 loading 的 img 跳过：不覆盖作者显式意图。
 */
'use strict';

var IMG_RE = /<img\b[^>]*>/gi;

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('<img') === -1) return data;
  data.content = data.content.replace(IMG_RE, function (match) {
    if (/\sloading\s*=/.test(match)) return match;
    if (!/\ssrc\s*=/.test(match)) return match; // 无 src（占位/前端赋值）
    return match.replace(/(\s*\/?>)$/, ' loading="lazy" decoding="async"' + '$1');
  });
  return data;
});
