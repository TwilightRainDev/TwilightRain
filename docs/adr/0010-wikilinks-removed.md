# ADR-0010：双链复核后删除整支

## 状态

已实施

## 背景

`[[双链]]` 是全站实装成本最高的写作扩展（`scripts/wikilinks.js` 71 行 +
`scripts/lib/wikilinks.js` 117 行 + 单测 + `post.ejs` 文末整块 + CSS），
但在 16 篇文章里零真实用量，只出现在样板文 `blog-writing-features.md`；
文章之间无实际互引关系（主题有相邻，但零互引）。

保留时立下的验证条件：补两条真实互引后再扫一轮，若仍只有这两条、且没有新增用例，
则删除整支，届时不必再讨论。2026-09-26 扫描——全站真实 `[[目标]]` 仍只有

- `blog-writing-features.md` → `blog 能用就行的历史遗留`
- `wt-startdir-debug.md` → `用Win文本工具箱告别散装脚本`

样板文里的 `[[关于我]]` 已是行内代码，不算用例。没有新增互引，条件兑现。

## 决策

删除双链整支：

- `scripts/wikilinks.js`、`scripts/lib/wikilinks.js`、`test/lib/wikilinks.test.js`
- `post.ejs` 文末「链接到 / 反向链接」区块与 `.post-wikilinks*` CSS
- `reading-time.js` 里对 wiki 图的注入

两条互引改成普通 Markdown 链接，文末只留 prev/next。写作语法不再收录 `[[…]]`。

不补台账 B1a（目标命中 title 的测试）：功能已不存在。B1b（fold 围栏内 Markdown）
与本决策无关，本轮一并补上。

## 后果

- 站内互引用 `[标题](/年/月/日/slug/)`，不再维护一套标题索引
