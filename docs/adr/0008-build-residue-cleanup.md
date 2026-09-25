# ADR-0008：构建期残留清理

## 状态

已实施（2026-09-25）

## 背景

三处构建期残留：

- `.deploy_git/`（18 MB，2026-08-08 废弃 hexo deploy 方案后遗留，`.gitignore` 已挡它入库但目录仍在盘上）
- `hexo-renderer-stylus` 依赖链（约 1.0 MB，全仓 `.styl` 文件数为 0，主题样式是入库的 `style.min.css`）
- 缩略图流程双跑：`package.json` 的 `build` 脚本跑一遍 `scripts/gen-thumbs.js`，
  `scripts/img-thumbs.js` 又注册了一个 `before_generate` 钩子跑一遍

第三处最初被当成纯冗余（认为第二遍靠 mtime 全部跳过，去掉即可）。实测后结论相反，详见下节。

## 关键事实：`before_generate` 钩子不能用于生成源目录文件

`gen-thumbs.js` 的输出目录是 `source/img/360px/`（不是 `public/`），需要 hexo 在源目录处理阶段把它拷进
`public/`。而 hexo 的执行顺序是**先处理源目录，再跑 `before_generate`**——见
`node_modules/hexo/dist/hexo/index.js`：

```js
load(callback) {
    return load_database(this).then(() => {
        this.log.info('Start processing');
        return Promise.all([
            this.source.process(),          // 第 299 行：源目录在此定型
            this.theme.process()
        ]);
    }).then(() => {
        return this._generate({ cache: false });   // 第 304 行
    })
}

_generate(options = {}) {
    // 第 425 行：before_generate 在此才执行
    return this.execFilter('before_generate', null, { context: this })
```

`source.process()`（第 299 行）**早于** `before_generate`（第 425 行）。钩子此时才写进 `source/img/360px/`
的文件，当次构建的源目录扫描已经结束，hexo 看不到它们；db 里对应的旧记录又因文件「不存在」被判为已删除，
于是 hexo 反过来删掉 `public/img/360px/` 下的旧副本。全过程 **exit 0，无任何告警**。

对照实验（全新树：无 `db.json`、无 `public/`、无 `source/img/360px/`，即 Cloudflare Pages 每次构建的状态）：

| 流程 | `source/img/360px` | `public/img/360px` | 退出码 |
|------|--------------------|--------------------|--------|
| `gen-thumbs.js` 在 `hexo generate` 之前（CLI 前置） | 47 | **47** | 0 |
| 仅靠 `before_generate` 钩子 | 47 | **0** | 0 |

即：钩子并非「兜底」，它在一次性 `hexo generate` 下根本不生效。它唯一有效的场景是 `hexo server` 的热重载
（那条路径有 `this.source.watch()` 会捕获新文件并触发重新生成，`index.js` 第 330 行），而该场景现在由
`server` 脚本前置 `gen-thumbs` 覆盖。

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
- 主题样式仍是入库的 `style.min.css`，没有样式源文件，本次改动不触及样式；
  经 `hexo clean` 全量重建后该文件 85281 字节、md5 `e6a176632f32fa0a6684821aff5b1298`，与改动前逐字节一致
- 锁文件 `package-lock.json` 净删 154 行、新增 0 行，全部为 stylus 依赖链，无其他包版本漂移
- **不要再把 `before_generate` 钩子加回来**，理由见上节；`docs/THEME.md` 的缩略图一节已同步写明这条禁忌
