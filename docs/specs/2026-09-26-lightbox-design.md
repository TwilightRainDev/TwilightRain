# 规格：自研灯箱替换 fancybox + jQuery

> 来源：`docs/BACKLOG.md`「自研灯箱…」（2026-09-25 D1-B）。
> 本轮单独做，不混入 IndexNow、拆 `ink.js`、已发布文章陈旧断言、双链复核。

## 1. 要解决什么

文章页灯箱现在靠 cdnjs 上的 jQuery 3.5.1 + fancybox 3.5.7。相册页已删，全站只剩文章页一个使用点。fancybox 对裸 `<img>` 会把原图移进灯箱，关闭后残留 `display:none`，头图会「消失」——`ink.js` 为此写了 `afterClose.fb` 补丁。

本轮用自研灯箱拿下这两个第三方依赖，并收掉补丁。

## 2. 范围

| 做 | 不做 |
|---|---|
| 文章页头图 + `article` 内图片（含 `:::grid`）点开放大 | 首页缩略图灯箱 |
| 灯箱内显示点击那张图的 `src`（通常是 360px） | 关于页 / 其它 layout |
| `data-ori`：灯箱内在展示图与原图之间切换；中键 / Ctrl+点击仍新标签打开原图 | 捏合缩放、下载、幻灯片播放 |
| 键盘：Esc 关，左右键翻同一页图组 | 拆 `ink.js` 成多文件 |
| 左右滑动翻页（触控） | 改已发布文章正文 |
| 下线 post.ejs 的 jQuery / fancybox；CSP 去掉 `cdnjs.cloudflare.com` | 扩 CSP 白名单 |

## 3. 行为

- **启用条件**：页面存在 `.post-imgcard`（只有 `post.ejs` 有）。其它页 `ink.js` 仍加载，但不挂灯箱。
- **图组**：`.post-imgcard img` + `article img`，与现网 `data-fancybox="article"` 范围相同。
- **打开**：点击上述图片。不把原节点移进灯箱，只把 `src` 赋给灯箱里的 `<img>`。原图节点样式不被改写。
- **关闭**：Esc、点遮罩、点「关闭」、浏览器后退（打开时 `pushState`）。
- **查看原图**：`data-ori` 有值且与当前 `src` 不同时显示按钮。单击在灯箱内切换 360px / ori；带修饰键或中键走 `<a target="_blank" rel="noopener noreferrer">`。无 `data-ori` 时按 `/img/360px/` → `/img/ori/` 推导（与现 `ink.js` 一致）。
- **无障碍**：`role="dialog"` `aria-modal="true"`；打开时锁 `body` 滚动并记住焦点，关闭后还回；Tab 只在灯箱控件里循环。
- **安全**：灯箱 DOM 用 `createElement` / `textContent`，不把 URL 或 alt 拼进 `innerHTML`。

## 4. 完成判据

1. `themes/ink/layout/post.ejs` 不再出现 jquery / fancybox / cdnjs。
2. `scripts/csp.js` 的 `script-src` / `style-src` 不再含 `cdnjs.cloudflare.com`。
3. `ink.js` 不再出现 `jQuery`、`fancybox`、`afterClose.fb`、`data-fancybox`。
4. `npx hexo clean && npm run build` 后产物不含那两个 CDN URL；`public/_headers` 无 cdnjs。
5. `npm test` 全绿（含本轮源码契约测试）。
6. 文章页（至少 `blog-writing-features` 与 `with-her-eyes`）灯箱：打开、左右翻、Esc 关、原图切换、关闭后头图仍在。
