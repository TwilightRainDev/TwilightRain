/**
 * 段落锚点（2026-08-18，Reimu 批一迁移）：
 * after_post_render 给文章正文 h2/h3 注入悬停锚点链接（# 号，点击直达本段落）。
 *
 * 机制：
 * - hexo-renderer-marked 已默认给标题生成 id（中文原文，如 id="做过什么"），
 *   直接复用，不重复生成；无 id 的标题（如部分手写 HTML）按 ink.js TOC 的
 *   slug 规则生成（小写、保留中文、空白/标点转 -）。两处规则一致时 TOC 链接
 *   与正文 id 相同。
 * - 深链 #hash：id 构建期已存在，页面加载即锚点定位成功（TOC 运行时生成的
 *   id 会错过浏览器初始定位；hexo 默认 id 则无此问题）。
 * - 已带 id 的标题跳过 id 生成、仍注入锚点链接；不注入链接的情况只有
 *   标题无文本可 slug 化。
 */
'use strict';

// 与 ink.js TOC 相同的 slug 规则（themes/ink/source/js/ink.js:313）
function slugify(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-|-$/g, '');
}

var HEADING_RE = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g;

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('<h2') === -1 && data.content.indexOf('<h3') === -1) return data;
  data.content = data.content.replace(HEADING_RE, function (match, level, attrs, inner) {
    // 复用现有 id（hexo-renderer-marked 默认生成，中文原文）；无则按 TOC 规则生成
    var idMatch = attrs.match(/\bid=["']([^"']+)["']/);
    var id = idMatch ? idMatch[1] : slugify(inner.replace(/<[^>]+>/g, ''));
    if (!id) return match;
    var idAttr = idMatch ? '' : ' id="' + id + '"';
    return '<h' + level + attrs + idAttr + '>' +
      '<a class="heading-anchor" href="#' + id + '" aria-hidden="true">#</a>' +
      inner + '</h' + level + '>';
  });
  return data;
});
