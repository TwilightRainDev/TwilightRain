# ADR-0014：/egg/ 是隐藏彩蛋页，无入口是刻意的

## 状态

已实施（2026-09-25）

## 背景

`source/egg/` 是一个 1.2 MB 的 Three.js 页面（`lib/three.module.js` 1,140,878 字节、
`main.js` 49,246 字节、`index.html` 10,292 字节等）。

在 `source/`、`themes/`、`scripts/`、`_config.yml` 中检索 `egg`
（`grep -rIn egg source/ themes/ scripts/ _config.yml`，`-I` 跳过二进制）：
**除 `source/egg/` 页面自身的文件外，唯一命中的是 `_config.yml` 那条配置 `'egg/**'`**——
顶栏、页脚、关于页、任何一篇文章都不链接它。它也不进 sitemap（`skip_render` 生效）。

（检索词用 `egg` 而非 `/egg`：配置行写作 `egg/**`、无前导斜杠，带斜杠检索会得到真零命中，
连配置自身都看不见，反而看不出「命中只有配置」这个结论。上面那句的「除 `source/egg/` 页面自身的文件外」
同样不可省：该目录下的 `.mjs`（如 `orientation.mjs:2` 的注释）里就有 `egg` 这个词，
写成「唯一命中」或「零命中」都会被同一条 grep 证伪。）

但它不像被遗忘的代码：2026-08-24 还在修万向节死锁（commit `aaee0fd`），
`orientation.mjs` 有独立单测 `test/lib/egg-orientation.test.mjs`。

2026-09-25 向站主确认：**有意藏的彩蛋**，靠猜 URL 到达。

## 决策

保持现状：不补入口、不删除。

在 `docs/ARCHITECTURE.md` 记一行说明，避免后续每一轮代码扫描都把它当死代码捞出来重新调研。

## 后果

- `/egg/` 继续发布（此前已发布），不进 sitemap，无站内入口
- `_config.yml` 的 `skip_render` 条目与 `test/lib/egg-orientation.test.mjs` 都保留
