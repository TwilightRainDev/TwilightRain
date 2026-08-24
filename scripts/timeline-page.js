/**
 * 站点展柜 /timeline/：用共享渲染器生成年份分组 HTML。
 */
'use strict';

var renderPageTimeline = require('./lib/timeline-renderer').renderPageTimeline;

hexo.extend.helper.register('timeline_page_html', function (items) {
  return renderPageTimeline(items);
});
