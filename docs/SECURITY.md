# 安全基线（CSP 与已知陷阱）

本页是**线上安全策略的唯一事实来源**，改任何安全相关代码前先读。

## 安全头机制

`scripts/csp.js` 在 `after_generate` 阶段写入 `public/_headers`，Cloudflare Pages
读取输出目录中的 `_headers` 文件并附加到响应。当前策略：

| 指令 | 白名单 | 说明 |
|---|---|---|
| `default-src` | `'self'` | 兜底 |
| `script-src` | `'self'` `https://giscus.app` `https://cdnjs.cloudflare.com` | 评论脚本 + CDN 脚本 |
| `style-src` | `'self'` `'unsafe-inline'` `https://giscus.app` `https://cdnjs.cloudflare.com` | 见下方 giscus 陷阱 |
| `img-src` | `'self'` `https:` `data:` | 外链图片与 data URI |
| `font-src` | `'self'` | 字体全自托管，禁止外链字体 |
| `frame-src` | `https://giscus.app` | 评论 iframe |
| `connect-src` | `'self'` `https://api.github.com` | 唯一第三方 fetch：GitHub 仓库卡片数据（见下） |
| `base-uri` | `'self'` | 防 base 标签劫持 |

**connect-src 例外（2026-08-17 起，用户拍板）**：`https://api.github.com`
是博客唯一第三方 fetch 白名单，服务于 GitHub 仓库卡片（ink.js 拉取
stars/forks/language/license/description）。缓解措施：localStorage 缓存
1 小时（防无 token 的 60 次/小时/IP 限流）、请求失败静默回退静态内容
（渐进增强）、只 GET 公开只读接口、不发送任何本地数据。新增其他第三方
fetch 前先评估（默认收紧取向）；若卡片功能移除，此行一并删除。

同时附带 `X-Content-Type-Options: nosniff` 与 `Referrer-Policy: strict-origin-when-cross-origin`。

**重要**：不要用 `source/_headers` + `skip_render` 的方案——Hexo 忽略下划线文件，
该方案不可行。安全头必须通过 `scripts/csp.js` 的 after_generate 钩子写入。

## 已知陷阱清单

1. **csp.js 开发模式限制**：hexo-server 3.x 的 `server_middleware` 过滤器在
   `scripts/` 的 load() 之前执行，开发模式中间件赶不上首轮请求——csp.js
   不再注册开发头，仅靠 `public/_headers`（生产已验证生效）。本地预览无 CSP
   是预期行为，不要试图修复。

2. **giscus 必须进 CSP style-src 白名单**：giscus client.js 会注入
   `https://giscus.app/default.css`（含 `.giscus-frame { width: 100% }`），
   漏掉会导致评论 iframe 宽度回退 300px（postMessage 内联样式不受 CSP 管）。
   删 `style-src` 里的 `https://giscus.app` 或 `'unsafe-inline'` 前，先在线上
   验证评论宽度。

3. **字体自托管约束**：`font-src 'self'` 意味着任何新字体必须放
   `themes/ink/source/fonts/` 并子集化（现有两个：LXGWWenKai、HYWenHei 85W，
   GB2312 约 7200 字符子集）。直接引 Google Fonts 会被 CSP 拦。

4. **重定向与 404**：
   - `scripts/redirects.js` 维护 301 重定向（目前：旧 hello-world → `/about/`，
     带/不带尾斜杠两条规则，`_redirects` 规则按顺序第一条命中）。
   - `source/404.md` 使用自定义 `layout: 404`，配合
     `cloudflare pages` 确保不存在的路径返回**真实 404 状态**（而非 200）。
     改动时不要退化成"返回 200 的软 404"。

5. **搜索 XSS（已修复，勿回退）**：`themes/ink/source/js/search.js` 渲染搜索结果
   时必须走文本节点/DOM 转义，不能把用户输入拼进 `innerHTML`。改搜索代码时
   保持这一约束（历史上曾存在 DOM XSS，commit d6b5989 修复）。

6. **依赖安全**：dependabot 每日检查 npm 依赖（`.github/dependabot.yml`），
   PR 上限 20。合并依赖升级 PR 前跑 `npm run build` 验证。`package.json` 的
   `overrides` 段（brace-expansion/minimatch 锁版）是已知漏洞的补丁，不要删。

7. **内联事件处理器被 CSP 拦截（2026-08-14 踩坑）**：`script-src` 不含
   `'unsafe-inline'`，任何 `onclick`/`onload` 等内联事件属性都会在浏览器端
   被拒绝执行（点击无反应，控制台报 "Refused to execute inline event
   handler"）。页面交互一律走外链 JS（ink.js）的 `addEventListener`，导航类
   语义用 `<a>` 链接（分页按钮即因此从 button+onclick 改为 a）。新增任何
   内联事件属性前先想清楚，改后需在线上验证。

8. **source/ 下的可渲染扩展名会被当页面处理（2026-08-16 踩坑）**：Hexo 8
   的 asset processor 对 `source/` 中**无 front-matter** 的 `.html`/`.json`
   等"有渲染器"的文件仍走 `processPage`——会被套上主题布局、进入 `site.pages`
   （进而出现在 sitemap）。要原样静态拷贝必须加入 `_config.yml` 的
   `skip_render`（例：彩蛋页 `egg/**`，全走原样拷贝，URL 为 `/egg/`）。
   注意：**改 `skip_render` 后必须 `hexo clean` 再 build**，否则 db.json 缓存
   会让旧产物（已套布局的版本）残留。

9. **外置 import map 不可靠（2026-08-16 踩坑）**：`<script type="importmap"
   src="...">` 在 Chromium 系（Edge 151 实测）不生效——脚本标签不发请求，
   裸模块标识符全部解析失败（页面表现为：纯 HTML 界面正常、模块渲染的 3D
   场景全无）。**不要用 import map**：本地库一律改**相对路径导入**
   （彩蛋页 main.js 直接 `./lib/three.module.js`；vendored OrbitControls.js
   的 `from 'three'` 已补丁为 `from '../three.module.js'`，见文件头部
   [PATCH] 注释）。内联 import map 可用但被 CSP `script-src` 拦（无
   `'unsafe-inline'`），也不可取。

## 内容与仓库安全

- 评论走 giscus（GitHub Discussions 作后端，主题配置见 [THEME.md](THEME.md#评论)）。
- 提交身份用 noreply 邮箱（`TwilightRainDev@users.noreply.github.com`），
  推送凭据不落库（在 `H:\work_zone\ApiKey`）。
- `docs/BlogPrivate.txt` 是私人备忘，不入库（`.gitignore` 单独忽略）；
  docs/ 其余内容可放心提交。
- 不要在 `source/`、`themes/ink/` 中放任何密钥、Cookie、token 文本。
