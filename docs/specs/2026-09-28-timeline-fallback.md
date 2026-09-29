# 规格：移除时间线 front matter 兜底快照

> 来源：`docs/BACKLOG.md`「移除时间线的 front matter 兜底快照」。
> 触发已满足：线上 `/timeline/` 已显示 git-log 事件（含 2026-09-26 提交），不是 7 条手写兜底。

## 1. 要解决什么

`source/timeline/index.md` 仍带着一组停在 2026-08-17 的手写 `items:`。
构建期 git 日志非空时这组数据不会出现在页面上，但浅克隆 / git 失败时 helper 会拿它当兜底，把过期快照当成「正常页面」。

Cloudflare Pages 已有完整 git 历史。兜底快照没有继续保留的理由。

## 2. 范围

| 做 | 不做 |
|---|---|
| 删除 `source/timeline/index.md` 的 `items:` | 改 git 事件口径（ADR-0011） |
| 告警改指向 `docs/WORKFLOW.md`「构建前置」 | 把 `git fetch --unshallow` 写进 helper 或 ADR |
| 空 git / 浅克隆 / git 失败渲染「暂无记录。」 | 改 `timeline.ejs` 的 helper 调用（`page.items` 变为 undefined 即可） |
| 单测覆盖 empty / undefined items 不抛 | 断言绝对事件数 |
| 更新 ADR-0011 后果 | BACKLOG / THEME / ARCHITECTURE / WORKFLOW（父代理收口） |

## 3. 行为

- 数据源仍是构建期 `git log`。非空则渲染 git 事件。
- `source/timeline/index.md` 只保留 `title` / `layout` / `comments`，没有 `items:`。
- helper `timeline_page_html` 仍接受 `page.items`，时间线页不再提供该字段，值为 undefined。
- `cachedEvents` 为空、undefined、或 helper 收到 empty / undefined / null 的 fallback 时，`renderPageTimeline` 输出 `<p>暂无记录。</p>`，不抛。
- 浅克隆告警不再写裸 `git fetch --unshallow`，也不再说「改用 front matter 兜底列表」；指向 `docs/WORKFLOW.md`「构建前置」。git 日志失败告警同样不再提兜底列表。

## 4. 完成判据

1. `source/timeline/index.md` 无 `items:` 键；HTML 注释不再把 items 快照说成兜底。
2. `scripts/timeline-page.js` 不含 `git fetch --unshallow`，不含「改用 front matter 兜底列表」。
3. ADR-0011 写明：兜底快照已删；浅克隆得到空页是已知代价；构建写法仍指向 WORKFLOW.md，不复制命令。
4. `npm test` 全绿；含 empty / undefined items -> `暂无记录。` 且不抛。不断言绝对事件数。
5. 不跑 `hexo clean` / `npm run build`（避免改 `public/`）。
