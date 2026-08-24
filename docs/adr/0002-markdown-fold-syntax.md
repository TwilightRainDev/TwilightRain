# ADR-0002：折叠语法统一

## 状态

已实施（2026-08-24，阶段三 M2 + 阶段四删除旧语法）

## 背景

历史上存在 hide / fold / folding 三套折叠机制，CSS 与 marked 扩展重复。

## 决策

统一为：

- `:::text[提示]` — 行内剧透，悬停或点击揭示（`marked-text.js`）
- `:::details[摘要]` — 块级折叠（`marked-details.js`）

旧语法在兼容期后于阶段四删除；验收文与 WORKFLOW 仅文档化新语法。

## 后果

- 写作侧只需记两种围栏
- `ink.js` 仅保留 `md-text` 点击切换逻辑
