/**
 * 系列文（Butterfly 批三迁移，对照 BF series.js 自写）
 *
 * front matter: series: 系列名  （可选 series_index: 1）
 * 文内: ::series  或  ::series{name="系列名"}
 *
 * 在 before_post_render 同步替换 ::series，避免 marked 扩展依赖模块级
 * renderCtx（Hexo 并行渲染多篇文章时会互相覆盖）。
 */
'use strict';

var urlFor = require('hexo-util').url_for.bind(hexo);
var seriesLib = require('./lib/series-groups');
var seriesBlocks = require('./lib/series-blocks');

function rebuildSeriesGroups() {
  var posts = hexo.model('Post').toArray();
  var mapped = posts.map(function (post) {
    return {
      title: post.title,
      path: post.path,
      date: post.date ? post.date.valueOf() : 0,
      series: post.series,
      seriesIndex: post.series_index != null ? Number(post.series_index) : undefined
    };
  });
  hexo._seriesGroups = seriesLib.buildSeriesGroups(mapped);
}

hexo.extend.filter.register('before_generate', function () {
  rebuildSeriesGroups();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSeriesHtml(seriesName, currentPath) {
  var groups = hexo._seriesGroups || {};
  var items = groups[seriesName];
  if (!items || !items.length) {
    return '<p class="post-series-error">[WARN] 未找到系列「' + escapeHtml(seriesName) + '」</p>';
  }

  var sorted = seriesLib.sortSeriesItems(items);
  var listTag = sorted.length > 1 ? 'ol' : 'ul';
  var body = sorted.map(function (item) {
    var isCurrent = currentPath && item.path === currentPath;
    if (isCurrent) {
      return '<li class="post-series-item is-current"><span aria-current="page">' +
        escapeHtml(item.title) + '</span></li>';
    }
    return '<li class="post-series-item"><a href="' + escapeHtml(urlFor(item.path)) + '">' +
      escapeHtml(item.title) + '</a></li>';
  }).join('');

  return '<nav class="post-series" aria-label="系列目录">' +
    '<p class="post-series-label">系列：' + escapeHtml(seriesName) + '</p>' +
    '<' + listTag + ' class="post-series-list">' + body + '</' + listTag + '>' +
    '</nav>';
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!hexo._seriesGroups) rebuildSeriesGroups();
  if (data.content) {
    data.content = seriesBlocks.replaceSeriesBlocks(data.content, {
      path: data.path,
      series: data.series
    }, renderSeriesHtml);
  }
  return data;
});

module.exports = {
  renderSeriesHtml: renderSeriesHtml
};
