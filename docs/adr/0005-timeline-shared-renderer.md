# ADR-0005：时间线共享渲染器，CSS 仍两套

## 状态

已实施

## 决策

文内 `:::timeline` 与站点页 `/timeline/` 共用 `scripts/lib/timeline-renderer.js` 生成 DOM，
不合并 Markdown 语法；但 CSS 仍两套：`.post-timeline` 与 `.timeline-*` 保持隔离。

## 后果

拍板原写「CSS 一处」，实际不能合并——两端布局不同（文内竖线节点 vs 站点页按年 + 日期），
合并 class 会改视觉。故 HTML 生成合一，class 与样式隔离。
