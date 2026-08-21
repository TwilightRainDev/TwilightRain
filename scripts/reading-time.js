/**
 * 阅读时间 + 字数：构建期统计文章正文文本量，注入
 * post.readingMinutes / post.charCount
 *
 * 顺带注入双链索引（wikiOutbounds / wikiInbounds）：与字数同 after_post_render，
 * 避免独立过滤器阶段拿不到 before_generate 建的图。
 */
'use strict';

var stripHTML = require('hexo-util').stripHTML;
var computeCharStats = require('./lib/char-stats').computeCharStats;

var GRAPH_KEY = '__twilightRainWikiGraph';

function postKey(post) {
  return post.source || post.slug || post.path || post._id;
}

hexo.extend.filter.register('after_post_render', function (data) {
  var stats = computeCharStats(data.content || '', { stripHTML: stripHTML });
  data.charCount = stats.charCount;
  data.readingMinutes = stats.readingMinutes;

  var wikiGraph = global[GRAPH_KEY];
  if (wikiGraph) {
    var g = wikiGraph[postKey(data)] || { outbounds: [], inbounds: [] };
    data.wikiOutbounds = g.outbounds;
    data.wikiInbounds = g.inbounds;
  }
  return data;
});
