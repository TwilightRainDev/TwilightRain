# ADR-0010：双链保留，并补两条真实用例作为验证条件

## 状态

已被 [ADR-0016](0016-wikilinks-removed.md) 取代（复核后删除整支）

## 背景

`[[双链]]` 是全站实装成本最高的写作扩展（`scripts/wikilinks.js` 71 行 +
`scripts/lib/wikilinks.js` 117 行 + 单测 + `post.ejs` 文末整块 + CSS），
但在 16 篇文章里零真实用量，只出现在样板文 `blog-writing-features.md`。
文章之间无实际互引关系（主题有相邻，但零互引）。

## 决策

保留双链，并补两条真实互引：

- 「博客写作全部特性验收」（`source/_posts/blog-writing-features.md`）加出站链接
  ``[[blog 能用就行的历史遗留]]``
- 「Windows Terminal酱的暴走！打开目录的连环物语。」（`source/_posts/wt-startdir-debug.md`）加出站链接
  ``[[用Win文本工具箱告别散装脚本]]``

## 后果

- 双链从「零用量储备」变为「有真实用例」，功能可被验证
- **验证条件**：下一轮扫描若仍只有这两条、且没有新增用例，则删除整支（脚本 + 单测 + `post.ejs` 区块 + CSS），
  届时不必再讨论。该条件已记入 `docs/BACKLOG.md`
