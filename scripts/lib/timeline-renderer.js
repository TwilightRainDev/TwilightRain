/**
 * 文内 :::timeline 与站点页 /timeline/ 共用的 DOM 生成。
 * 两套 class 前缀保持隔离（.post-timeline vs .timeline-*），不合并语法。
 */
'use strict';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @param {{ headline?: string, items?: { title?: string, bodyHtml?: string }[] }} opts
 * @returns {string}
 */
function renderPostTimeline(opts) {
  opts = opts || {};
  var items = opts.items || [];
  var headline = opts.headline || '';
  if (!items.length) {
    return '<p class="post-timeline-error">[WARN] 无效的时间线语法，应为 :::timeline + "--- 标题" 分隔 + :::</p>';
  }
  var html = '<div class="post-timeline">';
  if (headline) {
    html += '\n<div class="post-timeline-headline">' + escapeHtml(headline) + '</div>';
  }
  for (var i = 0; i < items.length; i++) {
    var item = items[i] || {};
    html += '\n<div class="post-timeline-item">' +
      '\n<div class="post-timeline-title">' + escapeHtml(item.title || '') + '</div>' +
      '\n<div class="post-timeline-body">' + (item.bodyHtml || '') + '</div>' +
      '\n</div>';
  }
  return html + '\n</div>';
}

/**
 * @param {{ date?: string, title?: string, desc?: string }[]|null|undefined} items
 * @returns {string}
 */
function renderPageTimeline(items) {
  if (!items || !items.length) {
    return '<p>暂无记录。</p>';
  }
  var sorted = items.slice().sort(function (a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
  var html = '';
  var currentYear = '';
  for (var i = 0; i < sorted.length; i++) {
    var item = sorted[i] || {};
    var date = String(item.date || '');
    var year = date.substring(0, 4);
    if (year !== currentYear) {
      currentYear = year;
      html += '<h2 class="timeline-year">' + escapeHtml(year) + '</h2>\n';
    }
    html += '<div class="timeline-item">\n';
    html += '<span class="timeline-date">' + escapeHtml(date.substring(5)) + '</span>\n';
    html += '<div class="timeline-body">\n';
    html += '<span class="timeline-title">' + escapeHtml(item.title || '') + '</span>\n';
    if (item.desc) {
      html += '<p class="timeline-desc">' + escapeHtml(item.desc) + '</p>\n';
    }
    html += '</div>\n</div>\n';
  }
  return html;
}

module.exports = {
  escapeHtml: escapeHtml,
  renderPostTimeline: renderPostTimeline,
  renderPageTimeline: renderPageTimeline
};
