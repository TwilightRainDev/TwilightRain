/**
 * Obsidian 风格双链：解析 / 替换 [[Title]] [[Title|Alias]] [[Title#Anchor]]
 * 跳过围栏代码块与行内代码。
 */
'use strict';

var WIKI_RE = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

/**
 * 把 Markdown 中围栏/行内代码替换为占位，回调处理正文后再还原。
 * @param {string} md
 * @param {(body: string) => string} transform
 */
function mapOutsideCode(md, transform) {
  var holes = [];
  var masked = String(md || '')
    .replace(/```[\s\S]*?```/g, function (block) {
      var i = holes.length;
      holes.push(block);
      return '\0CODE' + i + '\0';
    })
    .replace(/`[^`\n]+`/g, function (inline) {
      var i = holes.length;
      holes.push(inline);
      return '\0CODE' + i + '\0';
    });
  var out = transform(masked);
  return out.replace(/\0CODE(\d+)\0/g, function (_, n) {
    return holes[Number(n)];
  });
}

/**
 * @param {string} md
 * @returns {{ target: string, anchor: string, alias: string }[]}
 */
function extractWikilinks(md) {
  var found = [];
  mapOutsideCode(md, function (body) {
    body.replace(WIKI_RE, function (full, target, anchor, alias) {
      found.push({
        target: String(target).trim(),
        anchor: anchor ? String(anchor).trim() : '',
        alias: alias ? String(alias).trim() : ''
      });
      return full;
    });
    return body;
  });
  return found;
}

/**
 * @param {string} md
 * @param {(target: string) => { path: string, title: string }|null} resolve
 */
function replaceWikilinks(md, resolve) {
  return mapOutsideCode(md, function (body) {
    return body.replace(WIKI_RE, function (full, target, anchor, alias) {
      var key = String(target).trim();
      var hit = resolve(key);
      if (!hit || !hit.path) return full;
      var text = (alias && String(alias).trim()) || hit.title || key;
      var href = hit.path;
      if (anchor) href += '#' + encodeURIComponent(String(anchor).trim());
      return '[' + text + '](' + href + ')';
    });
  });
}

/**
 * @param {{ id: string, title: string, path: string }[]} posts
 * @param {{ id: string, raw: string }[]} rawPosts  id + markdown body（含 front matter 亦可，链接通常在正文）
 * @param {(target: string) => { id: string, title: string, path: string }|null} resolve
 * @returns {Record<string, { outbounds: {id,title,path}[], inbounds: {id,title,path}[] }>}
 */
function buildLinkGraph(posts, rawPosts, resolve) {
  var byId = Object.create(null);
  for (var i = 0; i < posts.length; i++) {
    byId[posts[i].id] = {
      id: posts[i].id,
      title: posts[i].title,
      path: posts[i].path,
      outbounds: [],
      inbounds: []
    };
  }

  for (var j = 0; j < rawPosts.length; j++) {
    var raw = rawPosts[j];
    if (!byId[raw.id]) continue;
    var links = extractWikilinks(raw.raw);
    var seen = Object.create(null);
    for (var k = 0; k < links.length; k++) {
      var hit = resolve(links[k].target);
      if (!hit || hit.id === raw.id) continue;
      if (seen[hit.id]) continue;
      seen[hit.id] = true;
      byId[raw.id].outbounds.push({ id: hit.id, title: hit.title, path: hit.path });
      if (byId[hit.id]) {
        byId[hit.id].inbounds.push({
          id: raw.id,
          title: byId[raw.id].title,
          path: byId[raw.id].path
        });
      }
    }
  }
  return byId;
}

module.exports = {
  extractWikilinks: extractWikilinks,
  replaceWikilinks: replaceWikilinks,
  buildLinkGraph: buildLinkGraph,
  mapOutsideCode: mapOutsideCode
};
