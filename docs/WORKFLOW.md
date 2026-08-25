# 日常开发与发布流程

## 环境要求

- Node.js >= 20.19.0（本机标准环境见用户级文档，勿用 MSYS2 自带的 Node）
- 依赖已提交 `package-lock.json`；改依赖后同步更新锁文件

```bash
cd A:/work_zone/Blog/blog
npm install        # 首次或依赖变更后
```

## 本地命令

| 命令 | 作用 |
|---|---|
| `npm run server` | 本地预览 http://localhost:4000（热重载） |
| `npm run build` | 生成 `public/`（构建产物，不入库） |
| `npm run clean` | 清空 `public/` 与 `db.json` 缓存 |
| `npm run test` | 跑 `test/lib/*.test.js` 纯函数单测（双链/面包屑/系列/marked 扩展等） |
| `npx hexo new "标题"` | 生成新文章草稿（scaffolds/） |

**预览时的已知差异**：`hexo server` 不输出安全头（CSP），因为 hexo-server 3.x 的
中间件注册时机早于 `scripts/` 加载（详见 [SECURITY.md → 开发模式限制](SECURITY.md#开发模式限制)）。
本地看到的效果与线上有差异是正常的，以线上为准。

## 写作规范

新文章：在 `source/_posts/` 建 `xxx.md`，front-matter 格式：

```yaml
---
title: 文章标题
date: 2026-08-08 14:00:00     # 决定 URL 与排序（:year/:month/:day/:title/）
excerpt: 一句话摘要           # 首页摘要：一律手写（见下方说明，不用 <!-- more -->）
tags:
  - 标签1
categories:
  - 分类1
comments: true                 # 默认开评论；不需要则 false
cover: /img/360px/covers/xxx.jpg  # 可选：封面（页面展示 360px；og:image 自动改写为 ori）
pinned: true                   # 可选：置顶到首页最前（不写则按日期排序）
updated: 2026-08-18 10:00:00   # 可选：更新日期（显式写才在文章页显示"更新于"；
                               #   Hexo 默认 updated 是文件 mtime，git checkout
                               #   会刷新，勿依赖隐式值，不写则不显示）
---
```

要点：

- **文件名一律英文 kebab-case**（小写+连字符，如 `time-management-master.md`）：
  文件名即 URL slug（permalink `:year/:month/:day/:title/`），中文名会产出
  百分号编码的长 URL。中文标题写进 front-matter `title` 即可；改文件名会变
  URL，需同步在 `scripts/redirects.js` 加 301。
- **excerpt 一律 front matter 手写**（`excerpt: 一句话摘要`）：不要用
  `<!-- more -->` 自然截断——截断点可能落在代码中间，导致摘要里出现
  HTML 实体乱码，且截断摘要只是开头段复制，不是真正的摘要。
- **date 即永久链接**：发文后改日期会改变 URL，造成死链。定稿后再定日期。
- **图片双轨**：原图放 `source/img/ori/`（入库）；展示图由
  `npm run thumbs` 或 `npm run build` 生成到 `source/img/360px/`（**gitignore，勿提交**）。
  正文/cover 引用 `/img/360px/...`；灯箱左上角「查看原图」打开对应 `/img/ori/...`。
  `icon.svg` 仍放 `source/img/icon.svg`，不进双轨。
- **文章内中英文空格**：写作时手动在中文与英文/数字间加空格（见 [THEME.md](THEME.md#中英文空格)）。
- `external_link` 已开启，外链自动新标签打开。
- 文章会自动进 feed（atom.xml，限 20 篇）、搜索（search.xml）与 sitemap，无需额外操作。
- 提交信息建议带类型前缀（仓库历史惯例：`feat:` / `fix:` / `security:` / `chore:` / `docs:`）。
- **不要实现拍板排除项**（PlantUML、code-group、热门页等）：见 [EXCLUDED.md](EXCLUDED.md)。

## 文章内扩展语法

- **提示块**（五类彩色块，语法与 markdown-it-container 一致）：

  ```markdown
  :::note
  内容，支持 **Markdown** 与代码块
  :::

  :::tip[自定义标题]
  内容
  :::
  ```

  类型：`note` / `tip` / `important` / `warning` / `caution`；`[标题]` 省略时
  显示类型名。样式与图标见 [THEME.md → 提示块](THEME.md#提示块admonitions)。
  未闭合的 `:::` 会原样输出为文本（写错时显眼暴露）。

- **Mermaid 图表**（围栏代码块渲染为图）：

  ````markdown
  ```mermaid
  graph TD
      A[开始] --> B{判断}
  ```
  ````

  仅含图表的页面按需加载 mermaid.min.js（约 1MB gzip），无图表页面零开销。
  图表跟随深浅主题。**限制**：列表/引用缩进内的 mermaid 围栏不支持（会被
  Hexo 代码块预处理接管走代码高亮），图表一律顶格写。

- **GitHub 仓库卡片**：

  ```markdown
  ::card{type="github" repo="TwilightRainDev/TwilightRain" desc="博客仓库"}
  ```

  渲染为仓库卡片（owner/repo + GitHub 图标 + 可选描述），点击跳转仓库页。
  repo 格式错误时输出可见的 `[WARN]` 提示。

- **通用链接卡片**：

  ```markdown
  ::card{type="link" url="https://www.anthropic.com/claude" title="Claude" desc="可选描述"}
  ```

  渲染为网页卡片（link 图标 + 标题 + 域名 + 可选描述），点击跳转（新标签）。
  纯静态无 API；title 省略时显示域名；url 仅支持 http/https（其他协议拒绝）。

- **标签页 tabs**（块级容器，与提示块同体系）：

  ````markdown
  :::tabs
  --- 方案A
  内容 A（支持 **Markdown** 与代码块）
  --- 方案B
  内容 B
  :::
  ````

  渲染为标签页，默认显示第一个，点击按钮切换。`--- 标题` 是子页分隔符
  （顶格写）；无分隔符的块输出可见 `[WARN]`。

- **文内照片墙**：

  ````markdown
  :::grid[2]
  ![图一](/img/360px/with-her-eyes-1.jpg)
  ![图二](/img/360px/with-her-eyes-2.jpg)
  :::
  ````

  列数可选（默认 2），渲染为 CSS Grid；点击放大走 fancybox。

- **剧透 / 折叠**：

  ````markdown
  :::fold[text 悬停或点击查看]
  短剧透内容
  :::

  :::fold[details 展开说明]
  块级折叠，支持完整 Markdown。
  :::
  ````

  HTML 类名仍为 `.md-text` / `.md-details`。

- **文内时间线**（语法与站点页 `/timeline/` 不同；DOM 由同一渲染器生成）：

  ````markdown
  :::timeline[版本史]
  --- v1
  初版说明
  --- v2
  增量说明
  :::
  ````

- **B 站视频懒嵌入**：

  ```markdown
  ::bilibili{id="BV1xx411c7mD"}
  ::bilibili{id="av170001"}
  ::bilibili{id="https://www.bilibili.com/video/BV1xx411c7mD/" page="1"}
  ```

  `av` 号与纯数字 aid 会经 `scripts/lib/av-bv-convert.js` 规范为 BV 后再嵌入；
  滚动到可视区或点击占位卡片后加载 `player.bilibili.com` 播放器（sandbox iframe）。

- **系列文**：

  ```yaml
  # front matter
  series: 我的连载名
  series_index: 1   # 可选，控制目录顺序
  ```

  ```markdown
  ::series
  ::series{name="我的连载名"}
  ```

  同 `series:` 的文章会自动进入目录；当前篇高亮。样文见 `blog-writing-features.md`（单篇即可展示目录）。

- **分享按钮**：文章页版权声明下方自动出现微博 / QQ / X 三平台分享链接，
  无需手动配置。

- **双链（Obsidian 风格）**：正文写 `[[文章标题]]`，构建期转为站内链接；
  文章底显示「链接到 / 反向链接」。别名与锚点：`[[标题|别名]]`、`[[标题#章节]]`。
  按 **title** 匹配（次选 slug），**标题须唯一**；围栏/行内代码内的 `[[…]]` 不处理。
  未匹配的双链原样保留，便于发现写错。

- **读者偏好（仅前端）**：`/settings/` 可切换主题、字体、首页布局（网格/列表）、
  首页列数；存 `localStorage`，不上传服务器（`layout-pref.js` + `ink.js`）。

- **构建期安全**：正文外链自动补 `rel="noopener noreferrer"`；`mailto:` HTML 实体编码；
  外链 `img` 加 `referrerpolicy="no-referrer"`（`scripts/external-links.js`、
  `scripts/image-referrerpolicy.js`）。

## 提交与推送（重要）

仓库在 Windows 本机、**无 gh CLI、无 SSH 密钥**，推送凭据走
`A:\work_zone\ApiKey` 目录下的 GitHub PAT（Basic 认证 extraheader 注入）。
具体命令形式以当时凭据注入方式为准（git 全局/仓库级 http.extraheader 或
`git -c http.extraheader=... push`）。

- **提交身份**：仓库已配好 `TwilightRain` / `122437146+TwilightRainDev@users.noreply.github.com`
  （noreply 邮箱，不暴露真实邮箱）。改任何仓库配置时**不要覆盖**这两项。
- **只推 main**：Cloudflare 监听 main 分支构建。`gh-pages` 分支与 `hexo deploy`
  流程已废弃，不要推、不要恢复。
- 推送前先 `git status` 确认没有 `public/`、`db.json`、`node_modules`、
  `.deploy_git/` 混入（已在 `.gitignore` 中，正常情况下不会）。
- `docs/` 已入库（除 `docs/BlogPrivate.txt` 外），文档改动随代码一起提交。

## 发布与验证

1. `npm run build` 本地构建，确认无报错。
2. `git push origin main`（凭据见上）。
3. Cloudflare Pages 自动构建（约 1–2 分钟）。可在
   Cloudflare Dashboard → Pages → TwilightRain → Deployments 查看状态。
4. 上线后验证清单：
   - [ ] 首页/文章可访问，新文章 URL 直达
   - [ ] 浏览器 Network 面板确认 `_headers` 生效（CSP 头存在）
   - [ ] 评论 iframe 宽度正常（非 300px 回退，说明 giscus 样式被 CSP 放行）
   - [ ] 不存在的路径返回 404 状态页

## 行尾与编码

- 仓库已配置 `.gitattributes`：`* text=auto eol=lf`，**所有文件行尾 LF**。
- 本机该仓库 `core.autocrlf` 已设为 `false`，提交时不会隐式转换。
- 新增文件请保持 LF（编辑器保存时注意）；不要在 Windows 记事本/默认 PowerShell
  重定向中生成 CRLF 文件。
- 若历史 CRLF 文件被误改，执行 `git add --renormalize .` 后重新提交（一次性归一）。
