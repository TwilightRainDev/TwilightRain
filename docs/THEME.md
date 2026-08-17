# 主题定制（themes/ink）

主题 fork 自 `hoytzhang/hexo-theme-ink`，已深度定制并整体入库（`themes/ink/` 内全部文件受 git 跟踪，无独立 git 仓库），修改直接进版本控制。

## 布局文件职责

```
themes/ink/layout/
├── layout.ejs        # 总骨架（head/header/footer 装配）
├── index.ejs         # 首页文章流（无 cover 文章从本地封面池随机取图，见下文）
├── post.ejs          # 文章页（头图并入 TOC 双卡、阅读进度条、返回顶部、评论挂载点）
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
├── settings.ejs      # 设置页（source/settings/index.md → 主题/字体/首页列数偏好）
├── post.ejs          # 文章页正文头部含阅读时间（scripts/reading-time.js 注入）
├── search.ejs        # 搜索页（source/search/index.md → search.js 前端检索）
├── categories.ejs / tags.ejs / gallery.ejs
```

## 配置（themes/ink/_config.yml）

- `favicon`：`/img/icon.svg`
- `menu`：顶部导航（header.ejs 遍历渲染；http(s) 开头的值视为外链，
  自动加 `target="_blank" rel="noopener"`；加导航项只改这里）。
  支持二级菜单：值写成对象 `{ url: 父链接, children: { 子名: 链接 } }`，
  `url` 可省略（父项仅作展开按钮），详见下文「二级菜单」章节。
- `notice`：首页公告条文本，留空 `''` 则不显示
- `giscus`：评论系统开关与仓库 ID（`enabled`、`repo_id`、`category_id`）。
  若 GitHub Discussions 配置变动（重建仓库、改 Discussions 分类），
  需在 https://giscus.app/ 重新生成 ID 并同步更新，否则评论加载失败。

## 文章页功能（post.ejs）

- **头图横幅**（`partial/banner.ejs`）：**仅普通页面使用**（about/links 等，
  `page.ejs` 引用）；**文章页已弃用**（2026-08-14 重构）：post.ejs 不再引用
  banner，改为「头图并入 TOC 双卡」布局（见下文）。
- **文章页头图 + TOC 双卡**（post.ejs 输出 `.post-toc-row`）：图卡
  （`.post-imgcard`，40% 宽，高度为图片自然比例——封面池方图即方卡，
  front matter `cover` 或 `data-random-cover` 随机封面池）+ 目录槽
  （`.post-toc-slot`，ink.js 生成的 TOC 移入其中），桌面并排、移动端
  （<768px）图卡全宽堆顶。**目录卡与图卡等高**：ink.js 用 ResizeObserver
  同步 `toc.style.height = 图卡高`——目录内容少于图卡高时填充留白（等高
  卡片），内容超出时卡片内滚动（`overflow-y: auto`，2026-08-15 修复
  "长目录 557px 撑高" 问题）。图卡高度随图片解码与窗口宽度变化，RO 自动
  跟随；`h > 0` 保护防止图片加载失败时目录卡高度归零。无 h2/h3 的文章
  不生成 TOC 卡，图卡自动全宽（`:not(:has(.post-toc))` 规则）。图卡图片与
  文章内图片同样绑定 fancybox 灯箱。TOC 头部「目录 [折叠]」整体左对齐。
  改动双卡结构时注意：TOC 由 ink.js 运行时生成并移入槽位，`figure.highlight`
  等文章结构不受影响。
- **图片灯箱**：文章内图片点击放大（fancybox 3）。资源由 post.ejs 按页引入
  （cdnjs + integrity，与 gallery.ejs 同款，CSP script-src/style-src 已含
  cdnjs.cloudflare.com，改安全头前读 [SECURITY.md](SECURITY.md)）。
  `ink.js` 在运行时给 article 内 img 加 `data-fancybox` 属性，fancybox 事件委托自动绑定。
  **已知陷阱（2026-08-17 修复）**：fancybox 3.5.7 对直接 `<img>` 触发（无 `<a>`
  包裹）会把原图移动进灯箱，关闭时放回但残留 `style="display: none"`——文章页
  头图关闭灯箱后"消失"。ink.js 监听 jQuery 的 `afterClose.fb` 事件恢复内联
  display（文章页才有 jQuery；若未来文章正文加图同样适用）。改动灯箱绑定方式
  （如改为 `<a>` 包裹走 image 类型克隆路径）前先验证此机制。
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

## MathJax 按需加载

- **机制**：构建时在 `partial/head.ejs` 按页检测，仅正文含公式标记的页面
  注入两个脚本（`/js/mathjax-config.js` + `/js/mathjax/tex-chtml.js`），
  其余页面零 MathJax 痕迹（不加载不请求）。
- **开关（front matter `math` 字段）**：`math: true` 强制加载；`math: false`
  强制不加载；缺省自动检测。
- **自动检测规则**：把 `page.content` 中 `<pre>...</pre>` 代码块整体剔除后，
  匹配 `$`、`\(`、`\[` 任意一个即视为含公式——代码块里的美元符号/反斜杠
  不会误触发（bilicompact-source-v2 那种满屏 `$` 的源码文章安全）。
- **公式分隔符**：行内 `$...$` 与 `$$...$$`（显示公式），`\(...\)` 也受支持。
  **注意**：markdown-it 的 backslash escape 会把源文件里 `\(` `\)` `\[` `\]`
  的反斜杠吞掉（`\(` 属于可转义标点），文章里写 `\(...\)` 会渲染成 `(a ne b)`
  这类字面文本——**写文章一律用 `$...$` / `$$...$$`**。检测与配置保留
  `\(` `\[` 分支是为兼容手动注入的 HTML。
- **资源自托管**：`source/js/mathjax/`（tex-chtml.js 1.2M + `output/chtml/fonts/
  woff-v2/` 23 个字体 388K，合计约 1.5M，仅公式页按需下载，gzip 后约 250K）。
  与 CSP 全兼容（`script-src 'self'`、`font-src 'self'`、MathJax 3 运行时
  注入的 `<style>` 由 `style-src 'unsafe-inline'` 放行），**无需改 csp.js**。
  若换 CDN 版 MathJax，font-src 会拦 CHTML 字体导致符号渲染退化，勿改。
- **更新 MathJax**：`cd A:\work_zone\Temp && npm pack mathjax@<版本>`，
  解压取 `es5/tex-chtml.js` 与 `es5/output/chtml/fonts/woff-v2/` 整目录覆盖
  `source/js/mathjax/`（目录结构即字体相对路径，勿平铺）。
- **mathjax-config.js 独立文件原因**：CSP `script-src` 无 `'unsafe-inline'`，
  配置不能内联 `<script>`；该文件必须位于 tex-chtml.js 之前（defer 按文档
  顺序执行，`window.MathJax` 要先注册）。改动配置时勿合并进 ink.js——
  那样无公式页也会带上配置代码，违背按需纪律。

## 二级菜单（header 导航）

- **配置**：`_config.yml` 的 `menu` 值两种形态——
  - 字符串：普通链接（现状不变）
  - 对象：`{ url: /父链接/, children: { 子名: /链接/ } }`。`url` 可省略，
    省略时父项仅作展开按钮（渲染为 `href="#"`，点击由 JS 接管）。
    子项与普通项一样，http(s) 开头视为外链新标签打开。
- **渲染**：`partial/header.ejs` 对对象值输出
  `<span class="has-sub"><a class="sub-trigger">…</a><ul class="sub-menu">…</ul></span>`。
- **交互**：
  - 桌面（`(hover: none)` 为 false）：CSS `:hover` 展开，父项带 `url` 时
    点击正常跳转，不拦截。
  - 触摸设备：`ink.js` 事件委托拦截父项点击，切换 `.open` 类展开/收起，
    点击外部自动收起；子菜单项点击正常跳转。仅支持两级，子项不支持再嵌套。
- **样式**：`style.min.css` 末尾「二级菜单」段——下拉面板绝对定位
  （`position: absolute; top: 100%`），`.has-sub:hover` 与 `.has-sub.open`
  两种展开入口；展开箭头是 CSS 边框三角（不依赖图标字体）。

## 归档页（archive.ejs）

- 主配置 `_config.yml` 中 `archive_generator.per_page: 0` 关闭归档分页，
  单页列出全部文章（与页面"共 N 篇"统计一致）。
- 交互：`ink.js` 的 `#archives-toggle` 按钮切换全部月份折叠状态。

## 样式与脚本

- 全部样式在 `source/css/style.min.css` 单文件中（原主题特色：可直接套用
  bearblog 系样式代码）。改动时保持单文件约定，避免新增散装 css 引入点。
- `source/js/ink.js`：**defer 加载**，主题偏好（theme-preference / font-preference /
  columns-preference）在 defer 阶段立即应用，兼容旧值（light/dark）。设置页选择
  会写入 localStorage。
  模块清单：图片说明、随机封面、主题/字体/列数偏好、返回顶部、阅读进度条、TOC、
  悬停资料卡、图片灯箱绑定、代码块复制、归档折叠、友链主站探测、
  二级菜单触摸交互、Mermaid 图表按需渲染（见下）。
  **主题变更通知**：偏好模块 `applyTheme` 末尾 dispatch `theme-change` 事件
  （detail.theme = 实际主题），依赖主题的组件监听它（当前仅 mermaid 重渲染）。

## 首页列数（设置页 → 全端统一）

- 设置项 `columns-preference`：`auto`（默认，响应式现状）/ `1`-`4`（全端统一）。
- 实现：ink.js 在 `.blog-posts` 上写 CSS 变量 `--cols`，样式表 `.article-item`
  宽度为 `calc(100% / var(--cols, 断点兜底) - 20px)`；三档媒体查询
  （基础 3 / ≤768px 2 / ≤480px 1）的 `var()` 兜底值不同——未设置时各断点取
  各自默认列数（现状行为），显式设置后所有断点内都解析为设置值（全端跟随）。
- 只作用于首页：归档/标签等页用独立列表结构，不受影响。

## 提示块（admonitions）

- **语法**：`:::note` / `:::tip` / `:::important` / `:::warning` / `:::caution`
  包裹内容，`:::类型[自定义标题]` 可指定标题（缺省显示类型名，如 Note）。
  渲染为 `<blockquote class="admonition bdm-类型" data-callout="类型">` +
  `.bdm-title`（Twilight 迁移，语法与 markdown-it-container / remark-directive 一致）。
- **实现**：`scripts/marked-admonitions.js` 注册 **marked:use** 过滤器——hexo-renderer-marked
  每次渲染前执行该过滤器（lib/renderer.js:235 `execFilterSync('marked:use', marked.use)`），
  用 marked 块级扩展（tokenizer 二次解析块内内容 + renderer）实现，无需切换渲染器、
  不影响既有 Markdown 解析。未闭合的 `:::` 块原样输出（写错时显眼暴露）。
- **样式**：style.min.css「提示块」段——每类型 `--bdm-accent` 变量（五色）+ 标题前
  mask 图标（SVG data URI，走 `img-src data:` 白名单）+ 左右双主题背景色。
  注意覆盖博客全局 blockquote 的 italic 样式（admonition 设 `font-style: normal`）。
- **安全**：标题文本 HTML 转义（防注入）；图标只经 CSS mask 显示，无脚本。

## Mermaid 图表

- **语法**：````mermaid 围栏代码块 → `<div class="mermaid"><pre><code>源码</code></pre></div>`，
  源码保留在 DOM（无 JS 可见、可复制）；ink.js 按需加载自托管
  `themes/ink/source/js/mermaid.min.js`（v11.16.1，约 3.6MB 未压缩 / gzip 约 1MB）
  渲染为 SVG 替换容器；渲染失败显示错误信息并保留源码。
- **实现关键（2026-08-16 踩坑）**：**不能做成 marked 扩展**——hexo 内置
  `backtick_code_block` before_post_render 过滤器（priority 10）会在 marked 渲染前
  把源文里所有围栏代码块整体替换为占位符，marked 扩展的 tokenizer 永远看不到
  ```mermaid（扩展注册成功但完全不命中）。`scripts/marked-mermaid.js` 因此改为
  **before_post_render 预处理**（priority 9，先于 backtick_code_block）：把 mermaid
  围栏直接替换为 HTML 容器，围栏结构消失后 backtick 过滤器不再匹配，其余代码块
  不受影响（highlight.js 构建时高亮路径不变）。
  **限制**：列表/引用缩进内（`> ` / `- ` 前缀）的 mermaid 围栏不支持——预处理正则
  只匹配顶格（`^ {0,3}`），缩进的会被 backtick 接管走代码高亮，文章里图表一律顶格写。
- **主题跟随**：ink.js 监听偏好模块 dispatch 的 `theme-change` 事件，按
  `html[data-theme]` 用 mermaid 的 default/dark 主题重渲染（渲染前把源码存入
  `el.dataset.code`，重渲染不依赖 DOM 源码）。渲染配置 `securityLevel: 'strict'`
  （不执行图表内 HTML/click 指令，Twilight 原方案 loose 未迁移）。
- **CSP**：无新增白名单——库自托管（`script-src 'self'`）、mermaid 不请求外链
  （图表内嵌 img 走 `img-src https:`）。**更新库**：`npm pack mermaid@版本` 取
  `dist/mermaid.min.js` 覆盖 `themes/ink/source/js/`。

## 阅读时间

- **实现**：`scripts/reading-time.js` —— after_post_render 过滤器用 hexo-util
  `stripHTML` 去标签统计字符数（中文约 400 字/分钟，下限 1 分钟），注入
  `post.readingMinutes`。构建期计算、零前端开销、结果直接进 HTML。
- **显示**：post.ejs 正文头部「阅读约 N 分钟」（`.post-reading-meta`，右下角小字）。
- 代码块文本计入统计（与 Twilight 的 reading-time 行为一致）。

## 文章置顶（index.ejs）

- 文章 front matter `pinned: true` 时首页排最前（其余按日期降序）。
  实现：index.ejs 对 `page.posts` 先 `toArray().sort()`（pinned 优先，同 pinned
  内按日期降序）再渲染；只影响首页当前分页内顺序（置顶文章通常在第一页）。
- 草稿：Hexo 原生 `source/_drafts` + `render_drafts: false`（现状），无需处理。

## GitHub 仓库卡片

- 语法（单行）：`::github{repo="owner/repo" desc="可选描述"}`，渲染为
  `<a class="card-github">`（owner/repo + GitHub 图标 + 可选描述），点击跳转
  仓库页。repo 无 "/" 或缺失时输出可见错误提示（`[WARN]`）。
- 实现：`scripts/marked-github-card.js` 注册 marked:use 扩展（同提示块模式）
  静态渲染基础信息；`ink.js`「GitHub 仓库卡片数据」模块前端调 GitHub API
  补充动态数据（stars/forks/language/license，无静态 desc 时补 description）。
- **API 与 CSP**（2026-08-17 用户拍板）：`connect-src` 放行
  `https://api.github.com`——博客唯一第三方 fetch 例外（安全细节见
  [SECURITY.md](SECURITY.md#安全头机制)）。限流缓解：localStorage 缓存 1 小时
  （`gh-repo-cache:{repo}`）；请求失败（限流/网络）静默保留静态内容（渐进增强）。
  卡片 HTML 带 `data-repo` 属性与 `.gc-meta` 槽位（`.gc-meta:empty` 隐藏）。
- 样式：style.min.css「GitHub 仓库卡片」段（背景 + 边框 + hover 变色 + meta 行，深浅主题适配）。

## 展柜页（projects / skills / timeline）

- 2026-08-17 新增三个独立页：`/projects/`、`/skills/`、`/timeline/`，
  数据在各自 source 目录的 index.md front matter（`projects` / `skills` /
  `items` 数组），布局 projects.ejs / skills.ejs / timeline.ejs（卡片网格 /
  年份分组时间线）。
- 导航：主题 `_config.yml` `menu` 的「展柜」二级菜单（url 指向 /projects/，
  子项三个）。
- **踩坑（2026-08-17）**：front matter 数组内 `date: 2026-07-30` 会被 YAML
  解析为 Date 对象（裸日期是 YAML timestamp 类型），模板里 `.substring()`
  直接崩溃、页面输出 0 字节——**日期值必须加引号**（`date: "2026-07-30"`）。
- 项目初始数据来自 GitHub 公开仓库列表；skills 初始数据来自仓库语言与博客
  内容（均为可证实来源，可直接编辑 index.md 修改）。

## 相册页（gallery.ejs）

- 2026-08-17 激活（布局此前已存在但未启用）：数据源 `source/gallery/index.md`
  的 front matter `photos` 数组（`src` / `title` / `date`），Fancybox 灯箱由
  gallery.ejs 自行引入（cdnjs + integrity）。
- **加照片**：编辑 `photos` 数组即可，图片放 `source/img/`（建议 `img/photos/`
  子目录）后引用 `/img/photos/xxx.jpg`。当前内容为封面池示例图占位，待替换。
- 导航入口在主题 `_config.yml` `menu`（`相册: /gallery/`）。

## 友链页（links.ejs）

- 2026-08-17 增强：卡片从纯边框升级为浅背景 + hover 浮起（Twilight friends
  卡片风格），深浅主题各一套背景；数据结构（分组 + name/url/fallback/img/desc）
  未变。

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
