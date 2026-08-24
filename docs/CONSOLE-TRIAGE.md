# 浏览器控制台分诊

本页记录**真机/桌面浏览器**在验收页上的 Console 现象、分诊结论与修复状态。  
改 `ink.js`、giscus、GitHub 卡片或站点卡回退逻辑前可先查此表。

**关联文档**：[SECURITY.md](SECURITY.md)（CSP / loopback 误报）、[THEME.md](THEME.md#giscus)、移动端台账 `A:\work_zone\Docs\TwilightRain-移动端技术债务.md`（TD-014）。

**末次复核**：2026-08-24 | 验收页：`/2026/08/17/blog-writing-features/` | 环境：真机 + PC Edge

---

## 状态图例

| 标记 | 含义 |
|------|------|
| 已修 | 本站代码已改，部署后不应再出现 |
| 环境噪声 | 特定浏览器/扩展/自动化环境误报，真机正常可忽略 |
| 观察 | 性能 Violation 或第三方脚本，不影响功能 |
| 忽略 | 非错误或非本站可控 |

---

## 分诊总览

| # | 现象 | 分类 | 状态 | 说明 |
|---|------|------|------|------|
| 1 | `github.com/favicon.ico` CORS / loopback | 站点卡 avatar 回退 | 已修 | `scripts/lib/favicon-fallback.js` 对 `github.com` 改用 `github.githubassets.com` favicon |
| 2 | `api.github.com` fetch loopback 失败 | GitHub 卡片动态数据 | 环境噪声 | 同 TD-014；静态卡片仍可用，无 S302 时 API 正常 |
| 3 | giscus `postMessage` origin 不匹配 | 评论主题同步 | 已修 | giscus `defer` + ink.js 预先写 `data-theme`；仅收到 giscus.app 首条 `message` 后再 postMessage |
| 4 | 图片 lazy-load `[Intervention]` | 浏览器提示 | 忽略 | 非错误 |
| 5 | Forced reflow / long task / passive 监听器 | 性能 Violation | 观察 | 多来自 giscus、B 站 embed 或第三方 |
| 6 | B站 `bili-user-fingerprint` report not found | B 站 embed 内部 | 忽略 | 嵌入页脚本，不影响阅读 |
| 7 | `stadium.js` Error | B 站 embed 内部 | 忽略 | 播放器 bundle 依赖，非本站代码 |

---

## 原始摘录（归档）

```
[Intervention] Images loaded lazily and replaced with placeholders...
Access to image at 'https://github.com/favicon.ico' ... loopback address space
Failed to execute 'postMessage' on 'DOMWindow': ... giscus.app ... twilightrain.com
Access to fetch at 'https://api.github.com/repos/...' ... loopback address space
GitHub card data unavailable for ... Failed to fetch
bili-user-fingerprint: report is not found
[Violation] Forced reflow / requestIdleCallback / non-passive listener ...
stadium.js:1 Error
```

---

## 分诊说明

### loopback address space 不等于「部署在 localhost」

Edge/Chrome 在私有网络访问策略、S302、DevTools 附加等环境下，对 `twilightrain.com` 发起的 `fetch`/`img` 也可能误报 loopback。站点已部署公网；以**无扩展的真机 Chrome/Safari** 为准（见 TD-014、[SECURITY.md → connect-src](SECURITY.md#安全头机制)）。

### GitHub API 失败

`::card{type="github"}` 卡片保留静态 owner/repo、desc；stars/forks 等为渐进增强（`themes/ink/source/js/ink.js`），失败不应判「页面损坏」。

### giscus postMessage

评论区 `data-loading="lazy"`，iframe 在 cross-origin 文档就绪前 `contentWindow` 仍为同源，提前 postMessage 会报错。

**修复要点**（`themes/ink/layout/partial/comments.ejs` + `ink.js`）：

1. giscus client 使用 `defer`（在 ink.js 之后执行）。
2. ink.js 在 client 执行前写入 `data-theme`。
3. 监听 `message`（`origin === https://giscus.app`）标记就绪后再 `postMessage` 同步主题。

### B 站 embed（stadium.js / fingerprint）

来自 `::bilibili` 嵌入播放器内部脚本，无法在本站修复，可忽略。

---

## 验收清单

1. `blog-writing-features/`：切换明暗主题，Console 无 giscus postMessage 报错。
2. 含 GitHub 站点卡（avatar 留空）：Console 无 `github.com/favicon.ico` 报错。
3. GitHub 卡片：真机可见 stars/forks；Edge loopback 报错可忽略。
4. B 站 embed：可播放；指纹/report/stadium 警告可忽略。

---

## 维护约定

- 新 Console 现象：先分诊（本站缺陷 / 环境噪声 / 第三方），再更新上表；**已修**项须注明涉及文件。
- 与移动端 TD 重复时，TD 台账记状态，本页记 Console 原文与修复细节。
- 勿将本页内容复制到 `work_zone/Docs` 第二份；以本文件为事实源。
