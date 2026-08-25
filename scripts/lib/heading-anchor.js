'use strict';

// 与 ink.js TOC 相同的 slug 规则（themes/ink/source/js/ink.js:313）
function slugify(text) {
  return String(text || '').trim().toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-|-$/g, '');
}

// hexo-renderer-marked 在 headerIds 开启时给标题插空 <a class="headerlink">，
// 与 heading-anchor 叠成双锚点。headerIds 不能关（关掉会连标题 id 一起丢），
// 只能渲染后剥掉。headerlink 形态见 node_modules/hexo-renderer-marked/lib/renderer.js。
function stripHeaderlinks(html) {
  return String(html || '').replace(
    /<a\b[^>]*\bclass=["'][^"']*\bheaderlink\b[^"']*["'][^>]*>\s*<\/a>/gi,
    ''
  );
}

var HEADING_RE = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g;

function applyHeadingAnchors(html) {
  if (!html) return html;
  var next = stripHeaderlinks(html);
  if (next.indexOf('<h2') === -1 && next.indexOf('<h3') === -1) return next;
  return next.replace(HEADING_RE, function (match, level, attrs, inner) {
    var idMatch = attrs.match(/\bid=["']([^"']+)["']/);
    var id = idMatch ? idMatch[1] : slugify(inner.replace(/<[^>]+>/g, ''));
    if (!id) return match;
    var idAttr = idMatch ? '' : ' id="' + id + '"';
    if (/\bheading-anchor\b/.test(inner)) {
      return '<h' + level + attrs + idAttr + '>' + inner + '</h' + level + '>';
    }
    return '<h' + level + attrs + idAttr + '>' +
      '<a class="heading-anchor" href="#' + id + '" aria-hidden="true">#</a>' +
      inner + '</h' + level + '>';
  });
}

module.exports = {
  slugify: slugify,
  stripHeaderlinks: stripHeaderlinks,
  applyHeadingAnchors: applyHeadingAnchors
};
