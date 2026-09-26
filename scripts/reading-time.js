/**
 * 阅读时间 + 字数：构建期统计文章正文文本量，注入
 * post.readingMinutes / post.charCount
 */
'use strict';

var stripHTML = require('hexo-util').stripHTML;
var computeCharStats = require('./lib/char-stats').computeCharStats;

hexo.extend.filter.register('after_post_render', function (data) {
  var stats = computeCharStats(data.content || '', { stripHTML: stripHTML });
  data.charCount = stats.charCount;
  data.readingMinutes = stats.readingMinutes;
  return data;
});
