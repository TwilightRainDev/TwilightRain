# ADR-0004：卡片语法收敛

## 状态

已实施

## 背景

卡片与内联的每种变体都要独立的 marked 扩展、样式与回退处理，变体数直接决定维护面。

## 决策

- 卡片只两种：`::card{type="github" repo="owner/repo"}`、`::card{type="link" url="…"}`，
  实现只有 `scripts/marked-card.js`
- 新增变体时只加 type，不再新开 marked 文件
- 旧语法（`::github` / `::link` / `::site` / `::intro` / `:::site-group`）不作别名；
  HTML/CSS 类名不变（`ink.js` 仍选 `a.card-github[data-repo]`）
- **不收录**：内联（`::inline{type="btn|label"}`）、`::card{type="site|intro"}`、
  `:::card-group`。按钮用 Markdown 链接或卡片，标签用提示块或加粗

## 后果

- 卡片只有 `github` / `link` 两种，变体不再扩张
- 写作语法以 [GRAMMAR.md → 卡片](../GRAMMAR.md#卡片card) 为准
