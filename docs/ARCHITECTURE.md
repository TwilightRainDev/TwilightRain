# 架构总览

## 系统组成

```
┌────────────────────────────────────────────────────────────┐
│ 本地（Windows，A:\work_zone\Blog\blog）                    │
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
└────────────────────────────────────────────────────────────┘
        ▼
  https://twilightrain.com（Cloudflare 边缘分发；pages.dev 已 301 到此）
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
RSS/首页/搜索/站点地图/标签）、`hexo-renderer-{ejs,marked,stylus}`（模板/内容/样式渲染）、
`hexo-server`（本地预览）。

## 目录地图

```
blog/
├── _config.yml            # Hexo 主配置（站点信息/URL/生成器/部署）
├── package.json           # 依赖与 npm scripts（build/clean/deploy/server/test）
├── CLAUDE.md              # Claude Code 会话提示（精简版，细节指向 docs/）
├── docs/                  # 维护手册（入库）
│   └── adr/               # 架构决策记录
├── scripts/               # Hexo 钩子与 marked 扩展（见下表）
├── source/
│   ├── _posts/            # 文章（Markdown，写作语法见 GRAMMAR.md）
│   ├── about/ settings/ search/ tags/ categories/ links/ projects/ …
│   ├── 404.md             # 自定义 404 页
│   └── img/               # icon.svg；ori/ 原图入库，360px/ 构建生成（gitignore）
├── themes/ink/            # 定制主题（见 THEME.md）
├── test/lib/              # 纯函数单测（npm test）
├── public/                # 构建产物（gitignore）
└── .gitattributes         # 行尾 LF
```

## scripts/ 模块一览

| 类别 | 文件 | 作用 |
|------|------|------|
| 安全/路由 | `csp.js`、`redirects.js` | `_headers`、`_redirects` |
| 构建辅助 | `commit-data.js`、`gen-thumbs.js`、`img-thumbs.js` | 版本色块、360px 缩略图 |
| 文章后处理 | `reading-time.js`、`wikilinks.js`、`heading-anchor.js`、`lazy-load.js`、`post-staleness.js`、`external-links.js`、`image-referrerpolicy.js` | 字数/双链/锚点/懒加载/时效/外链安全 |
| marked 扩展 | `marked-{admonitions,grid,fold,mermaid,card,bilibili,timeline,tabs}.js` | 正文扩展语法（fold/card 仅规范名） |
| 系列 | `series.js` + `lib/series-*.js` | `::series` 与分组 |
| 纯函数库 | `lib/{char-stats,breadcrumbs,wikilinks,av-bv-convert,external-links,image-referrerpolicy,timeline-renderer,heading-anchor}.js` | 被钩子或单测 require |
| 展柜 helper | `timeline-page.js` | `/timeline/` 调用 `renderPageTimeline` |

## themes/ink/source/js/ink.js 模块

按文件内分段注释划分（改交互时先定位段落）：

| 模块 | 职责 |
|------|------|
| 封面池 / 取色 | 首页无 cover 随机图；文章头图主色 |
| 偏好设置 | 主题/字体/首页列数（`theme-preference` 等 localStorage） |
| `layout-pref.js` | 首页网格/列表布局（`ink-home-layout`），独立 defer 脚本 |
| 返回顶部 / 阅读进度 | 固定 FAB、顶栏进度条 |
| 文章 TOC | 桌面双卡 + 移动端胶囊（滚动中 `.is-scrolling` 临时隐藏） |
| 友链探测 | 主站 favicon 探测后切回 url |
| 灯箱 fancybox | 文章图放大、查看原图 |
| GitHub 卡片 | `api.github.com` 动态 meta（唯一 connect-src 例外） |
| 代码复制 / 超长折叠 | `.copy-btn`、40 行阈值折叠 |
| 归档展开 | `#archives-toggle` |
| 二级菜单 / 汉堡抽屉 | 触摸展开；`<768px` 抽屉导航 |
| Mermaid | 按需加载 `mermaid.min.js`，`fitMermaid` 超宽横滚 |
| B 站懒嵌入 | IntersectionObserver + sandbox iframe |
| tabs / md-text | 标签页切换、剧透块点击揭示 |

## 构建产物生成链

`hexo generate` 时，除静态页面外还会生成：

| 产物 | 来源 | 用途 |
|---|---|---|
| `public/_headers` | `scripts/csp.js`（after_generate 写文件） | Cloudflare 读取并附加 CSP 等响应头 |
| `public/_redirects` | `scripts/redirects.js` | Cloudflare 读取并应用 301 重定向 |
| `public/search.xml` | `hexo-generator-searchdb` | 站内搜索数据源 |
| `public/atom.xml` | `hexo-generator-feed` | RSS 订阅（limit 20 篇） |
| `public/sitemap.xml` / `sitemap.txt` | `hexo-generator-sitemap` | SEO |
| `source/img/360px/**` | `gen-thumbs.js` / `img-thumbs.js` | 展示图（gitignore，构建生成） |

## 站点配置速览（`_config.yml`）

- 站点：TwilightRain，zh-CN，Asia/Shanghai
- URL：`https://twilightrain.com`（旧域名 `twilightrain.pages.dev` 已整站 301），永久链接格式 `:year/:month/:day/:title/`
- 首页分页：10 篇/页
- `updated_option: mtime`（文章更新时间取文件修改时间）
- 语法高亮：highlight.js（行号开）
- 字体/主题偏好、giscus 评论的开关在**主题配置** `themes/ink/_config.yml`，不在主配置

## 决策档案

重大取舍见 [adr/README.md](adr/README.md)。work_zone 侧历史决策与债务台账见 `A:\work_zone\Docs\Blog-文档索引.md`。
