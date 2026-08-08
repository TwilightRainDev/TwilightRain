# 主题定制（themes/ink）

主题 fork 自 `hoytzhang/hexo-theme-ink`，已深度定制并整体入库（`themes/ink/` 内全部文件受 git 跟踪，无独立 git 仓库），修改直接进版本控制。

## 布局文件职责

```
themes/ink/layout/
├── layout.ejs        # 总骨架（head/header/footer 装配）
├── index.ejs         # 首页文章流（无 cover 文章从本地封面池随机取图，见下文）
├── post.ejs          # 文章页（TOC、阅读进度条、返回顶部、评论挂载点）
├── partial/
│   ├── head.ejs      # <head>：SEO/OG/RSS 元信息、ink.js 引入、样式
│   ├── header.ejs    # 导航菜单（来源：主题 _config.yml menu）
│   ├── footer.ejs    # 页脚
│   └── comments.ejs  # giscus 评论挂载
├── 404.ejs           # 404 页（source/404.md 指定 layout: 404）
├── settings.ejs      # 设置页（source/settings/index.md → 主题/字体偏好）
├── search.ejs        # 搜索页（source/search/index.md → search.js 前端检索）
├── categories.ejs / tags.ejs / gallery.ejs
```

## 配置（themes/ink/_config.yml）

- `favicon`：`/img/icon.svg`
- `menu`：文章 / 关于 / GitHub
- `giscus`：评论系统开关与仓库 ID（`enabled`、`repo_id`、`category_id`）。
  若 GitHub Discussions 配置变动（重建仓库、改 Discussions 分类），
  需在 https://giscus.app/ 重新生成 ID 并同步更新，否则评论加载失败。

## 样式与脚本

- 全部样式在 `source/css/style.min.css` 单文件中（原主题特色：可直接套用
  bearblog 系样式代码）。改动时保持单文件约定，避免新增散装 css 引入点。
- `source/js/ink.js`：**defer 加载**，主题偏好（theme-preference / font-preference）
  在 defer 阶段立即应用，兼容旧值（light/dark）。设置页选择会写入 localStorage。
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
