# 规格：已发布文章陈旧断言审校

> 来源：`Docs/projects/Blog/Blog-遗留项与技术债.md` A2 + A3。
> 与本轮 A（IndexNow）并行。不改写已发布叙事，只追加注记。

## 1. 要解决什么

两篇已发布散文里，有对**当前仓库**已经失真的断言。改原文等于篡改当时记录；不标的话后人会当现状抄。

## 2. 范围

| 做 | 不做 |
|---|---|
| 扫 `source/_posts/` 全部 16 篇 | 改已发布句子、表格单元格、代码块原文 |
| 对「现在时的操作建议」或「点名仍存在的文件」失真处，紧挨其后追加 `:::admon[note 后续注记]` | 给历史路径（`A:\work_zone`）、当时验证数字（244 files）、其它项目过时版本加注 |
| 被注记的文章补/刷新 `updated:` | 改 URL / date / 文件名；为「叙事完整」重写段落 |
| | 把本站 git 历史前置写进通用迁移教程正文 |

## 3. 已确认要注记

扫过 16 篇后，只这两处符合「失真且会误导照做的人」：

1. **A2** `hexo-to-cloudflare-pages.md`
   - 配置表 Build command 写 `npm run build`（命令名仍对，但本站 `build` 已不是裸 `hexo generate`）。
   - 总结第 3 点教读者 `"build": "hexo generate"`，已失真。
   - 本站时间线还要求完整 git 历史。那是站点特定前置，注记里指向 `docs/WORKFLOW.md`，不写进教程步骤。
2. **A3** `blog-repo-cleanup.md`
   - 写扫描时看到 `scripts/img-thumbs.js`。该文件已删。语句在发布时为真，注记只说「该文件已删除」。

未注记（扫过、刻意放过）：

- `flash-cn-special-edition-fix.md`、`blog-repo-cleanup.md` 里的 `A:\work_zone`：当时事实。
- `blog-repo-cleanup.md` 的「244 个产物文件」：当时验证快照，随 HEAD 漂移（与时间线 C1 同类）。
- `with-her-eyes.md` / `cleanup-9gb-broken-components.md` 的 llm-vision 路径：接入当时的步骤。
- `blog-writing-features.md` 的「Butterfly 批 N」：验收样文内部小节名。

## 4. 注记形态

紧跟失真段落后：

```markdown
:::admon[note 后续注记]
……
:::
```

A2 两处各一条（表后一条、总结第 3 点后一条），不合并到文末以免读者在照做处看不到。

被改文章的 front matter 写 `updated: 2026-09-28 18:00:00`（已有则刷新），让文章页显示「更新于」。

## 5. 完成判据

1. 上述两文原文句子仍在；注记块可被 `:::admon` 渲染。
2. 其余 14 篇无本轮改动。
3. `npm test` 仍绿（不为本轮加产品测试；admon 语法已有单测）。
