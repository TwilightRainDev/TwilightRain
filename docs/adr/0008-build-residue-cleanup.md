# ADR-0008：构建期残留清理

## 状态

已实施

## 背景

三处构建期残留：

- `.deploy_git/`（18 MB，废弃 hexo deploy 方案后遗留的旧构建快照；`.gitignore` 已挡它入库但目录仍在盘上）
- `hexo-renderer-stylus` 依赖链（约 1.0 MB，全仓 `.styl` 文件数为 0，主题样式是入库的 `style.min.css`）
- 缩略图流程双跑：`package.json` 的 `build` 脚本跑一遍 `scripts/gen-thumbs.js`，
  `scripts/img-thumbs.js` 又注册了一个 `before_generate` 钩子跑一遍

## 关键事实：`before_generate` 钩子不能用于生成源目录文件

`gen-thumbs.js` 的输出目录是 `source/img/360px/`（不是 `public/`），需要 hexo 在源目录处理阶段把它拷进
`public/`。而 hexo 的执行顺序是**先处理源目录，再跑 `before_generate`**
（`node_modules/hexo/dist/hexo/index.js`：`source.process()` 在 `:299`，`before_generate` 在 `:425`）。

钩子此时才写进 `source/img/360px/` 的文件，当次构建的源目录扫描已经结束，hexo 看不到它们；db 里对应的
旧记录又因文件「不存在」被判为已删除，于是 hexo 反过来删掉 `public/img/360px/` 下的旧副本。全过程
**exit 0，无任何告警**。

在全新树（无 `db.json`、无 `public/`、无 `source/img/360px/`，即 Cloudflare Pages 每次构建的状态）下，
`gen-thumbs.js` 前置在 `hexo generate` 之前时 `public/img/360px` 得 47 个文件，仅靠钩子则为 0。即：
钩子并非「兜底」，它在一次性 `hexo generate` 下根本不生效。它唯一有效的场景是 `hexo server` 的热重载
（那条路径有 `this.source.watch()` 会捕获新文件并触发重新生成），而该场景现在由 `server` 脚本前置
`gen-thumbs` 在**启动时**覆盖。

**随之失去的能力**：`hexo server` **运行期**往 `source/img/ori/` 新增的图片，不再自动补出 360px 缩略图
（旧钩子靠 `source.watch()` 能在热重载路径上做到）。修法是重启 `npm run server`，或先跑
`npm run thumbs` 再刷新页面。

## 决策

- 删除 `.deploy_git/`（未入库，不可从 git 恢复，内容是旧构建快照）
- 从 `dependencies` 移除 `hexo-renderer-stylus`
- **删除 `scripts/img-thumbs.js`**：它做不了自己注释里声称的事（对一次性 `hexo generate` 无效），
  保留只会误导后人。缩略图入口收敛为 CLI 单点：`build` 与 `server` 脚本都在 hexo 之前跑 `gen-thumbs.js`

最终脚本形态：

```json
"thumbs": "node scripts/gen-thumbs.js",
"build": "node scripts/commit-data.js && node scripts/gen-thumbs.js && hexo generate",
"server": "node scripts/gen-thumbs.js && hexo server",
```

`npm run thumbs`（手动全量重建，配合 `--force`）保持不动。

## 后果

- 缩略图生成入口收敛为 `scripts/gen-thumbs.js` 单点，由 `build` / `server` 两个脚本在 hexo 之前调用
- 全新树构建恢复正确：`public/img/360px` 47 个文件，与 `source/img/ori` 的栅格文件数一致
- 主题样式仍是入库的 `style.min.css`，没有样式源文件，本次改动在 `hexo clean` 全量重建后逐字节未变。
  该文件的字节数与 md5 随后续样式改动变化，**不要把「当前值」补写进本 ADR**
  （追着更新必然再次过期）——本条的论点只是「移除 stylus 时样式产物逐字节未变」
- 锁文件 `package-lock.json` 的删改全部为 stylus 依赖链，无其他包版本漂移
- **不要再把 `before_generate` 钩子加回来**（用于生成源目录文件），理由见上节；`docs/THEME.md` 的缩略图一节已同步写明这条禁忌。
  该禁忌**仅针对「用钩子往 `source/` 写文件」**：用 `before_generate` 只做计算、把结果交给渲染期 helper 取用是可行的，
  仓库内已有合法用例：`scripts/timeline-page.js` 解析 git 日志后缓存进模块变量，不写 `source/` 下的文件。
  双链那处 `before_generate` 用例已随 [ADR-0016](0016-wikilinks-removed.md) 删除。
