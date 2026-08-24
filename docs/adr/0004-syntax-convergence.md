# ADR-0004：卡片与内联语法收敛

## 状态

已实施（2026-08-24，阶段七）

## 背景

卡片曾有 `::github` / `::link` / `::site` / `::intro` / `:::site-group` 五套扩展；
内联有 `::btn` / `::label` 两套。维护面随变体增加。

## 决策

- 卡片：`::card{type="github|link|site|intro"}` + `:::card-group`
- 内联：`::inline{type="btn|label"}`
- 旧语法已删除，不再作别名；HTML/CSS 类名不变（`ink.js` 仍选 `a.card-github[data-repo]`）

实现：`scripts/marked-card.js`、`scripts/marked-inline.js`。

## 后果

- 新增变体时只加 type，不再新开 marked 文件
- 验收文与 WORKFLOW 以新语法为主
