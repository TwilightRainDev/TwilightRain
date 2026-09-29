# 架构总览

## 系统组成

```
┌────────────────────────────────────────────────────────────┐
│ 本地（Windows，E:\WorkZone\Blog）                         │
│  Hexo 8.1.2 + Node 20  →  hexo generate → public/         │
│  scripts/csp.js       → public/_headers   （安全头）       │
│  scripts/redirects.js → public/_redirects（重定向）        │
└────────────────────────────────────────────────────────────┘
        │ git push（main 分支源码）
        ▼
┌────────────────────────────────────────────────────────────┐
│ GitHub：TwilightRainDev/TwilightRain（main = 源码）        │
│    └─ Cloudflare Pages 监听 main，自动拉取构建             │
│       （构建命令 npm run build，输出 public/）             │
│    └─ GitHub Actions IndexNow：提交线上 sitemap（非构建）  │
└────────────────────────────────────────────────────────────┘
        ▼
  https://twilightrain.com（Cloudflare 边缘分发）
```

**要点**：构建发生在 Cloudflare 云端（监听 main 分支），不是本地 `hexo deploy`。
本地 `public/` 只是预览/检查用。

## 技术栈

| 组件 | 版本 | 说明 |
|---|---|---|
| Hexo | 8.1.2 | 静态站点生成器（`package.json` 锁定） |
| Node.js | >= 20.19.0（`.node-version` = 20） | 低于此版本构建可能失败 |
| 主题 | ink（本地定制版） | fork 自 `hoytzhang/hexo-theme-ink`，深度定制，见 [THEME.md](THEME.md) |
| 托管 | Cloudflare Pages | 免费计划，绑 GitHub 仓库 main 分支 |

插件（`package.json` dependencies）：`hexo-generator-{archive,category,feed,index,searchdb,sitemap,tag}`（归档/分类/
RSS/首页/搜索/站点地图/标签）、`hexo-renderer-{ejs,marked}`（模板/内容渲染）、
`hexo-server`（本地预览）。

## 目录地图

```
blog/
├── _config.yml            # Hexo 主配置（站点信息/URL/生成器/部署）
├── package.json           # 依赖与 npm scripts（build/clean/server/test/indexnow）
├── CLAUDE.md              # Claude Code 会话提示（精简版，细节指向 docs/）
├── docs/                  # 维护手册（入库）
│   └── adr/               # 架构决策记录
├── scripts/               # Hexo 钩子与 marked 扩展（见下表）
├── source/
│   ├── _posts/            # 文章（Markdown，写作语法见 GRAMMAR.md）
│   ├── about/ settings/ search/ tags/ categories/ links/ timeline/ …
│   ├── downloads/ mc-skin/ midi/  # 静态附件：补丁包 zip / MC 皮肤 3D 查看器 / MIDI
│   ├── 404.md             # 自定义 404 页
│   └── img/               # icon.svg；ori/ 原图入库，360px/ 构建生成（gitignore）
├── themes/ink/            # 定制主题（见 THEME.md）
├── test/lib/              # 单测与源码契约测试（npm test）
├── public/                # 构建产物（gitignore）
└── .gitattributes         # 行尾 LF
```

**隐藏页**：`source/egg/` 是一个 Three.js 彩蛋页（`_config.yml` 的 `skip_render` 保留 `egg/**`，
不进 sitemap）。**全站无任何入口链接是刻意的**，不要当死代码删除。见 ADR-0014。

## scripts/ 模块一览

| 类别 | 文件 | 作用 |
|------|------|------|
| 安全/路由 | `csp.js`、`redirects.js` | `_headers`、`_redirects` |
| 构建辅助 | `commit-data.js`、`gen-thumbs.js` | 版本色块、360px 缩略图 |
| 独立 CI | `indexnow-submit.js` | 拉线上 sitemap 向 IndexNow 提交；不进 `npm run build`，见 ADR-0017 |
| 文章后处理 | `reading-time.js`、`heading-anchor.js`、`lazy-load.js`、`post-staleness.js`、`external-links.js`、`image-referrerpolicy.js` | 字数/锚点/懒加载/时效/外链安全 |
| marked 扩展 | `marked-{admonitions,grid,fold,mermaid,card,bilibili,timeline,tabs}.js` | 正文扩展语法（fold/card 仅规范名） |
| 系列 | `series.js` + `lib/series-*.js` | `::series` 与分组 |
| 纯函数库 | `lib/{char-stats,breadcrumbs,av-bv-convert,external-links,image-referrerpolicy,timeline-renderer,git-events,heading-anchor}.js` | 被钩子或单测 require |
| 时间线 helper | `timeline-page.js` | 数据源为构建期解析的 git 日志（`lib/git-events.js`），浅克隆或无 git 时页面为「暂无记录。」；渲染走 `lib/timeline-renderer.js` 的 page 变体 |

## themes/ink/source/js/ 客户端脚本

入口 `ink.js` 是 ESM 模块，由 `partial/head.ejs` 以 `type="module"` 加载，自身只写 import；
实现在 `ink/` 下的模块里，入口按下表的顺序 import。模块之间不共享作用域、
不互相调用，只通过 DOM 与自定义事件（如 `prefs.js` 派发的 `theme-change`）通信。

**新增模块追加到 `ink.js` 末尾的 import 列表**：入口 import 与 `ink/` 下的文件必须一一对应，
`test/lib/ink-modules.test.js` 会以最小 DOM 桩在严格模式下跑各模块顶层代码来守着这件事。

| 文件 | 职责 |
|------|------|
| `ink.js` | 入口：按序 import 下列模块 |
| `ink/image-color.js` | 正文图取色；首页无 cover 随机图与首页缩略图主色 |
| `ink/prefs.js` | 主题/字体/首页列数（`theme-preference` 等 localStorage）；同步 giscus 主题 |
| `ink/chrome.js` | 返回顶部、阅读进度条、文章 TOC（桌面双卡 + 移动端胶囊）、悬停资料卡 |
| `ink/friend-links.js` | 友链主站探测（favicon）、头像加载失败回退首字 |
| `ink/lightbox.js` | 文章页灯箱：展示图/原图切换（自研，ADR-0015） |
| `ink/cards-and-code.js` | GitHub 卡片动态 meta（`api.github.com`，唯一 connect-src 例外）；代码块复制 |
| `ink/widgets.js` | 归档展开、二级菜单、汉堡抽屉、Mermaid、代码超长折叠、B 站懒嵌入、tabs、md-text |
| `layout-pref.js` | 首页网格/列表布局（`ink-home-layout`），独立的 defer 脚本，不在入口的模块图里 |

文档别处提到「ink.js」而未指具体文件时，指这个入口及其加载的模块组。

## 构建产物生成链

`hexo generate` 时，除静态页面外还会生成：

| 产物 | 来源 | 用途 |
|---|---|---|
| `public/_headers` | `scripts/csp.js`（after_generate 写文件） | Cloudflare 读取并附加 CSP 等响应头 |
| `public/_redirects` | `scripts/redirects.js` | Cloudflare 读取并应用 301 重定向 |
| `public/search.xml` | `hexo-generator-searchdb` | 站内搜索数据源 |
| `public/atom.xml` | `hexo-generator-feed` | RSS 订阅（limit 20 篇） |
| `public/sitemap.xml` / `sitemap.txt` | `hexo-generator-sitemap` | SEO |
| `source/img/360px/**` | `gen-thumbs.js` | 展示图（gitignore，构建生成） |

## 站点配置速览（`_config.yml`）

- 站点：TwilightRain，zh-CN，Asia/Shanghai
- URL：`https://twilightrain.com`（旧域名 `twilightrain.pages.dev` 已整站 301），永久链接格式 `:year/:month/:day/:title/`
- 首页分页：10 篇/页
- `updated_option: date`（不写 `updated` 的文章，修改时间回落到 `date`；取 `mtime` 会随全新克隆漂移，见 [WORKFLOW.md](WORKFLOW.md#时间戳口径sitemap--feed--articlemodified_time)）
- 语法高亮：highlight.js（行号开）
- 字体/主题偏好、giscus 评论的开关在**主题配置** `themes/ink/_config.yml`，不在主配置

## 决策档案

重大取舍见 [adr/README.md](adr/README.md)。work_zone 侧的历史决策与债务台账见
`E:\WorkZone\Docs\projects\Blog\Blog-遗留项与技术债.md`。
