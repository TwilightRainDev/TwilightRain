# Blog 仓库说明（Claude Code 会话提示）

Hexo 8.1.2 博客源码。完整维护手册已移出本仓库，落在工作区 **`Docs/Project/Blog/`**（[入口](Docs/Project/Blog/README.md)），
本文件只放会话级要点，细节一律查 `Docs/Project/Blog/`。

- **部署**：Cloudflare Pages 监听 GitHub `main` 分支构建（只认 main！）。
  发布 = 推 main；不要推 `gh-pages`、不要恢复 `hexo deploy`。
- **提交标题**：`/timeline/` 页面上的事件就是提交标题与提交日期（构建期读 `git log`）。写法、
  日期口径与提交前自检见 [Docs/Project/Blog/HISTORY.md](Docs/Project/Blog/HISTORY.md)：可见的那条
  不写类型前缀，整天只有内部活的提交带 `docs:` 前缀。
- **构建**：`npm run build`（hexo generate）→ `public/`，本机不执行 hexo deploy。
- **安全头/重定向**：`scripts/csp.js` → `public/_headers`，`scripts/redirects.js` → `public/_redirects`，
  均为 after_generate 钩子写入。开发模式（hexo server）无安全头是已知限制。
- **已知陷阱**（改安全/样式/评论代码前必读）：giscus 必须进 CSP style-src 白名单
  （否则评论 iframe 300px 回退）；字体自托管故 font-src 'self'；
  search.js 渲染必须转义（防 DOM XSS）。完整清单见 [Docs/Project/Blog/SECURITY.md](Docs/Project/Blog/SECURITY.md#已知陷阱清单)。
- **主题**：themes/ink 为 fork 定制版，整体入库，无独立仓库；
  偏好/评论配置在 themes/ink/_config.yml，不在主配置。
- **文档纪律**：维护手册不在本仓库，落在工作区 `Docs/Project/Blog/`；新坑必须同步写进去。
- 行尾 LF（.gitattributes 已统一，仓库级 autocrlf=false）。
