/**
 * 系列文（Butterfly 批三迁移，对照 BF series.js 自写）
 *
 * front matter: series: 系列名  （可选 series_index: 1）
 * 文内: ::series  或  ::series{name="系列名"}
 */
'use strict';

var urlFor = require('hexo-util').url_for.bind(hexo);
var seriesLib = require('./lib/series-groups');

var renderCtx = null;

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

hexo.extend.filter.register('before_post_render', function (data) {
  if (!hexo._seriesGroups) rebuildSeriesGroups();
  renderCtx = {
    path: data.path,
    series: data.series
  };
  return data;
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSeriesHtml(seriesName) {
  var groups = hexo._seriesGroups || {};
  var items = groups[seriesName];
  if (!items || !items.length) {
    return '<p class="post-series-error">[WARN] 未找到系列「' + escapeHtml(seriesName) + '」</p>';
  }

  var sorted = seriesLib.sortSeriesItems(items);
  var currentPath = renderCtx && renderCtx.path;
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

var seriesExtension = {
  name: 'mdSeries',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::series(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = /^::series(?:\{([\s\S]*?)\})?[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    var attrs = {};
    if (match[1]) {
      var re = /([a-zA-Z-]+)="([^"]*)"/g;
      var m;
      while ((m = re.exec(match[1])) !== null) attrs[m[1]] = m[2];
    }
    return {
      type: 'mdSeries',
      raw: match[0],
      name: (attrs.name || '').trim()
    };
  },
  renderer: function (token) {
    var seriesName = token.name || (renderCtx && renderCtx.series);
    if (!seriesName) {
      return '<p class="post-series-error">[WARN] 请写 ::series{name="系列名"} 或在 front matter 设置 series:</p>';
    }
    return renderSeriesHtml(seriesName);
  }
};

hexo.extend.filter.register('marked:use', function (markedUse) {
  markedUse({ extensions: [seriesExtension] });
});

module.exports = {
  seriesExtension: seriesExtension,
  renderSeriesHtml: renderSeriesHtml
};
