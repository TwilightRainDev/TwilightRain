/**
 * 正文体量统计（纯函数，供 reading-time 过滤器与单测共用）。
 * 规则与历史 reading-time.js 一致：去 HTML 标签后去空白计字符，约 400 字/分钟。
 */
'use strict';

var CHARS_PER_MINUTE = 400;

/**
 * @param {string} html
 * @param {{ stripHTML: (s: string) => string }} deps
 * @returns {{ charCount: number, readingMinutes: number }}
 */
function computeCharStats(html, deps) {
  var stripHTML = deps && deps.stripHTML;
  if (typeof stripHTML !== 'function') {
    throw new TypeError('computeCharStats requires deps.stripHTML');
  }
  var text = stripHTML(html || '');
  var charCount = text.replace(/\s+/g, '').length;
  var readingMinutes = Math.max(1, Math.round(charCount / CHARS_PER_MINUTE));
  return { charCount: charCount, readingMinutes: readingMinutes };
}

module.exports = {
  CHARS_PER_MINUTE: CHARS_PER_MINUTE,
  computeCharStats: computeCharStats
};
