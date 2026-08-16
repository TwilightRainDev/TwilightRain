# 日常开发与发布流程

## 环境要求

- Node.js >= 20.19.0（本机标准环境见用户级文档，勿用 MSYS2 自带的 Node）
- 依赖已提交 `package-lock.json`；改依赖后同步更新锁文件

```bash
cd H:/work_zone/Blog/blog
npm install        # 首次或依赖变更后
```

## 本地命令

| 命令 | 作用 |
|---|---|
| `npm run server` | 本地预览 http://localhost:4000（热重载） |
| `npm run build` | 生成 `public/`（构建产物，不入库） |
| `npm run clean` | 清空 `public/` 与 `db.json` 缓存 |
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
cover: /img/xxx.jpg            # 可选：封面图（og:image 也用它）
---
```

要点：

- **文件名一律英文 kebab-case**（小写+连字符，如 `time-management-master.md`）：
  文件名即 URL slug（permalink `:year/:month/:day/:title/`），中文名会产出
  百分号编码的长 URL。中文标题写进 front-matter `title` 即可；改文件名会变
  URL，需同步在 `scripts/redirects.js` 加 301（2026-08-16 统一改名先例）。
- **excerpt 一律 front matter 手写**（`excerpt: 一句话摘要`）：不要用
  `<!-- more -->` 自然截断——截断点可能落在代码中间（曾导致摘要里出现
  HTML 实体乱码），且截断摘要只是开头段复制，不是真正的摘要。
- **date 即永久链接**：发文后改日期会改变 URL，造成死链。定稿后再定日期。
- 图片放 `source/img/`，正文用 `/img/xxx.jpg` 绝对路径引用。
- `external_link` 已开启，外链自动新标签打开。
- 文章会自动进 feed（atom.xml，限 20 篇）、搜索（search.xml）与 sitemap，无需额外操作。
- 提交信息建议带类型前缀（仓库历史惯例：`feat:` / `fix:` / `security:` / `chore:` / `docs:`）。

## 文章内扩展语法（2026-08-16 起，Twilight 迁移）

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

## 提交与推送（重要）

仓库在 Windows 本机、**无 gh CLI、无 SSH 密钥**，推送凭据走
`H:\work_zone\ApiKey` 目录下的 GitHub PAT（Basic 认证 extraheader 注入）。
具体命令形式以当时凭据注入方式为准（git 全局/仓库级 http.extraheader 或
`git -c http.extraheader=... push`）。

- **提交身份**：仓库已配好 `TwilightRain` / `122437146+TwilightRainDev@users.noreply.github.com`
  （noreply 邮箱，不暴露真实邮箱）。改任何仓库配置时**不要覆盖**这两项。
- **只推 main**：Cloudflare 监听 main 分支构建。`gh-pages` 分支与 `hexo deploy`
  流程是历史残留（依赖已移除），不要推、不要恢复。
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
