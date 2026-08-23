'use strict';

var SERIES_BLOCK = /^::series(?:\{([\s\S]*?)\})?[ \t]*(?:\n|$)/gm;

function parseSeriesName(attrsStr, fallbackSeries) {
  var seriesName = '';
  if (attrsStr) {
    var re = /([a-zA-Z-]+)="([^"]*)"/g;
    var m;
    while ((m = re.exec(attrsStr)) !== null) {
      if (m[1] === 'name') seriesName = m[2].trim();
    }
  }
  return seriesName || fallbackSeries || '';
}

function replaceSeriesBlocks(content, ctx, renderSeriesHtml) {
  if (!content || content.indexOf('::series') === -1) return content;
  var currentPath = ctx && ctx.path;
  var fallbackSeries = ctx && ctx.series;
  return content.replace(SERIES_BLOCK, function (match, attrsStr) {
    var seriesName = parseSeriesName(attrsStr, fallbackSeries);
    if (!seriesName) {
      return '<p class="post-series-error">[WARN] 请写 ::series{name="系列名"} 或在 front matter 设置 series:</p>\n';
    }
    return renderSeriesHtml(seriesName, currentPath) + '\n';
  });
}

module.exports = {
  parseSeriesName: parseSeriesName,
  replaceSeriesBlocks: replaceSeriesBlocks
};
