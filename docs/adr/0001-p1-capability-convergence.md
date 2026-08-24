# ADR-0001：P1 能力收敛

## 状态

已实施（2026-08-24，阶段四）

## 背景

ink 主题累积了多套「文末推荐」「评论挂件」「Mermaid 双轨渲染」等重叠能力，维护面大且与双链/系列功能重复。

## 决策

按重叠报告 **P1 + 拍板对齐** 套餐删除：

- 相关文章（`related-posts.js`、post.ejs 文末区块）
- latest-comments 挂件（`latest-comments.js`）
- mermaid-static 构建期静态化（`mermaid-static.js`）
- 旧折叠语法 `:::hide` / `:::fold` / `:::folding`（阶段四物理删除）

保留：双链、系列文、prev/next、giscus、客户端 Mermaid、站点卡三件套。

## 后果

- 文末「还有什么可读」主要靠双链 + 系列 + 上下篇
- Mermaid 仅客户端渲染，首屏略慢但 CSP 与构建更简单
- `npm test` 移除 `related-posts.test.js`
