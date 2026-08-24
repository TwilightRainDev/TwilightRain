# ADR-0005：时间线共享渲染器，CSS 仍两套

文内 `:::timeline` 与站点页 `/timeline/` 共用 `scripts/lib/timeline-renderer.js` 生成 DOM，不合并 Markdown 语法。

拍板曾写「CSS 一处」。两端布局不同（文内竖线节点 vs 展柜按年+日期），合并 class 会改视觉。因此 HTML 生成合一，`.post-timeline` 与 `.timeline-*` 仍隔离。
