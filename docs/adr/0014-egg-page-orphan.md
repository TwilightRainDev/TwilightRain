# ADR-0014：/egg/ 是隐藏彩蛋页，无入口是刻意的

## 状态

已实施

## 背景

`source/egg/` 是一个 1.2 MB 的 Three.js 页面（`lib/three.module.js` 1,140,878 字节、
`main.js` 49,246 字节、`index.html` 10,292 字节等）。

**全站无任何入口**：在 `source/`、`themes/`、`scripts/`、`_config.yml` 中检索 `egg`，
除 `source/egg/` 页面自身的文件外，唯一命中的是 `_config.yml` 那条配置 `'egg/**'`——
顶栏、页脚、关于页、任何一篇文章都不链接它。它也不进 sitemap（`skip_render` 生效）。

它不像被遗忘的代码：`orientation.mjs` 有独立单测 `test/lib/egg-orientation.test.mjs`。
站主确认为**有意藏的彩蛋**，靠猜 URL 到达。

## 决策

保持现状：不补入口、不删除。

该事实同时记在 [ARCHITECTURE.md](../ARCHITECTURE.md) 的「隐藏页」一行，避免后续每一轮
代码扫描都把它当死代码捞出来重新调研。

## 后果

- `/egg/` 继续发布，不进 sitemap，无站内入口
- `_config.yml` 的 `skip_render` 条目与 `test/lib/egg-orientation.test.mjs` 都保留
