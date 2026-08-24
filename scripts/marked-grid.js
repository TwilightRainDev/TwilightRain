/**
 * 图片网格 :::grid（拍板 M1）
 *
 *   :::grid[2]
 *   ![alt](/img/360px/...)
 *   ![alt](/img/360px/...)
 *   :::
 *
 * 列数可选，默认 2；渲染为 .md-grid CSS Grid 容器。
 * 替代旧 <div class="photo-grid">（保留兼容，文档标废弃）。
 */
'use strict';

var RULE = /^:::grid(?:\[(\d+)\])?[ \t]*\n([\s\S]*?)\n:::/i;
var DEFAULT_COLS = 2;
var MAX_COLS = 6;

function parseGridCols(raw) {
  if (raw == null || raw === '') return DEFAULT_COLS;
  var n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_COLS;
  return Math.min(n, MAX_COLS);
}

/** 去掉仅含 <img> 的 <p> 包裹，使每张图成为独立 grid 子项 */
function unwrapImageParagraphs(html) {
  return String(html).replace(/<p>(\s*(?:<img\b[^>]*>\s*)+)<\/p>/gi, function (_, imgs) {
    return imgs.trim();
  });
}

var gridExtension = {
  name: 'mdGrid',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::grid(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = RULE.exec(src);
    if (!match) return undefined;
    var token = {
      type: 'mdGrid',
      raw: match[0],
      cols: parseGridCols(match[1]),
      tokens: []
    };
    this.lexer.blockTokens(match[2], token.tokens);
    return token;
  },
  renderer: function (token) {
    var body = unwrapImageParagraphs(this.parser.parse(token.tokens));
    return '<div class="md-grid" style="--md-grid-cols:' + token.cols + '">' +
      body + '</div>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [gridExtension] });
  });
}

module.exports = {
  gridExtension: gridExtension,
  parseGridCols: parseGridCols,
  unwrapImageParagraphs: unwrapImageParagraphs,
  DEFAULT_COLS: DEFAULT_COLS,
  MAX_COLS: MAX_COLS
};
