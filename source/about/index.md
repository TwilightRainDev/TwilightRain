---
title: 关于我
date: 2026-07-24
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

- [TwilightRain Text Tool](https://github.com/TwilightRainDev/TwilightRainTextTool) -- 集行合并、文件拼接、中文截断修复、标点替换于一体的 Windows 文本处理桌面工具，纯 C# 构建，支持国际化与深色模式。
- [BiliCompact](https://greasyfork.org/scripts/585777) -- 一个 Tampermonkey 用户脚本，用于精简 B 站网页端首页。支持控制视频数量、过滤直播/广告/番剧推广、净化评论区。非侵入式设计，不在页面注入 UI。
- [GitHub](https://github.com/TwilightRainDev)
- [B站](https://space.bilibili.com/403777931)

### 写博客干嘛

一是给自己留个记录，二是万一有人遇到类似问题，搜到这里能有个参考。
