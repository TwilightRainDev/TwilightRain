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
 * - hexo-renderer-marked 在 headerIds 开启时会顺带插入空 <a class="headerlink">，
 *   与 heading-anchor 叠成双锚点；headerIds 不能关（关掉标题会丢 id），
 *   故在本过滤器里剥掉 headerlink，只留可见的 #。
 *
 * 纯函数实现见 lib/heading-anchor.js。
 */
'use strict';

var applyHeadingAnchors = require('./lib/heading-anchor').applyHeadingAnchors;

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content) return data;
  data.content = applyHeadingAnchors(data.content);
  return data;
});
