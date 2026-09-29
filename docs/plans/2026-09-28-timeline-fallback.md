# 计划：移除时间线 front matter 兜底快照

规格：`docs/specs/2026-09-28-timeline-fallback.md`。

## 任务

1. **页面**：删 `source/timeline/index.md` 的 `items:`，改 HTML 注释。
2. **helper**：`scripts/timeline-page.js` 去掉兜底列表叙事；浅克隆告警指向 WORKFLOW.md「构建前置」。
3. **ADR**：`docs/adr/0011-timeline-from-git.md` 后果改为「快照已删，浅克隆得空页」。
4. **测试**：`test/lib/timeline-renderer.test.js` 补 undefined；新增 `test/lib/timeline-page.test.js` 锁 helper 空输入与源码契约。
5. **验收**：`npm test`。不跑 `hexo clean` / `npm run build`。

## 顺序

先改页面与 helper，再 ADR，再测试。`timeline.ejs` 保持 `timeline_page_html(page.items)`，无需改调用。
