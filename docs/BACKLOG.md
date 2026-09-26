# 待办（已拍板未排期）

本文件记录**已决定要做、但尚未排期**的事项。与 [EXCLUDED.md](EXCLUDED.md) 相反：
EXCLUDED 是「不要做」，本文件是「要做，等下一轮」。

## IndexNow 提交

- 来源：ADR-0009（2026-09-25 拍板保留密钥文件）
- 现状：密钥文件在站点根，可直接用；没有任何提交机制
- 要做：按 EXCLUDED.md 的原判定「走独立 CI」，在构建后或定时任务里向 IndexNow 端点提交新 URL
- 已定：不在 Hexo 构建链路里加提交步骤

## 移除时间线的 front matter 兜底快照

- 来源：ADR-0011（时间线改读 git 日志）
- 条件：Cloudflare Pages 构建命令已按 [WORKFLOW.md → 构建前置](WORKFLOW.md#构建前置构建环境必须有完整-git-历史)
  配好完整 git 历史（命令写法见该节，不要在此复制一份，免得两处各自漂移），
  且线上 `/timeline/` 连续若干次部署都显示 git 来源的事件（而非兜底快照）
- 动作：删除 `source/timeline/index.md` 的 `items:` front matter

## 大型 `ink.js` 拆分

- 来源：[EXCLUDED.md](EXCLUDED.md)「计划范围外」条目（原写「单独 backlog」）
- 现状：`themes/ink/source/js/ink.js` 单文件承载全部交互模块（模块清单见 ARCHITECTURE.md 的
  ink.js 模块表）
- 要做：按模块边界拆分，降低单文件维护面
- 已定：**不为拆而拆**，不单独排期；仅在确有维护需要时进行
