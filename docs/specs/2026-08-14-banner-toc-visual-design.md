# 设计：文章页 banner 移除，图片并入 TOC 双卡布局（2026-08-14）

## 问题陈述

文章页存在三处标题冗余：header 顶部 title（icon + 站点名|文章标题）、
post-banner-title（30vh 横幅内大标题）、以及 TOC 卡。banner 画幅（30vh 全宽
大图）与博客简洁风格不搭；但直接删除会丢失封面图片展示功能（随机封面池 /
cover 机制是好不容易建立的能力）。

## 用户决策（InterrogativeIdeation 澄清）

1. 布局：目录卡 + 独立图卡**并排**（图卡占 40% 宽度）
2. 图片：固定高度裁切（160px，object-fit: cover）
3. 范围：仅文章页（post.ejs）去 banner；about/links 等普通页面保留 banner
4. toc-header：头部整体靠左（去掉 space-between 两端对齐）
5. 移动端（<768px）：图卡全宽堆叠在目录卡上方

## 实施决策

- **post.ejs**：移除 `partial('partial/banner')`，在原位置输出双卡容器
  `.post-toc-row`（flex）：
  - `figure.post-imgcard`：cover 有则 `src=cover`，否则 `data-random-cover`
    （随机封面池机制由 ink.js DOMContentLoaded 赋值，天然复用，零改动）
  - `div.post-toc-slot`：TOC 槽位，ink.js 生成的目录卡移入此处
- **ink.js**：TOC 生成后从 `article.insertBefore(toc, article.firstChild)`
  改为移入 `.post-toc-slot`；图卡 img 与文章内图片一样加 `data-fancybox`
  （点击放大，fancybox 资源 post.ejs 已引入）
- **style.min.css**：
  - `.post-toc-row`：flex + gap 1rem + margin-bottom 1.5rem（接替 banner 的 margin）
  - `.post-toc`：`flex: 1 1 60%`、margin-bottom 归零
  - `.post-imgcard`：`flex: 0 0 40%`、高 160px、圆角边框与 TOC 卡同款、cover
  - 无 TOC 时（无 h2/h3 的文章）图卡全宽：`:not(:has(.post-toc))` 分支
  - `.toc-header`：`justify-content: flex-start`
  - <768px：row 转 column，图卡全宽堆顶
  - 深色模式（prefers-color-scheme 与 [data-theme=dark] 双分支）：图卡边框适配
  - **banner 的 CSS 与 partial 保留**（普通页面仍用）

## 边界情形

- 无 h2/h3 的文章：不生成 TOC 卡，图卡独立全宽显示
- 无 cover 文章：随机封面池（机制不变）
- 普通页面（about/links/settings）：banner 回归，无变化

## 测试

- 构建 + hexo server
- CDP 桌面视口：文章页双卡并排、折叠交互、灯箱点击、无标题短文图卡全宽
- CDP 移动视口（390px）：图卡堆顶、全宽
- 深色模式边框
- about 页 banner 回归
- 代码块修复（figure.highlight）回归：行号对齐不回归

## 范围之外

- 首页缩略图、封面池机制不动
- 普通页面 banner 不动
