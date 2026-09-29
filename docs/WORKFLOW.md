# 日常开发与发布流程

## 环境要求

- Node.js >= 20.19.0（本机标准环境见用户级文档，勿用 MSYS2 自带的 Node）
- 依赖已提交 `package-lock.json`；改依赖后同步更新锁文件

```bash
cd E:/WorkZone/Blog
npm install        # 首次或依赖变更后
```

## 本地命令

| 命令 | 作用 |
|---|---|
| `npm run server` | 本地预览 http://localhost:4000（热重载） |
| `npm run build` | 生成 `public/`（构建产物，不入库） |
| `npm run clean` | 清空 `public/` 与 `db.json` 缓存 |
| `npm run test` | 跑 `test/lib/*.test.js` 纯函数单测（面包屑/系列/marked 扩展等） |
| `npx hexo new "标题"` | 生成新文章草稿（scaffolds/） |

**预览时的已知差异**：`hexo server` 不输出安全头（CSP），因为 hexo-server 3.x 的
中间件注册时机早于 `scripts/` 加载（详见 [SECURITY.md → 陷阱 1](SECURITY.md#已知陷阱清单)）。
本地看到的效果与线上有差异是正常的，以线上为准。

## 写作规范与正文语法

见 [GRAMMAR.md](GRAMMAR.md)——front matter 模板、文件名与图片引用约定、
全部 `::: / ::` 扩展语法、公式写法与自动行为都以该文件为准。

## 提交与推送（重要）

仓库在 Windows 本机、**无 gh CLI、无 SSH 密钥**，推送凭据走
`E:\WorkZone\ApiKey` 目录下的 GitHub PAT（Basic 认证 extraheader 注入）。
具体命令形式以实际凭据注入方式为准（git 全局/仓库级 http.extraheader 或
`git -c http.extraheader=... push`）。

- **提交身份**：仓库已配好 `TwilightRain` / `122437146+TwilightRainDev@users.noreply.github.com`
  （noreply 邮箱，不暴露真实邮箱）。改任何仓库配置时**不要覆盖**这两项。
- **只推 main**：Cloudflare 监听 main 分支构建。`gh-pages` 分支与 `hexo deploy`
  流程已废弃，不要推、不要恢复。
- 提交信息建议带类型前缀（仓库历史惯例：`feat:` / `fix:` / `security:` / `chore:` / `docs:` /
  `remove:` / `refactor:`）。
- **不要实现拍板排除项**（PlantUML、code-group、热门页等）：见 [EXCLUDED.md](EXCLUDED.md)。
- 推送前先 `git status` 确认没有 `public/`、`db.json`、`node_modules`、
  `.deploy_git/` 混入（已在 `.gitignore` 中，正常情况下不会）。
- `docs/` 已入库（除 `docs/BlogPrivate.txt` 外），文档改动随代码一起提交。

## 发布与验证

### 构建前置：构建环境必须有完整 git 历史

`/timeline/` 的事件在构建期解析 `git log` 生成（机制见
[adr/0011-timeline-from-git.md](adr/0011-timeline-from-git.md)）。**浅克隆下 `git log` 只返回极短历史，
页面渲染「暂无记录。」且构建仍 exit 0**——helper 会 `warn`，但 Cloudflare 仍当成功。
同类「绿着出错」见 [adr/0008](adr/0008-build-residue-cleanup.md)。

- **规则**：构建命令（Cloudflare Pages 与本机通用）必须是幂等的：

  ```bash
  if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then git fetch --unshallow; fi && npm run build
  ```

  即：完整仓库上判据为 false、直接构建；浅克隆上才补历史，且 `--unshallow` 真失败时不会继续构建
  （不会带着空时间线上线）。
- **判据**：构建日志里出现 `timeline: 从 git 日志取到 N 条事件`。
- **反例**：
  - 写成裸的 `git fetch --unshallow && npm run build`——`--unshallow` 在完整仓库上以
    `fatal: --unshallow on a complete repository does not make sense` 退出 128，`&&` 于是吃掉后面的构建。
  - `/timeline/` 显示「暂无记录。」即为浅克隆退化，构建命令需修正。

### 时间戳口径：sitemap / feed / article:modified_time

`_config.yml` 的 `updated_option` 取 `'date'`，**不要改回 `'mtime'`**。`'mtime'` 取文件系统时间，
而 Cloudflare Pages 每次部署都是全新克隆，checkout 会把所有文件的时间刷成那一刻——于是所有文章
同时宣称「刚刚更新」。受影响的通道是 sitemap 的 `<lastmod>`、atom 的 `<updated>`、页面
`article:modified_time` 与 JSON-LD `dateModified`。**这三条都没有守卫**：文章页上看得见的
「更新于」由 [post-staleness.js](../scripts/post-staleness.js) 的 `updatedSet` 把着，
只认 front matter 显式写的 `updated`，所以页面看上去一切正常。

`'date'` 下，不写 `updated` 的文章回落到 front matter 的 `date`，与克隆时刻无关。
**前提是每篇文章都写显式 `date:`**：`date` 与 `updated` 都缺时 Hexo 取文件 birthtime
（`node_modules/hexo/dist/plugins/processor/post.js` 的 `data.date = stats.birthtime` 分支），
全新克隆下同样等于构建时刻。

判据——**文章面**应全是发布日期，不出现构建当天（列表页会出现，见下）：

```bash
# 文章 URL 的日期应各不相同、且不等于构建当天
grep -o '<lastmod>[^<]*' public/sitemap.xml | sort -u
# 去重后应约等于条目数；塌成 1 就是又回到「全站同一时刻」的老毛病
grep -o '<updated>[^<]*' public/atom.xml | sort -u | wc -l
# 应等于该篇的 date，而非构建当天
grep -o 'article:modified_time" content="[^"]*"' public/2026/07/22/bilicompact-source/index.html
```

**已知残留**（2026-09-29 线上实测：80 个 URL 里 60 个仍标构建当天，**16 篇文章全对**，两个来源）：

| 来源 | URL | 条数 |
| --- | --- | --- |
| hexo-generator-sitemap 模板写死的 `sNow`（插件设计，与本配置无关） | `/`、`/tags/*`、`/categories/*` | 56 |
| 页面源文件没写 `date:`，回落到 `stats.ctime`（`processor/asset.js` 的 `data.date = stats.ctime` 分支），全新克隆下即构建时刻 | `/settings/`、`/timeline/`、`/links/`、`/404.html` | 4 |

两类都只影响列表页与静态页的抓取调度，且**都不报错**——只会让这些 URL 每次部署对爬虫宣称「变了」。
第一类要改得把插件模板复制进仓库长期跟上游；第二类给那 4 个页面补 `date:` 即可。当前都不动。

1. 用上面的构建命令本地构建，确认无报错，并核对日志里的 `timeline:` 行。
2. `git push origin main`（凭据见上）。
3. Cloudflare Pages 自动构建（约 1–2 分钟）。可在
   Cloudflare Dashboard → Pages → TwilightRain → Deployments 查看状态。
4. 上线后验证清单：
   - [ ] 首页/文章可访问，新文章 URL 直达
   - [ ] 浏览器 Network 面板确认 `_headers` 生效（CSP 头存在）
   - [ ] 评论 iframe 宽度正常（非 300px 回退，说明 giscus 样式被 CSP 放行）
   - [ ] 不存在的路径返回 404 状态页

IndexNow 提交与构建无关：推 `main` 后 GitHub Actions 会等 Pages 再提交线上 sitemap。
本地要手动跑用 `npm run indexnow`（`--dry-run` 只打印）。机制见
[adr/0017-indexnow-submit.md](adr/0017-indexnow-submit.md)。不要把这一步加进 Cloudflare 构建命令。

## 行尾与编码

- 仓库已配置 `.gitattributes`：`* text=auto eol=lf`，**所有文件行尾 LF**。
- 本机该仓库 `core.autocrlf` 已设为 `false`，提交时不会隐式转换。
- 新增文件请保持 LF（编辑器保存时注意）；不要在 Windows 记事本/默认 PowerShell
  重定向中生成 CRLF 文件。
- 若历史 CRLF 文件被误改，执行 `git add --renormalize .` 后重新提交（一次性归一）。
