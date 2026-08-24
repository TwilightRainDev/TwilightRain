# ADR-0003：CSP 自托管与白名单

## 状态

已实施（持续维护）

## 背景

博客需防 XSS 与第三方脚本注入，同时保留 giscus、B 站嵌入、GitHub API 等必要能力。

## 决策

- CSP 由 `scripts/csp.js` 在 `after_generate` 写入 `public/_headers`，随代码入库
- `script-src` 仅 `'self'`、`giscus.app`、`cdnjs.cloudflare.com`（fancybox/jquery）
- 不放宽内联脚本；冗余内联组件一律删除而非加 nonce
- Cloudflare Web Analytics 与 CSP 冲突时优先**关闭 Dashboard 注入**（TD-004），而非永久加域
- 构建期外链 `rel="noopener noreferrer"`、外链图 `referrerpolicy="no-referrer"`（阶段三 M7/M8）

## 后果

- 新第三方脚本须评估是否可自托管或是否值得扩白名单
- 改 `csp.js` 后必须 `npm run build` 并检查 `public/_headers`
