'use strict';

/**
 * 按 series 名称聚合文章，供 scripts/series.js 与单测使用。
 * @param {Array<{ title: string, path: string, date: number, series?: string, seriesIndex?: number }>} posts
 * @returns {Record<string, Array<{ title: string, path: string, date: number, seriesIndex?: number }>>}
 */
function buildSeriesGroups(posts) {
  var groups = Object.create(null);
  if (!posts || !posts.length) return groups;

  posts.forEach(function (post) {
    var name = post.series;
    if (!name) return;
    if (!groups[name]) groups[name] = [];
    groups[name].push({
      title: post.title || '',
      path: post.path || '',
      date: post.date || 0,
      seriesIndex: post.seriesIndex
    });
  });

  return groups;
}

/**
 * @param {Array<{ title: string, path: string, date: number, seriesIndex?: number }>} items
 */
function sortSeriesItems(items) {
  var list = items.slice();
  var hasIndex = list.some(function (item) {
    return item.seriesIndex != null && !isNaN(item.seriesIndex);
  });

  if (hasIndex) {
    list.sort(function (a, b) {
      var ai = a.seriesIndex != null && !isNaN(a.seriesIndex) ? Number(a.seriesIndex) : 999999;
      var bi = b.seriesIndex != null && !isNaN(b.seriesIndex) ? Number(b.seriesIndex) : 999999;
      if (ai !== bi) return ai - bi;
      return a.date - b.date;
    });
    return list;
  }

  list.sort(function (a, b) {
    return a.date - b.date;
  });
  return list;
}

module.exports = {
  buildSeriesGroups: buildSeriesGroups,
  sortSeriesItems: sortSeriesItems
};
