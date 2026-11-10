/**
 * 文内时间线 :::timeline[可选总标题] + "--- 节点" 分节。
 *
 * 与站点页 /timeline/ 的类名隔离，用 .post-timeline；DOM 由
 * scripts/lib/timeline-renderer.js 生成（两处共用渲染器，语法不合并）。
 */
'use strict';

var renderPostTimeline = require('./lib/timeline-renderer').renderPostTimeline;

var OUTER = /^:::timeline(\[[^\]]*\])?[ \t]*\n([\s\S]*?)\n:::/i;

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
    var items = [];
    for (var i = 0; i < token.items.length; i++) {
      items.push({
        title: token.items[i].title,
        bodyHtml: this.parser.parse(token.items[i].tokens)
      });
    }
    return renderPostTimeline({
      headline: token.headline,
      items: items
    });
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [timelineExtension] });
  });
}

module.exports = { timelineExtension: timelineExtension };
