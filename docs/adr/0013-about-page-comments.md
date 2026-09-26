# ADR-0013：关于页默认开启评论

## 状态

已实施

## 背景

`themes/ink/layout/page.ejs` 一律挂 `partial/comments.ejs`，是否渲染由
`page.comments !== false` 决定。关于页 `source/about/index.md` 没有写 `comments: false`，
因此构建结果带 giscus 评论区；友链页则显式写 `comments: true`。

**这是刻意设计**：「默认开」容易被当成 bug「修掉」——它看起来像是漏写了 `comments: false`。

## 决策

明确记录：关于页开评论是刻意的，默认值不动。

## 后果

- 关于页保留评论区（读者可以打招呼）
- 将来若要关，在 `source/about/index.md` 的 front matter 加 `comments: false` 即可，不必改布局
