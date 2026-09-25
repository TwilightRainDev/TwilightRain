# 待办（已拍板未排期）

本文件记录**已决定要做、但尚未排期**的事项。与 [EXCLUDED.md](EXCLUDED.md) 相反：
EXCLUDED 是「不要做」，本文件是「要做，等下一轮」。

## IndexNow 提交

- 来源：ADR-0009（2026-09-25 拍板保留密钥文件）
- 现状：密钥文件在站点根，可直接用；没有任何提交机制
- 要做：按 EXCLUDED.md 的原判定「走独立 CI」，在构建后或定时任务里向 IndexNow 端点提交新 URL
- 已定：不在 Hexo 构建链路里加提交步骤

## 自研灯箱替换 fancybox + jQuery

- 来源：2026-09-25 拍板（D1-B）；因相册页删除（T5）后灯箱只剩文章页一个使用点，改自研的收益变大
- 现状：`themes/ink/layout/post.ejs` 引 cdnjs 的 jQuery 3.5.1 + fancybox 3.5.7；`ink.js`
  为适配 fancybox 3.5.7 的 `afterClose` 行为写了兼容代码（原图被移进灯箱后需恢复）
- 要做：重写灯箱（缩略图/原图切换、键盘导航、`data-ori` 原图入口），下线两个第三方依赖
- 已定：单独一轮做，不与其他收敛任务混提

## 双链复核（验证条件）

- 来源：ADR-0010（2026-09-25 拍板保留双链并补两条用例）
- 条件：下一轮功能扫描时，若双链仍只有 2026-09-25 补的这两条、且无新增用例，
  则删除整支（`scripts/wikilinks.js` + `scripts/lib/wikilinks.js` + `test/lib/wikilinks.test.js`
  + `themes/ink/layout/post.ejs` 文末区块 + `.post-wikilinks*` CSS），文末只留 prev/next
- 已定：届时直接执行，不再单独拍板

## 移除时间线的 front matter 兜底快照

- 来源：ADR-0011（时间线改读 git 日志）
- 条件：Cloudflare Pages 构建命令已按 [WORKFLOW.md → 构建前置](WORKFLOW.md#构建前置构建环境必须有完整-git-历史)
  配好完整 git 历史（命令写法见该节，不要在此复制一份，免得两处各自漂移），
  且线上 `/timeline/` 连续若干次部署都显示 git 来源的事件（而非兜底快照）
- 动作：删除 `source/timeline/index.md` 的 `items:` front matter
