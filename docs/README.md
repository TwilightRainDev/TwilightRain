# 博客维护手册（docs）

TwilightRain 博客源码仓库的维护文档。

## 三个必须记住的事实

1. **站点**：https://twilightrain.com —— 由 Cloudflare Pages 托管（`twilightrain.pages.dev` 已整站 301 到此，机制见 [SECURITY.md → 重定向与 404](SECURITY.md#重定向与-404)）。
2. **源码**：`A:\work_zone\Blog\blog`（本地）↔ `https://github.com/TwilightRainDev/TwilightRain`（远程，`main` 分支装源码）。
3. **Cloudflare 构建只认 `main` 分支的源码**：推送必须推 `main`。不要推 `gh-pages`（`_config.yml` 的 `deploy` 段已废弃，不要使用）。

## 文档地图

| 文件 | 内容 | 何时看 |
|---|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统组成、构建链路、目录地图、关键文件 | 想理解整个博客怎么运转时 |
| [WORKFLOW.md](WORKFLOW.md) | 本地开发、写作发布、提交推送全流程 | 每次写文章/改代码时 |
| [SECURITY.md](SECURITY.md) | CSP 安全头、`_headers`/`_redirects` 机制、已知陷阱 | 改安全策略、排查线上问题时 |
| [CONSOLE-TRIAGE.md](CONSOLE-TRIAGE.md) | 浏览器 Console 现象分诊、验收清单 | 真机验收、排查 giscus/GitHub/B 站报错时 |
| [THEME.md](THEME.md) | ink 主题定制点：布局、偏好、字体、评论 | 改页面样式/结构时 |
| [adr/](adr/README.md) | 架构决策记录（删留、CSP、语法收敛等） | 追问「为什么这样设计」时 |

## 快速上手（新维护者）

```bash
cd A:/work_zone/Blog/blog
npm run server        # 本地预览 → http://localhost:4000
npm run build         # 生成 public/（构建产物）
```

- 写新文章：`source/_posts/` 下建 `标题.md`，格式见 [WORKFLOW.md → 写作规范](WORKFLOW.md#写作规范)。
- 发布：提交推送到 GitHub `main` 分支，Cloudflare Pages 自动构建部署（约 1–2 分钟），无需手动操作。
- 预览时安全头不生效是**已知限制**（见 [SECURITY.md → 开发模式限制](SECURITY.md#开发模式限制)），不要试图修。

## 文档维护约定

- 新发现的坑、改过的配置，**必须同步更新本目录**，特别是 [SECURITY.md](SECURITY.md#已知陷阱清单) 的陷阱清单与 [CONSOLE-TRIAGE.md](CONSOLE-TRIAGE.md) 的分诊表。
- 文档行尾 LF；本仓库已由 `.gitattributes` 统一（见 [WORKFLOW.md → 行尾与编码](WORKFLOW.md#行尾与编码)）。
