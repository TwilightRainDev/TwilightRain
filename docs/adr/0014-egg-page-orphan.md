# ADR-0014：/egg/ 是隐藏彩蛋页，无入口是刻意的

## 状态

已实施（2026-09-25）

## 背景

`source/egg/` 是一个 1.2 MB 的 Three.js 页面（`lib/three.module.js` 1,140,878 字节、
`main.js` 49,246 字节、`index.html` 10,292 字节等）。

在 `source/`、`themes/`、`scripts/`、`_config.yml` 中检索 `/egg`，除 `_config.yml` 的
`skip_render` 注释外**零命中**——顶栏、页脚、关于页、任何一篇文章都不链接它。
它也不进 sitemap（`skip_render` 生效）。

但它不像被遗忘的代码：2026-08-24 还在修万向节死锁（commit `aaee0fd`），
`orientation.mjs` 有独立单测 `test/lib/egg-orientation.test.mjs`。

2026-09-25 向站主确认：**有意藏的彩蛋**，靠猜 URL 到达。

## 决策

保持现状：不补入口、不删除。

在 `docs/ARCHITECTURE.md` 记一行说明，避免后续每一轮代码扫描都把它当死代码捞出来重新调研。

## 后果

- `/egg/` 继续发布（此前已发布），不进 sitemap，无站内入口
- `_config.yml` 的 `skip_render` 条目与 `test/lib/egg-orientation.test.mjs` 都保留
