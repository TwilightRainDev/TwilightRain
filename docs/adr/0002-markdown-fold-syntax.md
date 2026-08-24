# ADR-0002：折叠语法统一

## 状态

已实施（2026-08-24 M2；同日阶段七收敛为 `:::fold`；随后结束别名兼容）

## 背景

历史上存在 hide / fold / folding，后收为两套围栏，再收为一种围栏 + 参数。

## 决策

唯一语法：

- `:::fold[text 提示]` — 行内剧透（`.md-text`）；无 mode 时默认 text
- `:::fold[details 摘要]` — 块级折叠（`.md-details`）

旧围栏名已删除，不再解析。实现：`scripts/marked-fold.js`。

## 后果

- 写作侧只记一种围栏
- `ink.js` 仍只处理 `.md-text` 点击切换
