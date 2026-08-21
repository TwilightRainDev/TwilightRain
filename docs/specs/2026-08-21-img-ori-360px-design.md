# 设计：原图 / 360px 双轨图片（方案一）

> 日期：2026-08-21 | 状态：已批准（对话确认方案一 + 开工）

## 问题陈述

博客首页与文章流加载时，访客直接拉取接近原图体量的 JPEG（封面池约 800×800、单张可达 200KB+），且首页 `ink.js` 对每张缩略图做全分辨率 canvas 取色，主线程易卡顿。需要在**不换图床域名/托管方式**的前提下，让访客默认只看到处理后的小图，原图仅在明确操作时打开。

## 用户决策

1. **方案一**：仓库只提交原图；360px 为构建产物，不进 git（防历史膨胀）。
2. 目录：`source/img/ori/`（原图，入库）与 `source/img/360px/`（小图，gitignore）。
3. 小图规格：居中裁切 **360×360**；压缩用现成轻量库（sharp），不自造算法。
4. 生成时机：日常脚本 + `hexo generate` / `npm run build` 兜底补漏。
5. 展示：页面上看到的栅格图/正文图/灯箱内画面均为 360px；fancybox（`.fancybox-content`）左上角「查看原图」新标签打开对应 ori URL。
6. 例外不进双轨：`icon.svg`、主题光标等非内容栅格资源保持原路径。

## 路径约定

| 角色 | 磁盘 | 公开 URL |
|------|------|----------|
| 原图 | `source/img/ori/<rel>` | `/img/ori/<rel>` |
| 展示图 | `source/img/360px/<rel>`（生成） | `/img/360px/<rel>` |

同一逻辑资源共用相对路径 `<rel>`（例：`covers/cover-01.jpg`）。

作者侧引用约定（迁移后）：

- 正文 / `cover` / gallery 等**展示用**路径写 `/img/360px/...`（或经构建期改写从旧 `/img/...` 迁过来）。
- 每个可放大的 `<img>`（或 gallery 的 `<a>`）带 `data-ori="/img/ori/..."`，供「查看原图」使用。
- `og:image` / JSON-LD 等社交预览使用 **ori**（质量优先）。

## 架构

```
source/img/ori/**          → git 跟踪
scripts/gen-thumbs.js      → 扫描 ori，居中裁 360，写入 source/img/360px/**
source/img/360px/**        → .gitignore；构建时生成后由 Hexo 拷入 public/
hexo before_generate 钩子  → 调用同一生成逻辑兜底
ink.js / 模板              → 引用 360px；fancybox 工具条加「查看原图」
```

Cloudflare Pages 构建：`npm run build` 内先跑缩略图生成，再 `hexo generate`，无需把 360px 推进仓库。

## 边界

- 已是正方形的图：仍经同一管线（可覆盖写入，mtime/尺寸可做跳过优化）。
- 小于 360 的边：放大到覆盖 360 再裁，或 contain 后补边——采用 **cover 居中裁切**（与现封面池视觉一致）。
- `links/` 头像等小 PNG：同样进 ori/360px，避免特例分支；SVG / cursors 除外。
- 首页取色：在 360px 图上取色，且 canvas 降采样后再统计，避免主线程扫满像素。

## 范围之外

- 不上 CDN 实时缩放、不换外部图床。
- 不引入第二档「中图」尺寸（仅 ori + 360px）。
- 不把 360px 提交进 git。
- 不改 fancybox 大版本（仍 3.5.7）。
