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

## 写作规范与正文语法

见 [GRAMMAR.md](GRAMMAR.md)——front matter 模板、文件名与图片引用约定、
全部 `::: / :: / [[]]` 扩展语法、公式写法与自动行为都以该文件为准。

## 提交与推送（重要）

仓库在 Windows 本机、**无 gh CLI、无 SSH 密钥**，推送凭据走
`A:\work_zone\ApiKey` 目录下的 GitHub PAT（Basic 认证 extraheader 注入）。
具体命令形式以当时凭据注入方式为准（git 全局/仓库级 http.extraheader 或
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
