/**
 * 阅读时间：构建期统计文章正文文本量，注入 post.readingMinutes
 *
 * 机制：after_post_render 过滤器在 Markdown 渲染成 HTML 后执行，
 * 对 HTML 去标签统计字符数（中文约 400 字/分钟），结果挂到文章数据，
 * post.ejs 在正文头部显示"阅读约 N 分钟"。构建期计算、零前端开销、
 * 结果直接进 HTML（利于 SEO 与无 JS 环境）。
 *
 * 注意：代码块文本也计入（与 Twilight 的 reading-time 行为一致）；
 * 阅读分钟数下限 1，避免短文章显示 0 分钟。
 */
'use strict';

var stripHTML = require('hexo-util').stripHTML;

var CHARS_PER_MINUTE = 400;

hexo.extend.filter.register('after_post_render', function (data) {
  var text = stripHTML(data.content || '');
  var chars = text.replace(/\s+/g, '').length;
  data.readingMinutes = Math.max(1, Math.round(chars / CHARS_PER_MINUTE));
  return data;
});
