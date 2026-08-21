/**
 * Obsidian 风格双链：[[Title]] / [[Title|Alias]] / [[Title#Anchor]]
 * → Markdown 链接；出站/入站图写入 global，由 reading-time.js 的
 * after_post_render 注入 page.wikiOutbounds / wikiInbounds。
 */
'use strict';

var lib = require('./lib/wikilinks');
var GRAPH_KEY = '__twilightRainWikiGraph';

function postKey(post) {
  return post.source || post.slug || post.path || post._id;
}

function postPublicPath(hexoInst, post) {
  var root = hexoInst.config.root || '/';
  if (root.charAt(root.length - 1) !== '/') root += '/';
  var p = post.path || '';
  if (p.charAt(0) === '/') p = p.slice(1);
  return root + p;
}

function makeResolver(hexoInst) {
  var byTitle = Object.create(null);
  var bySlug = Object.create(null);
  hexoInst.locals.get('posts').forEach(function (post) {
    if (post.title) byTitle[post.title] = post;
    if (post.slug) bySlug[post.slug] = post;
  });
  return function (target) {
    var post = byTitle[target] || bySlug[target];
    if (!post) return null;
    return {
      id: postKey(post),
      title: post.title,
      path: postPublicPath(hexoInst, post)
    };
  };
}

function buildGraph(hexoInst) {
  var resolve = makeResolver(hexoInst);
  var posts = hexoInst.locals.get('posts');
  var postList = [];
  var rawList = [];
  posts.forEach(function (post) {
    var id = postKey(post);
    postList.push({
      id: id,
      title: post.title,
      path: postPublicPath(hexoInst, post)
    });
    rawList.push({ id: id, raw: post._content || '' });
  });
  return lib.buildLinkGraph(postList, rawList, resolve);
}

hexo.extend.filter.register('before_generate', function () {
  global[GRAPH_KEY] = buildGraph(hexo);
});

// 兜底：若 before_generate 的 global 在渲染阶段不可见，首次 before_post_render 再建一次
hexo.extend.filter.register('before_post_render', function (data) {
  if (data.layout === false) return data;
  if (!global[GRAPH_KEY]) {
    global[GRAPH_KEY] = buildGraph(hexo);
  }
  var resolve = makeResolver(hexo);
  data.content = lib.replaceWikilinks(data.content || '', resolve);
  return data;
});
