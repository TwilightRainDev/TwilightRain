# ADR-0015：自研灯箱，下线 fancybox + jQuery

## 状态

已实施

## 背景

文章页灯箱走 cdnjs 的 jQuery 3.5.1 + fancybox 3.5.7。相册页删除后全站只剩这一个使用点。fancybox 3.5.7 对裸 `<img>` 会把节点移进灯箱，关闭后残留 `display:none`，必须靠 `afterClose.fb` 把头图救回来。CSP 为此在 `script-src` / `style-src` 放行了 `cdnjs.cloudflare.com`（ADR-0003）。

2026-09-25 拍板（D1-B）单独一轮改自研，不与其它收敛混提。

## 决策

- 灯箱用原生 DOM 写在 `ink.js`，样式进 `style.min.css`。不新增主题 JS 文件（不为拆而拆）。
- 灯箱只显示克隆的 `src`，不移动页面上的 `<img>`，因此不再需要关闭恢复补丁。
- 只在文章页启用（以 `.post-imgcard` 为标记）。
- 「查看原图」以 `data-ori` 为准，灯箱内切换展示图 / 原图；中键或带修饰键的点击仍新标签打开原图。
- 从 `post.ejs` 移除 CDN；CSP 同步去掉 `cdnjs.cloudflare.com`。giscus 仍走 `giscus.app`，与本决策无关。

## 后果

- 文章页不再请求 cdnjs；CSP 白名单少一个域。
- 灯箱行为以 [规格](../specs/2026-09-26-lightbox-design.md) 为准，不再对齐 fancybox 的工具栏 / 缩放手势。
- ADR-0003 里「cdnjs 放行 fancybox/jquery」一条由本决策取代。
