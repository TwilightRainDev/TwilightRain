# 待办（已拍板未排期）

本文件记录**已决定要做、但尚未排期**的事项。与 [EXCLUDED.md](EXCLUDED.md) 相反：
EXCLUDED 是「不要做」，本文件是「要做，等下一轮」。

## IndexNow 提交

- 来源：ADR-0009（2026-09-25 拍板保留密钥文件）
- 现状：**已落地（2026-09-28）**，见 [ADR-0017](adr/0017-indexnow-submit.md)
- 已定：不在 Hexo 构建链路里加提交步骤（仍有效）

## 移除时间线的 front matter 兜底快照

- 来源：ADR-0011（时间线改读 git 日志）
- 现状：**已落地（2026-09-28）**，见 [ADR-0011](adr/0011-timeline-from-git.md) 与
  [规格](specs/2026-09-28-timeline-fallback.md)
- 浅克隆现在得到「暂无记录。」，构建命令仍必须按 [WORKFLOW.md → 构建前置](WORKFLOW.md#构建前置构建环境必须有完整-git-历史) 配完整 git 历史

## 大型 `ink.js` 拆分

- 来源：[EXCLUDED.md](EXCLUDED.md)「计划范围外」条目（原写「单独 backlog」）
- 现状：`themes/ink/source/js/ink.js` 单文件承载全部交互模块（模块清单见 ARCHITECTURE.md 的
  ink.js 模块表）
- 要做：按模块边界拆分，降低单文件维护面
- 已定：**不为拆而拆**，不单独排期；仅在确有维护需要时进行
