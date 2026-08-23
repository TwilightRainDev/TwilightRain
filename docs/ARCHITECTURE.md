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
├── package.json           # 依赖与 npm scripts（build/clean/deploy/server）
├── CLAUDE.md              # Claude Code 会话提示（精简版，细节指向 docs/）
├── docs/                  # ← 本维护手册（入库）
├── scripts/
│   ├── csp.js             # after_generate 钩子 → public/_headers
│   └── redirects.js       # after_generate 钩子 → public/_redirects
├── source/
│   ├── _posts/            # 文章（Markdown，见 WORKFLOW.md 写作规范）
│   ├── about/ settings/ search/ tags/ categories/  # 固定页面
│   ├── 404.md             # 自定义 404 页（layout: 404，返回真实 404 状态）
│   └── img/               # 站内图片（icon.svg、avatar.jpg、文章配图）
├── themes/ink/            # 定制主题（见 THEME.md）
├── public/                # 构建产物（gitignore，不入库）
├── db.json                # Hexo 内容缓存（gitignore，可安全删除）
├── .deploy_git/           # hexo-deployer 残留（gitignore）
├── .github/dependabot.yml # npm 依赖每日自动检查（PR 上限 20）
└── .gitattributes         # 行尾统一 LF（见 WORKFLOW.md）
```

## 构建产物生成链

`hexo generate` 时，除静态页面外还会生成：

| 产物 | 来源 | 用途 |
|---|---|---|
| `public/_headers` | `scripts/csp.js`（after_generate 写文件） | Cloudflare 读取并附加 CSP 等响应头 |
| `public/_redirects` | `scripts/redirects.js` | Cloudflare 读取并应用 301 重定向 |
| `public/search.xml` | `hexo-generator-searchdb` | 站内搜索数据源 |
| `public/atom.xml` | `hexo-generator-feed` | RSS 订阅（limit 20 篇） |
| `public/sitemap.xml` / `sitemap.txt` | `hexo-generator-sitemap` | SEO |

## 站点配置速览（`_config.yml`）

- 站点：TwilightRain，zh-CN，Asia/Shanghai
- URL：`https://twilightrain.com`（旧域名 `twilightrain.pages.dev` 已整站 301），永久链接格式 `:year/:month/:day/:title/`
- 首页分页：10 篇/页
- `updated_option: mtime`（文章更新时间取文件修改时间）
- 语法高亮：highlight.js（行号开）
- 字体/主题偏好、giscus 评论的开关在**主题配置** `themes/ink/_config.yml`，不在主配置
