# ADR-0006：产品面再收敛（删 `::inline`、卡片收 github+link、残留清理）

依据 `Docs/Blog-docs/Blog-feature-再收敛评估.md`（2026-08-25）与 `_posts` 用量检索。

残留清理：`.photo-grid` CSS / 取色排除 / 文档提及随 `_config.landscape.yml` 一并删除（`:::grid` 早已替代）；marked 的空 `<a class="headerlink">` 在 `lib/heading-anchor.js` 剥掉（`headerIds` 不能关，关掉标题丢 id），正文只留 `.heading-anchor`；details 样式选择器收敛为 `article details.md-details`，只服务 `:::fold[details]`。

产品面：`::inline`（btn/label）整支删除，仅样板文在用；按钮用 Markdown 链接或卡片，标签用提示块或加粗。`::card` 收敛为 `github` + `link`；site / intro / `:::card-group` 仅样板文在用且维护面最大（截图路径、占位图、favicon 回退、Playwright 可选链），连同 `screenshot-cards.js`、`lib/favicon-fallback.js`、`site-card-placeholder.svg` 一起删除。友链页继续用 `links.ejs`，不改用文内卡片。

保留项（拍板不删，勿当缺口）：`:::tabs`、`::bilibili`、`::series`、文内 `:::timeline`、MathJax、`/skills/` 等独立页、关于页评论。
