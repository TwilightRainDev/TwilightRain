/**
 * 段落锚点：after_post_render 给正文 h2/h3 注入悬停锚点链接（# 号，点击直达）。
 * id 优先复用 hexo-renderer-marked 生成的（中文原文）；无 id 的标题按 ink.js TOC 的
 * slug 规则生成，两边必须一致，不一致 TOC 链接就跳不到正文。
 * headerIds 不能关（关掉标题会连 id 一起丢），而它开着就会多插一个空 headerlink，
 * 与本文的锚点叠成双 #，故在本过滤器里把它剥掉。
 * 纯函数实现见 lib/heading-anchor.js。
 */
'use strict';

var applyHeadingAnchors = require('./lib/heading-anchor').applyHeadingAnchors;

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content) return data;
  data.content = applyHeadingAnchors(data.content);
  return data;
});
