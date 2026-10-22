---
title: BiliCompact 完整源码与解析
excerpt: BiliCompact 用户脚本 v2.6.0 源码与回顾。
date: 2026-07-22 12:00:00
tags:
  - BiliCompact
  - Tampermonkey
  - JavaScript
  - 源码
  - 前端
  - 产品设计
  - 架构
categories:
  - 代码仓库
cover: /img/360px/covers/bilicompact-source.jpg
---

> 以下为 BiliCompact 用户脚本 v2.6.0 的完整源码，MIT 协议，可自由使用、修改、分发。
> 安装方法：复制到 Tampermonkey / Violentmonkey 新建脚本中保存即可。
> 从动机、设计、技术三个维度完整回顾这个非侵入式的 B 站首页精简用户脚本项目。

::card{type="github" repo="TwilightRainDev/TwilightRainBiliCompact" desc="BiliCompact 官方仓库：完整源码、版本发布与 issue 追踪"}

## 一、一键安装

<span class="install-badge">推荐</span>

### 方式一：Greasyfork 直接安装（推荐）

点击下方按钮，一键安装到 Tampermonkey / Violentmonkey：

<div class="install-block">
    <a class="install-btn" href="https://greasyfork.org/scripts/585777" target="_blank" rel="noopener">
        从 Greasyfork 安装
    </a>
    <p class="install-hint">已上架 Greasyfork，自动更新，省心省力。</p>
</div>

### 方式二：复制源码，手动创建

如果你想审查每一行代码再安装，也可以复制源码，在 Tampermonkey 中新建脚本，粘贴保存即可。

```bash
1. 打开浏览器的 Tampermonkey / Violentmonkey 扩展
2. 点击「新建脚本」
3. 删除默认内容，粘贴源码
4. Ctrl+S 保存
```

源码文件在这里，点开就能复制或另存：[user.main.js](/downloads/user.main.js)

两种方式效果完全一致，推荐方式一，后续新版本会自动推送更新。
![](/img/360px/bilicompact-rainbow.jpg)


项目地址：[GreasyFork - BiliCompact](https://greasyfork.org/scripts/585777)




---


## 二、为什么要写这个脚本

写了一天代码，晚上瘫在椅子上，打开 B 站想刷两个视频放松一下。

结果首页一刷新，直播，番剧，推广，付费课程铺了一整屏。我就想看两三个视频，信息量却先灌一脸，反而更累了。

这种憋屈感持续了挺久。不是说直播没人爱看，番剧没人追，但 B 站不管你想看什么，一股脑全塞给你。

我忍过，也试过假装看不见。但每次打开首页都像被按着头喂饭。后来觉得与其每次都烦，不如自己动手。

于是有了 **BiliCompact**。

要求很简单，首页想显示几个视频就显示几个。十个太多？五个。五个还多？三个也行。直播，广告，番剧推广，不想看就别出现。评论区满屏的 @某某某 刷屏，能自动清掉最好。然后就动手了。

::bilibili{id="BV1KEgk64EHJ"}

## 三、B 站首页的信息过载

打开 B 站首页，扑面而来的是：

- 直播流，大量正在直播的推荐
- 番剧推荐，你不一定感兴趣
- 广告与推广，商业内容
- 付费课程，推销入口

真正想看的视频，被淹没在其中。

```
直播 ████████████████████████████████████ 100%
番剧 ██████████████████████████████ 80%
广告 ████████████████████ 50%
付费 ██████████ 20%
想看 ██████ 12%
```

## 四、非侵入式的设计哲学：

很多同类脚本会在页面注入 UI 元素，按钮、浮窗、侧边栏。好处是交互直观，坏处是**耦合太深**。B 站的前端频繁改版，每次 DOM 结构调整，注入的 UI 就可能错位、失效，甚至阻塞页面渲染。

BiliCompact 的做法相反：

- **不在 B 站页面注入任何 UI 元素**
- 配置面板通过 Tampermonkey 的 `GM_registerMenuCommand` 唤起，以浮层形式展示
- 所有过滤逻辑在后台执行，页面外观无变化

```
GM_registerMenuCommand(T('MenuSettings'), () => OpenConfigPanel());
GM_registerMenuCommand(T('MenuRefresh'), () => LimitVideos());
GM_registerMenuCommand(T('MenuToggle'), () => { IsActive = !IsActive; });
```

这样做的代价是交互入口不那么直观，藏在扩展菜单里，但换来的是**高稳定性**，B 站改版几次了，脚本还能正常工作。

## 五、功能速览

| 功能 | 说明 |
|------|------|
| 数量限制 | 设置每页最大显示视频数量，不同页面可独立设置 |
| 智能过滤 | 排除直播 / 广告 / 番剧 / 付费课程 |
| UP 主白名单 | 保留指定 UP 主的内容 |
| 一键切换 | 快捷开关，随时恢复原始首页 |
| 评论净化 | 删除 @ 提及，隐藏短评论 |
| 配置持久化 | 跨页面保存所有设置 |

### 配置面板

通过 Tampermonkey 菜单打开：

| 设置项 | 说明 | 默认 |
|--------|------|------|
| 最大显示数量 | 每页最多显示的视频数 | 10 |
| 排除直播 | 隐藏直播推荐 | [Checked] |
| 排除广告 | 隐藏推广内容 | [Checked] |
| 排除番剧 | 隐藏番剧推荐 | [Checked] |
| 排除付费课程 | 隐藏付费内容 | [Checked] |
| 保留推广位 | 推广内容不计入数量 | [Unchecked] |
| 调试模式 | 输出日志到控制台 | [Unchecked] |
| 评论净化 | 自动删除 @ 提及 | [Unchecked] |

每种页面可以独立配置数量：首页 10、热门 8、分区 10、动态 6、搜索 10。

## 六、技术架构

### 选择器探测机制

B 站首页的 DOM 结构经常变化，直接写死 CSS 选择器是行不通的。脚本实现了一套**多层级降级探测**策略：

```
第一层  id / class 精准选择器              覆盖 2%
第二层  data-* 属性探测 (data-video-id)     +3%
第三层  宽泛属性选择器 [class*="video"]      +5%
第四层  链接文本回退 (<a href="/video/">)    +80%
────────────────────────────────────────
最终覆盖率                                  99%+
```

具体实现上，每层依次尝试：

1. **精确类名**（`.bili-video-card`, `.feed-card` 等）
2. **通配类名**（`[class*="video-card"]` 等）
3. **通过链接回退**（查找包含 `/video/` 链接的父级卡片）

选择器被缓存，在 URL 变化时自动失效重新探测，适应 SPA 路由切换。

### 过滤引擎

过滤逻辑分为几个阶段，顺序执行：

1. **去重**：消除嵌套卡片，避免同一个视频被重复计数
2. **规则过滤**：按配置排除直播、广告、番剧、付费内容
3. **UP 主白名单**：指定 ID 的 UP 主视频始终保留
4. **数量截断**：超出限制的视频隐藏
5. **推广位保护**：配置为保留推广位时，不计入数量限制

### Grid 塌陷处理

B 站使用 CSS Grid 布局，简单地 `display: none` 卡片元素不会让网格塌陷，会留下空白。

BiliCompact 的处理方式是同时设置多个样式：

```javascript
El.style.display = 'none';
El.style.visibility = 'hidden';
El.style.opacity = '0';
El.style.height = '0';
El.style.margin = '0';
El.style.padding = '0';
El.style.overflow = 'hidden';
El.style.flex = '0 0 0';
El.style.position = 'absolute';
```

通过 `height: 0` + `padding: 0` + `position: absolute` + `overflow: hidden` 的组合，确保网格完全塌陷，不留视觉空白。

### MutationObserver + 节流

为了应对 B 站 SPA 动态加载内容，BiliCompact 使用 `MutationObserver` 监听 DOM 变化：

```
DOM 变化 → MutationObserver 触发 → 防抖/节流(200ms) → 执行精简
                                                              ↕
                                                      定时回查(5s)
```

- 200ms **节流**：防止高频触发
- 300ms **防抖**：等待 DOM 稳定后再执行
- 5s **定时回查**：兜底处理动态加载的内容

### Shadow DOM 穿透

B 站新版评论区使用 Web Components 技术，评论内容在多层 Shadow DOM 内部：

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

净化器递归访问 `element.shadowRoot` 属性，穿透所有 Shadow DOM 边界，找到评论内容容器：

```javascript
function purifierGetContentsEl(renderer) {
    const richText = renderer.shadowRoot.querySelector('bili-rich-text');
    if (richText && richText.shadowRoot) {
        return richText.shadowRoot.getElementById('contents');
    }
    return null;
}
```

删除所有 `a[data-type="mention"]`（@ 提及标签），然后检查剩余文字长度，不足 5 字的评论整体隐藏。通过 MutationObserver 监听评论区动态加载，新评论出现时自动处理。同时兼容同页面其他脚本，检测到共存时仅做日志标记，不冲突。

### 元素去除系统

除了核心的视频数量限制，脚本还提供了一组可选的 UI 元素去除预设，涵盖首页轮播图、频道导航、创作中心入口、直播入口等 13 个可去除元素。每个预设包含多版本选择器，适配 B 站不同的 DOM 版本。

### 多语言支持

内置完整的 i18n 系统，支持简体中文、繁体中文、英文，自动根据浏览器语言切换：

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

所有用户可见文本通过 `T(key, ...args)` 函数统一翻译，键缺失时自动回退到中文，不会出现英文报错。语言可在配置面板中手动切换，切换后立即生效。

### 持久化与实时生效

所有配置通过 `GM_setValue` / `GM_getValue` 持久化，刷新页面不丢失。配置变更后立即生效，无需手动刷新。同时包含定时后备检查（每 5 秒），防止 B 站 SPA 的动态加载导致视频数量超出限制，这是一种防御性编程，确保极端情况下也能正常工作。

## 七、用户反馈

没想到会有人愿意用这东西。

一开始只是自己用，顺手传到了 GreasyFork，想着万一有人需要呢。后来真有人说不用被首页轰炸了，还有人问能不能加某某功能。

看到这些还挺高兴的。

现在的互联网产品越做越重，功能越堆越多。但用户想要的，有时候就是清静一点。在产品和用户之间，BiliCompact 尝试稍微往用户这边拉一拉。

如果你也装了它，觉得有用，那我很高兴。觉得哪里不好用，也欢迎提。

代码完全开源，MIT 协议，想改就改，想删就删，没什么藏着掖着的。

## 八、总结

BiliCompact 在功能上并不复杂，它的设计重心在**稳定性**和**非侵入性**上。一些值得借鉴的点：

1. **选择器多梯队探测**，应对频繁的前端改版
2. **非侵入式 UI**，不污染页面 DOM，降低耦合
3. **Shadow DOM 穿透**，处理现代前端框架的封装
4. **防御性定时检查**，SPA 动态加载的兜底策略