/**
 * 相关文章：构建期按标签交集取 N 篇，post.ejs 文末输出。
 * 对照 Butterfly related_post.js 思路，自写实现。
 */
'use strict';

var pickRelatedPosts = require('./lib/related-posts').pickRelatedPosts;

hexo.extend.helper.register('related_posts_list', function (currentPost) {
  if (!currentPost) return [];
  var tags = [];
  if (currentPost.tags && currentPost.tags.length) {
    currentPost.tags.forEach(function (tag) {
      tags.push({
        name: tag.name,
        posts: tag.posts
      });
    });
  }
  return pickRelatedPosts(
    { path: currentPost.path, tags: tags },
    { limit: 6 }
  );
});
