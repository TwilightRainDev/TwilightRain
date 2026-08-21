/**
 * 面包屑：注册 helper breadcrumb_items(page)
 * 层级：首页 → 分类（支持 parent 链）→ 当前标题（不链接）
 */
'use strict';

var buildBreadcrumbItems = require('./lib/breadcrumbs').buildBreadcrumbItems;

hexo.extend.helper.register('breadcrumb_items', function (page) {
  if (!page) return [];
  var self = this;
  var cats = [];

  if (page.categories && page.categories.length) {
    page.categories.forEach(function (cat) {
      cats.push({
        name: cat.name,
        path: self.url_for(cat.path),
        _id: cat._id,
        parent: cat.parent || null
      });
    });
  } else if (page.category) {
    // 分类归档页：page.category 为字符串名
    var name = page.category;
    var path = page.path ? self.url_for(page.path) : null;
    cats.push({ name: name, path: path, _id: name, parent: null });
  }

  var title = page.title || page.category || '';
  // 分类归档页标题常与分类名重复，避免「首页 > 技术 > 技术」
  if (page.category && (!page.categories || !page.categories.length)) {
    return buildBreadcrumbItems(cats, null, {
      homeLabel: '首页',
      homePath: self.url_for('/')
    });
  }

  return buildBreadcrumbItems(cats, { title: title }, {
    homeLabel: '首页',
    homePath: self.url_for('/')
  });
});
