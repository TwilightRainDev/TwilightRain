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
