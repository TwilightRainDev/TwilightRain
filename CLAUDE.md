# Blog 仓库说明（Claude Code 会话提示）

Hexo 8.1.2 博客源码。完整维护手册在 **docs/**（[入口](docs/README.md)），
本文件只放会话级要点，细节一律查 docs。

- **部署**：Cloudflare Pages 监听 GitHub `main` 分支构建（只认 main！）。
  发布 = 推 main；历史 `hexo deploy`/gh-pages 方案已废弃移除（2026-08-08）。
- **构建**：`npm run build`（hexo generate）→ `public/`，本机不执行 hexo deploy。
- **安全头/重定向**：`scripts/csp.js` → `public/_headers`，`scripts/redirects.js` → `public/_redirects`，
  均为 after_generate 钩子写入。开发模式（hexo server）无安全头是已知限制。
- **已知陷阱**（改安全/样式/评论代码前必读）：giscus 必须进 CSP style-src 白名单
  （否则评论 iframe 300px 回退）；字体自托管故 font-src 'self'；
  search.js 渲染必须转义（防 DOM XSS）。完整清单见 [docs/SECURITY.md](docs/SECURITY.md#已知陷阱清单)。
- **主题**：themes/ink 为 fork 定制版，整体入库，无独立仓库；
  偏好/评论配置在 themes/ink/_config.yml，不在主配置。
- **文档纪律**：docs/ 已入库（除 docs/BlogPrivate.txt）；新坑必须同步写入 docs。
- 行尾 LF（.gitattributes 已统一，仓库级 autocrlf=false）。
