---
title: BiliCompact 技术解析：一个非侵入式B站首页精简脚本的架构设计
date: 2026-07-21 15:10:00
tags:
  - BiliCompact
  - Tampermonkey
  - JavaScript
  - 前端
  - 架构
categories:
  - 技术笔记
---

## 项目背景

[BiliCompact](https://greasyfork.org/scripts/585777) 是一个 Tampermonkey 用户脚本，用于精简 Bilibili 网页端首页。它的核心功能很简单：控制首页显示的视频数量、过滤直播/广告/番剧/付费内容、净化评论区。

但简单的功能背后，有一些值得聊聊的设计决策。

<!-- more -->

## 设计原则：非侵入式

这是整个脚本最核心的设计决策。

很多同类脚本会在页面注入 UI 元素——按钮、浮窗、侧边栏。好处是交互直观，坏处是**耦合太深**。B 站的前端频繁改版，每次 DOM 结构调整，注入的 UI 就可能错位、失效，甚至阻塞页面渲染。

BiliCompact 的做法相反：

- **不在 B 站页面注入任何 UI 元素**
- 配置面板通过 Tampermonkey 的 `GM_registerMenuCommand` 唤起，以浮层形式展示
- 所有过滤逻辑在后台执行，页面外观无变化

```
// 配置菜单藏在浏览器扩展里
GM_registerMenuCommand(T('MenuSettings'), () => OpenConfigPanel());
GM_registerMenuCommand(T('MenuRefresh'), () => LimitVideos());
GM_registerMenuCommand(T('MenuToggle'), () => { IsActive = !IsActive; });
```

这样做的代价是交互入口不那么直观（藏在扩展菜单里），但换来的是**高稳定性**——B 站改版几次了，脚本还能正常工作。

## 多语言支持

脚本内置了完整的 i18n 系统，支持简体中文、繁体中文、英文，并且能自动根据浏览器语言切换：

```javascript
function ResolveLanguage() {
    if (Config.Language && Config.Language !== 'auto') {
        return Config.Language;
    }
    const Nav = (navigator.language || '').toLowerCase();
    if (/^zh-(tw|hk|mo)$/i.test(Nav) || /^zh-(hant)$/i.test(Nav)) return 'zh_TW';
    if (/^zh/i.test(Nav)) return 'zh_CN';
    if (/^en/i.test(Nav)) return 'en_US';
    return 'zh_CN';
}
```

所有用户可见文本通过 `T(key, ...args)` 函数统一翻译，键缺失时自动回退到中文，不会出现英文报错。

## 选择器探测机制

B 站首页的 DOM 结构经常变化，直接写死 CSS 选择器是行不通的。脚本实现了一套**多梯队选择器探测**机制：

1. **第一梯队**：精确类名（`.bili-video-card`, `.feed-card` 等）
2. **第二梯队**：通配类名（`[class*="video-card"]` 等）
3. **第三梯队**：通过链接内容回退（查找包含 `/video/` 链接的父级卡片）

```javascript
function DetectSelector() {
    // 第一梯队：具体选择器
    const SpecificCandidates = [
        '.bili-video-card', '.feed-card', '.bili-feed-card',
        '.floor-single-card', '.video-item', '.feed-item'
    ];
    // ...
    // 第二梯队：宽泛选择器
    const BroadCandidates = [
        '[class*="video-card"]', '[class*="bili-video"]', '[class*="feed-card"]'
    ];
    // 第三梯队：通过链接回退
    const LinkSelectors = [
        'a[href*="/video/"]', 'a[href*="/bangumi/"]'
    ];
}
```

选择器被缓存，在 URL 变化时自动失效重新探测，适应 SPA 路由切换。

## 过滤引擎

过滤逻辑分为几个阶段，顺序执行：

1. **去重**：消除嵌套卡片，避免同一个视频被重复计数
2. **规则过滤**：按配置排除直播、广告、番剧、付费内容
3. **UP 主白名单**：指定 ID 的 UP 主视频始终保留
4. **数量截断**：超出 `MaxVideos` 的视频隐藏
5. **推广位保护**：配置为保留推广位时，不计入数量限制

隐藏时不只是设置 `display: none`，还会处理 B 站的 CSS Grid 布局问题——将隐藏卡片设为 `position: absolute`，防止网格留白：

```javascript
function ApplyHideStyles(El) {
    El.style.display = 'none';
    El.style.visibility = 'hidden';
    El.style.opacity = '0';
    El.style.height = '0';
    El.style.margin = '0';
    El.style.padding = '0';
    El.style.overflow = 'hidden';
    El.style.flex = '0 0 0';
    El.style.position = 'absolute';
}
```

## 评论净化器

评论区的一个痛点：大量 @提及 刷屏。脚本实现了 Shadow DOM 穿透的评论净化功能。

B 站评论区使用了多层 Shadow DOM：

```
<bili-comments>
  └─ shadowRoot →
    <bili-comment-thread-renderer>
      └─ shadowRoot →
        <bili-comment-renderer>
          └─ shadowRoot →
            <bili-rich-text>
              └─ shadowRoot → #contents
```

净化器需要穿透这些 Shadow DOM 边界，找到评论内容容器，删除所有 `a[data-type="mention"]`（@提及标签），然后检查剩余文字长度，不足 5 字的评论整体隐藏：

```javascript
function purifierGetContentsEl(renderer) {
    const richText = renderer.shadowRoot.querySelector('bili-rich-text');
    if (richText && richText.shadowRoot) {
        return richText.shadowRoot.getElementById('contents');
    }
    return null;
}
```

通过 MutationObserver 监听评论区动态加载，新评论出现时自动处理。同时兼容同页面其他脚本（如 BilibiliBlocker），检测到共存时仅做日志标记，不冲突。

## 元素去除系统

除了核心的视频数量限制，脚本还提供了一组可选的 UI 元素去除预设，涵盖首页轮播图、频道导航、创作中心入口、直播入口等 13 个可去除元素。每个预设包含多版本选择器，适配 B 站不同的 DOM 版本：

```javascript
const ELEMENT_REMOVAL_PRESETS = [
    {
        id: 'carousel',
        host: 'www.bilibili.com',
        name: '首页轮播图',
        selectors: [
            '#i_cecream > div.bili-feed4...',
            '#app > div.bili-feed4...'
        ]
    },
    // ... 更多预设
];
```

## 持久化与实时生效

所有配置通过 `GM_setValue` / `GM_getValue` 持久化，刷新页面不丢失。配置变更后立即生效，无需手动刷新。

脚本还包含定时后备检查（每 5 秒），防止 B 站 SPA 的动态加载导致视频数量超出限制——这是一种防御性编程，确保极端情况下也能正常工作。

## 总结

BiliCompact 在功能上并不复杂，它的设计重心在**稳定性**和**非侵入性**上。一些值得借鉴的点：

1. **选择器多梯队探测**——应对频繁的前端改版
2. **非侵入式 UI**——不污染页面 DOM，降低耦合
3. **Shadow DOM 穿透**——处理现代前端框架的封装
4. **防御性定时检查**——SPA 动态加载的兜底策略

如果你对完整源码感兴趣，可以从 GreasyFork 安装体验：[BiliCompact](https://greasyfork.org/scripts/585777)（MIT 协议，欢迎修改和分发）。
