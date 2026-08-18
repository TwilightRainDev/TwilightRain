/**
 * 文章时效（2026-08-18，Reimu 批一迁移）：
 * after_post_render 计算两个标记供 post.ejs 使用——
 * - data.updatedSet：front matter 显式写了 updated 才置真（data.raw 是
 *   front matter 原文）。仅显式手写才显示"更新于"：Hexo 默认 updated 取
 *   文件 mtime，git checkout/克隆会刷新 mtime，直接显示会造成假更新时间。
 * - data.stale / data.staleDays：文章日期距今超 365 天标记过期。
 */
'use strict';

var STALE_DAYS = 365;

hexo.extend.filter.register('after_post_render', function (data) {
  if (data.raw && /^\s*updated\s*:/m.test(data.raw)) {
    data.updatedSet = true;
  }
  if (data.date) {
    // 兼容 Date/moment 对象与 YAML 字符串两种形态（部分页面的 date 是字符串）
    var t = typeof data.date.getTime === 'function' ? data.date.getTime() : new Date(data.date).getTime();
    if (isNaN(t)) return data;
    var ageDays = Math.floor((Date.now() - t) / 86400000);
    if (ageDays > STALE_DAYS) {
      data.stale = true;
      data.staleDays = ageDays;
    }
  }
  return data;
});
