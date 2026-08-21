/**
 * 文内时间线（Butterfly 批一迁移）
 * 与站点页 /timeline/（.timeline-item 展柜）类名隔离，使用 .post-timeline。
 *
 * 语法：
 *   :::timeline[可选总标题]
 *   --- 节点 A
 *   内容 A
 *   --- 节点 B
 *   内容 B
 *   :::
 */
'use strict';

var OUTER = /^:::timeline(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var timelineExtension = {
  name: 'postTimeline',
  level: 'block',
  start: function (src) {
    var m = src.match(/^:::timeline(?=[\s\[])/i);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = OUTER.exec(src);
    if (!match) return undefined;
    var headline = (match[1] || '').replace(/^\[|\]$/g, '').trim();
    var inner = match[2];
    var blocks = inner.split(/^---[ \t]+/m);
    var items = [];
    for (var i = 1; i < blocks.length; i++) {
      var b = blocks[i];
      var nl = b.indexOf('\n');
      var title = (nl === -1 ? b : b.slice(0, nl)).trim();
      var body = (nl === -1 ? '' : b.slice(nl + 1)).replace(/^\n+|\n+$/g, '');
      var item = { title: title || ('节点 ' + i), tokens: [] };
      if (body) this.lexer.blockTokens(body, item.tokens);
      items.push(item);
    }
    return {
      type: 'postTimeline',
      raw: match[0],
      headline: headline,
      items: items
    };
  },
  renderer: function (token) {
    if (!token.items.length) {
      return '<p class="post-timeline-error">[WARN] 无效的时间线语法，应为 :::timeline + "--- 标题" 分隔 + :::</p>';
    }
    var html = '<div class="post-timeline">';
    if (token.headline) {
      html += '\n<div class="post-timeline-headline">' + escapeHtml(token.headline) + '</div>';
    }
    for (var i = 0; i < token.items.length; i++) {
      html += '\n<div class="post-timeline-item">' +
        '\n<div class="post-timeline-title">' + escapeHtml(token.items[i].title) + '</div>' +
        '\n<div class="post-timeline-body">' + this.parser.parse(token.items[i].tokens) + '</div>' +
        '\n</div>';
    }
    return html + '\n</div>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [timelineExtension] });
  });
}

module.exports = { timelineExtension: timelineExtension };
