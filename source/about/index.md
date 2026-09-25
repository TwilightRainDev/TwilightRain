---
title: 关于我
excerpt: 写代码的 TwilightRain：前端 JS/TS、桌面端 C# .NET，博客记录技术探索与日常思考，欢迎评论区打招呼。
date: 2026-07-13 17:44:00
updated: 2026-07-25
tags:
  - 博客
categories:
  - 随笔
cover: /img/360px/avatar.jpg
---

> 写代码的，偶尔折腾点小东西。

### 我是谁

网名 **<span id="twilight-rain-name" class="hover-trigger">TwilightRain</span>**，写点前端也写点桌面端。前端主要用 JavaScript / TypeScript，桌面端用 C# .NET 搞些 WinForms 小工具。平时会鼓捣一些脚本、工具、小项目。这个博客主要用来记录技术探索和日常思考。

<style>
/* 左下角悬浮皮肤：透明渲染，深浅主题通用 */
.mc-skin-widget {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 100;
  pointer-events: none;
}
.mc-skin-widget::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 7%;
  width: 55%;
  height: 6%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.35) 0%, transparent 70%);
}
.mc-skin-widget canvas {
  display: block;
  width: 210px;
  height: auto;
  cursor: grab;
  pointer-events: auto;
}
.mc-skin-widget canvas:active { cursor: grabbing; }
@media (max-width: 640px) {
  .mc-skin-widget { left: 12px; bottom: 12px; }
  .mc-skin-widget canvas { width: 150px; }
}
</style>
<div class="mc-skin-widget">
<canvas id="mc-skin-canvas" aria-label="TwilightRain Minecraft 皮肤 3D 预览"></canvas>
</div>
<script src="/mc-skin/skinview3d.bundle.js"></script>
<script src="/mc-skin/viewer.js"></script>

### 做过什么

:::fold[details 全部作品（7 项）]
- **TwilightRain**（JavaScript）— 本博客：Hexo 8 + ink 定制主题，Cloudflare Pages 部署
- **TwilightRainTimeTrack**（Kotlin）— 时间热力图：记录手机使用时间，GitHub 式格点展示，数据全本地
- **TwilightRainBiliCompact**（JavaScript）— BiliCompact：精简 B 站网页信息流的 Tampermonkey 用户脚本，四语言界面
- **TwilightRainTextTool**（C#）— Windows 文本处理桌面工具：行合并、文件拼接、中文截断修复、标点替换
- **DSClaudeCodeRouter**（JavaScript）— 将 dsh-routing-suite 移植到 Claude Code
- **claude-skills**（Markdown）— Claude Code 技能聚合仓库
- **HowToAskQue**（Markdown）— 《提问的智慧》中文版：2026 现代版 + 经典原文对照
:::

写作与运维常用的几个入口：GitHub、Cloudflare Dashboard、Greasy Fork、npm、Can I Use、MDN，
整理在[友链页](/links/)。

### 技能

- **JavaScript / TypeScript** — 前端与脚本开发（博客主题、用户脚本、工具链）
- **Kotlin** — Android 应用开发（TimeTrack 时间热力图）
- **C#** — Windows 桌面应用（TextTool 文本工具）
- **Node.js** — 构建工具链、Claude Code 技能与自动化脚本
- **Hexo** — 静态博客框架（本博客，含主题深度定制）
- **Git / GitHub** — 版本管理与 CI/CD 工作流（Cloudflare Pages 部署）

### 写博客干嘛

一是给自己留个记录，二是万一有人遇到类似问题，搜到这里能有个参考。


## 联系方式

- **GitHub**: [TwilightRainDev](https://github.com/TwilightRainDev)
- **B站**: [TwilightRain](https://space.bilibili.com/403777931)

---

*博客基于 [Hexo](https://hexo.io/) 构建，主题为自用的 ink，源码托管在 [GitHub](https://github.com/TwilightRainDev/TwilightRain)。*
