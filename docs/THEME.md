# 主题定制（themes/ink）

主题 fork 自 `hoytzhang/hexo-theme-ink`，已深度定制并整体入库（`themes/ink/` 内全部文件受 git 跟踪，无独立 git 仓库），修改直接进版本控制。

## 布局文件职责

```
themes/ink/layout/
├── layout.ejs        # 总骨架（head/header/footer 装配）
├── index.ejs         # 首页文章流（无 cover 文章从本地封面池随机取图，见下文）
├── post.ejs          # 文章页（头图横幅、TOC、阅读进度条、返回顶部、评论挂载点）
├── page.ejs          # 普通页面（无显式 layout 的页面，如 /about/）
├── archive.ejs       # 归档页（年份分组、月份折叠、全部展开/收缩）
├── partial/
│   ├── head.ejs      # <head>：SEO/OG/RSS 元信息、ink.js 引入、样式
│   ├── header.ejs    # 导航菜单（来源：主题 _config.yml menu）
│   ├── footer.ejs    # 页脚
│   ├── comments.ejs  # giscus 评论挂载
│   └── banner.ejs    # 头图横幅（文章页与普通页面共用）
├── 404.ejs           # 404 页（source/404.md 指定 layout: 404）
├── settings.ejs      # 设置页（source/settings/index.md → 主题/字体偏好）
├── search.ejs        # 搜索页（source/search/index.md → search.js 前端检索）
├── categories.ejs / tags.ejs / gallery.ejs
```

## 配置（themes/ink/_config.yml）

- `favicon`：`/img/icon.svg`
- `menu`：文章 / 关于 / GitHub
- `notice`：首页公告条文本，留空 `''` 则不显示
- `giscus`：评论系统开关与仓库 ID（`enabled`、`repo_id`、`category_id`）。
  若 GitHub Discussions 配置变动（重建仓库、改 Discussions 分类），
  需在 https://giscus.app/ 重新生成 ID 并同步更新，否则评论加载失败。

## 文章页功能（post.ejs）

- **头图横幅**（`partial/banner.ejs`，文章页与普通页面共用）：front matter 设
  `cover` 时用指定图，未设 `cover` 时输出 `data-random-cover` 由 ink.js 从封面池
  随机取图（与首页缩略图同一机制）。注意横幅在 `<article>` 之外，不参与 TOC
  与灯箱绑定。
- **图片灯箱**：文章内图片点击放大（fancybox 3）。资源由 post.ejs 按页引入
  （cdnjs + integrity，与 gallery.ejs 同款，CSP script-src/style-src 已含
  cdnjs.cloudflare.com，改安全头前读 [SECURITY.md](SECURITY.md)）。
  `ink.js` 在运行时给 article 内 img 加 `data-fancybox` 属性，fancybox 事件委托自动绑定。
- **上一篇/下一篇**：`page.prev` / `page.next` 文本卡片导航，单边存在时占满整行。
- **版权声明**：文章底部 CC BY-NC-SA 4.0 链接，零依赖。
- **代码块复制**：复制按钮取 `.code pre` 文本（Hexo 8 highlight 输出结构为
  `figure.highlight > table > td.code > pre > span.line`，行分隔为 `<br>`，
  提取时手工拼接换行，勿改回 `code.textContent`——会拼成一行）。

## 归档页（archive.ejs）

- 主配置 `_config.yml` 中 `archive_generator.per_page: 0` 关闭归档分页，
  单页列出全部文章（与页面"共 N 篇"统计一致）。
- 交互：`ink.js` 的 `#archives-toggle` 按钮切换全部月份折叠状态。

## 样式与脚本

- 全部样式在 `source/css/style.min.css` 单文件中（原主题特色：可直接套用
  bearblog 系样式代码）。改动时保持单文件约定，避免新增散装 css 引入点。
- `source/js/ink.js`：**defer 加载**，主题偏好（theme-preference / font-preference）
  在 defer 阶段立即应用，兼容旧值（light/dark）。设置页选择会写入 localStorage。
  模块清单：图片说明、随机封面、主题/字体偏好、返回顶部、阅读进度条、TOC、
  悬停资料卡、图片灯箱绑定、代码块复制、归档折叠。
- `source/js/search.js`：前端搜索（检索 searchdb 生成的 search.xml）。
  ⚠️ 渲染结果必须转义，防 DOM XSS（见 [SECURITY.md](SECURITY.md#已知陷阱清单)）。

## 字体自托管

- 位置：`themes/ink/source/fonts/`（LXGWWenKai.woff2、HYWenHei85W.woff2）。
- 均为子集化 woff2（GB2312 约 7200 字符），CSP `font-src 'self'` 配合收紧。
- 新增字体：子集化后放入该目录，更新 `style.min.css` 的 @font-face，不要引外链
  （会被 CSP 拦，见 [SECURITY.md](SECURITY.md#已知陷阱清单) 第 3 条）。

## 封面图池（首页缩略图）

- 位置：`source/img/covers/`（cover-01.jpg … cover-26.jpg，800×800 正方形 JPEG，居中裁切自本地壁纸库）。
- 机制：`index.ejs` 对未设 `cover` 的文章输出 `<img data-random-cover>`（不带 src），
  由 `ink.js` 在 DOMContentLoaded 时从前端封面池随机赋 src——**每次页面加载都重新随机**
  （2026-08-08 起替代外部 picsum 图源，修复过"构建期随机导致刷新不变"的问题）。
- **加新封面图**：裁切成 800×800 正方形放入 `source/img/covers/`，文件名按
  `cover-NN.jpg` 连续编号，并同步更新 `ink.js` 中 `coverPool` 的循环上界。

## 修改主题的流程

1. 改布局/样式/脚本（保持 LF 行尾）。
2. `npm run build` 构建。
3. `hexo server` 本地预览（注意：无安全头是预期行为）。
4. 确认线上生效：推送 main 后检查页面源码与 Network 面板。
