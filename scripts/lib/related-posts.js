'use strict';

/**
 * 按标签交集权重选取相关文章（对照 Butterfly related_post 思路，自写实现）。
 * @param {object} current - { path, tags: [{ name, posts: [{ path, title }] }] }
 * @param {{ limit?: number }} options
 * @returns {{ title: string, path: string, weight: number }[]}
 */
function pickRelatedPosts(current, options) {
  options = options || {};
  var limit = options.limit == null ? 6 : options.limit;
  if (!current || !current.path || !current.tags || !current.tags.length) return [];

  var map = new Map();
  current.tags.forEach(function (tag) {
    if (!tag.posts) return;
    tag.posts.forEach(function (post) {
      if (!post || post.path === current.path) return;
      var existing = map.get(post.path);
      if (existing) {
        existing.weight += 1;
      } else {
        map.set(post.path, {
          title: post.title || '',
          path: post.path,
          weight: 1,
          random: Math.random()
        });
      }
    });
  });

  if (!map.size) return [];

  return Array.from(map.values())
    .sort(function (a, b) {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return b.random - a.random;
    })
    .slice(0, limit)
    .map(function (item) {
      return { title: item.title, path: item.path, weight: item.weight };
    });
}

module.exports = { pickRelatedPosts: pickRelatedPosts };
