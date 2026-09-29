# ADR-0017：IndexNow 提交走独立 CI

## 状态

已实施

## 背景

ADR-0009 保留了站点根密钥文件，并规定提交环节不进 Hexo 构建链路。
密钥在、提交不在，搜索引擎不会因为密钥文件存在就来收新 URL。

## 决策

- 提交脚本是 `scripts/indexnow-submit.js`，由 GitHub Actions
  （`.github/workflows/indexnow.yml`）在 push `main`、每日定时、手动触发时运行。
- URL 来自**线上** `https://twilightrain.com/sitemap.xml`，不读本地 `public/`。
- 端点 `https://api.indexnow.org/indexnow`（参与引擎会互相同步）。
- `package.json` 的 `build` 不加这一步。本地需要时跑 `npm run indexnow`。

## 后果

- 新文章随 `main` 推送后约 3 分钟（等 Pages）被提交；定时任务兜底漏网。
- Actions 失败不影响 Cloudflare 构建与站点上线。
- 密钥仍按协议放在站点根，不进 GitHub Secrets。
