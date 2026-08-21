/**
 * 面包屑层级链（纯函数）。
 * 分类按 parent 链从根到叶排序；无分类时仅首页 + 当前标题。
 */
'use strict';

/**
 * @param {{ name: string, path?: string, _id?: string, parent?: string|null }}[] categories
 * @param {{ title: string, path?: string }} current 当前页（标题不链接）
 * @param {{ homeLabel?: string, homePath?: string }} [opts]
 * @returns {{ label: string, path: string|null }[]}
 */
function buildBreadcrumbItems(categories, current, opts) {
  opts = opts || {};
  var homeLabel = opts.homeLabel || '首页';
  var homePath = opts.homePath || '/';
  var items = [{ label: homeLabel, path: homePath }];

  var ordered = orderCategoriesRootToLeaf(categories || []);
  for (var i = 0; i < ordered.length; i++) {
    var cat = ordered[i];
    items.push({
      label: cat.name,
      path: cat.path || null
    });
  }

  if (current && current.title) {
    items.push({ label: current.title, path: null });
  }
  return items;
}

/**
 * 有 parent 关系时走祖先链；否则保持输入顺序（Hexo 扁平多分类）。
 * @param {{ name: string, path?: string, _id?: string, parent?: string|null }}[] categories
 */
function orderCategoriesRootToLeaf(categories) {
  if (!categories.length) return [];
  var byId = Object.create(null);
  for (var i = 0; i < categories.length; i++) {
    var c = categories[i];
    if (c._id) byId[c._id] = c;
  }

  var hasParentLink = categories.some(function (c) {
    return c.parent && byId[c.parent];
  });
  if (!hasParentLink) return categories.slice();

  var childIds = Object.create(null);
  for (var j = 0; j < categories.length; j++) {
    if (categories[j].parent && byId[categories[j].parent]) {
      childIds[categories[j].parent] = true;
    }
  }
  var leaf = null;
  for (var k = 0; k < categories.length; k++) {
    if (!childIds[categories[k]._id]) {
      leaf = categories[k];
      break;
    }
  }
  if (!leaf) leaf = categories[categories.length - 1];

  var chain = [];
  var cur = leaf;
  var guard = 0;
  while (cur && guard++ < 32) {
    chain.unshift(cur);
    cur = cur.parent && byId[cur.parent] ? byId[cur.parent] : null;
  }
  return chain;
}

module.exports = {
  buildBreadcrumbItems: buildBreadcrumbItems,
  orderCategoriesRootToLeaf: orderCategoriesRootToLeaf
};
