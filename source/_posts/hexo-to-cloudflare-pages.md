---
title: Hexo博客从GHP到CFP迁移记录
excerpt: Hexo 博客从 GitHub Pages 迁到 Cloudflare Pages 的全记录：动机、建项目、以及两次部署踩坑（package.json 推错、分支名）。
date: 2026-07-21 14:45:00
tags:
  - Hexo
  - Cloudflare
  - 博客部署
  - 运维
categories:
  - 技术笔记
---

## 缘起

事情是这样的。

我的 Hexo 博客之前一直部署在 GitHub Pages 上，但我发现它在国内的访问体验很不稳定——时而能打开，时而转圈圈，时而直接超时。这是因为 `github.io` 域名在国内的 CDN 节点访问不畅，加上可能存在的 DNS 污染，导致博客对国内读者不太友好。

于是我开始寻找解决方案。最直接的办法是使用 Cloudflare Pages 来托管博客，利用它的全球 CDN 加速，让国内访问更稳定。

---

## 第一步：在 Cloudflare Pages 创建项目

操作本身不复杂：

1. 登录 Cloudflare Dashboard → **Workers & Pages**
2. 点击 **Create application** → 选择 **Pages** 选项卡
3. 点击 **Connect to Git**，授权 Cloudflare 访问你的 GitHub
4. 选择你的博客仓库，填入构建设置：

| 配置项 | 填写值 |
| -------- | -------- |
| Production branch | main |
| Framework preset | None（列表中没有 Hexo） |
| Build command | `npm run build` |
| Build directory | public |

1. 点击 **Save and Deploy**

一切都看起来很简单……直到我看到了红色的报错。

---

## 第二步：踩坑——`package.json` 找不到了？

Cloudflare Pages 的构建日志赫然写着：

```
npm error code ENOENT
npm error path /opt/buildhome/repo/package.json
npm error enoent Could not read package.json
```

嗯？我的仓库里明明有 `package.json` 啊。

回头一看 GitHub 仓库，我明白了——

### 根因：推送错了内容

我的 GitHub 仓库里只有这些文件：

```
index.html
2026/07/13/hello-world/
archives/
css/
fancybox/
js/
```

全是 `hexo generate` 生成的**静态文件**，没有 `package.json`，没有 `_config.yml`，没有 `source/` 文件夹。

换句话说，我之前一直用 `hexo deploy` 把编译后的 `public/` 目录推到了仓库里。这在 GitHub Pages 的流程下是正常的——它只需要静态文件。但 **Cloudflare Pages 需要的是源代码**，因为它要在服务端执行 `npm install` 和 `npm run build`。

### 修复：推送正确的源代码

解决方案很简单：把 Hexo 的源代码推上去。

```bash
# 在博客根目录执行
git init
git add .
git commit -m "推送 Hexo 源码到 Cloudflare Pages"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main --force
```

注意 `.gitignore` 要确保忽略了 `node_modules/` 和 `public/`：

```text
node_modules/
public/
db.json
.deploy*/
```

这样推送上去的就是干净的源代码，Cloudflare 拉取后会自动安装依赖并构建。

---

## 第三步：又踩一坑——分支名称

推送成功后，我兴冲冲地点了 **Retry deployment**，结果……还是同样的错误。

再次查看构建日志，发现 Cloudflare 拉取的依然是旧 commit：

```text
 * branch 8eb197c... -> FETCH_HEAD
HEAD is now at 8eb197c Site updated: 2026-07-13 18:25:29
```

奇怪，明明推送成功了，为什么还拉取旧代码？

原因在于 **Cloudflare Pages 配置的 Production branch 还是 `master`**，而我的仓库默认分支已经改成了 `main`（且 `master` 已经不存在了）。Cloudflare 找不到 `master` 分支，就用了一个缓存中的旧提交。

解决方案：在 Cloudflare Pages 项目设置中，把 **Production branch** 从 `master` 改为 `main`，然后再次重试部署。

这次终于成功了！🎉

---

## 最终效果

博客成功部署到了 `twilightrain.pages.dev`，构建和部署都自动完成。以后更新博客只需要：

```bash
hexo new post "我的新文章"
# 写文章...
git add .
git commit -m "新文章"
git push
```

Cloudflare Pages 会自动检测到 push 事件，拉取代码、安装依赖、构建、部署，整个流程全自动。

---

## 总结几个要点

1. **GitHub Pages 推静态文件，Cloudflare Pages 推源代码**——这两种部署方式对仓库内容的要求完全不同，搞清楚区别才能避免踩坑。
2. **Production branch 要匹配**——Cloudflare Pages 配置的部署分支必须和 GitHub 仓库的默认分支一致。
3. **Cloudflare Pages 的构建命令记得用 `npm run build`**，而不是 `hexo generate`。确保 `package.json` 的 `scripts` 中有 `"build": "hexo generate"`。

希望这篇文章能帮到同样想迁移到 Cloudflare Pages 的朋友。如果你也遇到了类似的报错，对照上面的步骤检查一下，大概率能解决问题。
