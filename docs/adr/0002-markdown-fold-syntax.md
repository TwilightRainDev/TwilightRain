# ADR-0002：折叠语法统一

## 状态

已实施

## 决策

唯一语法：

- `:::fold[text 提示]` — 行内剧透（`.md-text`）；无 mode 时默认 text
- `:::fold[details 摘要]` — 块级折叠（`.md-details`）

旧围栏名不再解析。实现：`scripts/marked-fold.js`。

## 后果

- 写作侧只记一种围栏
- `ink.js` 仍只处理 `.md-text` 点击切换
