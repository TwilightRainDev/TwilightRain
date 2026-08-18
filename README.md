# TwilightRain 博客

TwilightRain 的个人博客，记录技术探索与日常思考。
在线站点：<https://twilightrain.com>（Cloudflare Pages 托管）

## 技术栈

- Hexo 8.1.2（Node.js >= 20.19.0）
- 定制主题 `themes/ink`（fork 自 hexo-theme-ink）
- 部署：Cloudflare Pages 监听 GitHub `main` 分支自动构建

## 快速开始

```bash
npm install
npm run server   # 本地预览 → http://localhost:4000
npm run build    # 构建产物 → public/
```

发布 = 推送 `main` 分支，Cloudflare Pages 自动部署。

## 文档

面向后续维护者的完整手册见 [docs/](docs/README.md)：

- [架构总览](docs/ARCHITECTURE.md)
- [日常开发与发布流程](docs/WORKFLOW.md)
- [安全基线（CSP 与已知陷阱）](docs/SECURITY.md)
- [主题定制](docs/THEME.md)

## 仓库

- 源码仓库：<https://github.com/TwilightRainDev/TwilightRain>（main 分支，Cloudflare 只认它）
- 站点：<https://twilightrain.com>
