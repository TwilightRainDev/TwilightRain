# 主题定制（themes/ink）

主题 fork 自 `hoytzhang/hexo-theme-ink`，已深度定制并整体入库（`themes/ink/` 内全部文件受 git 跟踪，无独立 git 仓库），修改直接进版本控制。

## 布局文件职责

```
themes/ink/layout/
├── layout.ejs        # 总骨架（head/header/footer 装配）
├── index.ejs         # 首页文章流（无 cover 文章从本地封面池随机取图，见下文）
├── post.ejs          # 文章页（头图横幅、TOC、阅读进度条、返回顶部、评论挂载点）
├── page.ejs          # 普通页面（无显式 layout 的页面，如 /about/，含评论挂载）
├── links.ejs         # 友链页（source/links/index.md 的 front matter links 数据驱动，含评论挂载）
├── archive.ejs       # 归档页（年份分组、月份折叠、全部展开/收缩）
├── partial/
│   ├── head.ejs      # <head>：SEO/OG/RSS 元信息、ink.js 引入、样式
│   ├── header.ejs    # 导航菜单（遍历主题 _config.yml menu 渲染，外链自动新标签打开）
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
- `menu`：顶部导航（header.ejs 遍历渲染；http(s) 开头的值视为外链，
  自动加 `target="_blank" rel="noopener"`；加导航项只改这里）
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
  `figure.highlight > table > td.code > pre > code.hljs > span`，行分隔为
  `<br>`）。提取用克隆后递归替换 `<br>` 为换行文本节点再取 textContent，
  `hljs: true` 后 `<br>` 嵌套在 `<code>` 内部，直接 textContent 会拼成一行。

## 代码高亮（highlight.js）

- 构建时渲染（`syntax_highlighter: highlight.js`，`hljs: true`），无客户端 JS、
  无第三方 CDN——配色直接内联在 style.min.css（自托管，单文件纪律）。
- `auto_detect: true`：未标注语言的代码块由 highlight.js 构建时自动检测
  （历史上 74% 的代码块无标注）。**已知误检**：纯文本/进度条类内容可能被
  误识别为某种语言（如 erlang-repl），显式标注语言（```js 等）可覆盖。
- **深浅反色适配**：代码块背景是主题反色（浅色页面深底、深色页面浅底），
  所以配色反向匹配——默认（浅色页面）用 github-dark 配色，`[data-theme="dark"]`
  时用 github 浅色配色（ink.js 深色时始终设置 html[data-theme=dark]，
  无需 media query 分支）。`.hljs` 背景透明，由 pre 背景控制。
- 行号 gutter 颜色继承 `.highlight` 的 color（--code-color 反色），无需单独样式。
- **`pre code.hljs` 必须 `display: block`**：hljs 主题自带该规则，若去掉，
  `<code>` 是 inline 元素，代码行不撑满宽度（行号列与代码之间大片空白）。
  去 padding 规则时勿连 display 一起删。
- **行号与代码必须同字号同行距**：Hexo 输出的 `<td class="code">` 带 `.code` 类，
  落入 `code, .highlight, .code { font-size: 0.9em }` 字号链（td 0.9em -> pre 0.8em ->
  code 0.9em），代码文字约 10.5px；而 `td.gutter` 无 `.code` 类，行号约 13px。
  行多时 gutter 内容高于 code 内容，表格行高被 gutter 撑开，td 默认
  `vertical-align: middle` 会把 code 整体下推半个行差——1663 行的代码块会下推
  3.2k px，代码块前约 150 行只剩空背景（2026-08-14 定位的线上"前 144 行空白"事故）。
  style.min.css 中 `figure.highlight td { font-size: inherit }` 与
  `figure.highlight td.code code { font-size: inherit }` 统一两格字号，不可删。
- **代码不换行 + 行号对齐**：`figure.highlight table` 设 `table-layout: fixed;
  width: 100%`（防超长行把表格撑出 figure，同时固定 gutter 宽 43px），
  `td.code code` 设 `white-space: pre`（超长行横向滚动，`pre code.hljs` 已有
  `overflow-x: auto`）——折行会产生额外行盒，行号与代码行错位，折行与行号对齐
  原理上不可兼得。
- **Hexo 8 末尾双 `<br>`**：code 元素末尾输出两个 `<br>`，多出一个尾随空行盒，
  行号与代码整体错位半行；`figure.highlight td.code code br:last-child { display: none }`
  已处理（依赖 br 是 code 的最后一个子节点，改动 highlight 输出结构前先验证）。

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
  悬停资料卡、图片灯箱绑定、代码块复制、归档折叠、友链主站探测。

## 友链页（links.ejs）

- 数据源：`source/links/index.md` 的 front matter `links` 数组（分组 + 条目）。
- 条目字段：`name`、`url`（主站）、`fallback`（可选，主站不可达时的备用链接）、
  `img`（头像，自托管）、`desc`。
- **DNS 回退机制**：默认 href 指向 `fallback`；ink.js 用 `Image()` 探测主站
  favicon（`img-src` 允许 https，不受 `connect-src 'self'` 限制，fetch 不可用），
  探测成功自动把链接切回主站。加新友链时若主站 DNS 未配置，填 `fallback` 即可。
- 头像图片放 `source/img/links/`。
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
