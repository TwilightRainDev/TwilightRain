/*
 * ink 主题客户端脚本入口（head.ejs 以 type="module" 加载）。
 *
 * 实现在 js/ink/ 下的模块里，下面按加载顺序列出。
 * 模块之间不共享作用域，也不互相调用：彼此只通过 DOM 与自定义事件
 * （如 prefs 派发的 theme-change）通信，故顺序对行为不敏感。
 * 新增模块追加到末尾即可，不必调整既有顺序。
 */

import './ink/image-color.js';
import './ink/prefs.js';
import './ink/chrome.js';
import './ink/friend-links.js';
import './ink/lightbox.js';
import './ink/cards-and-code.js';
import './ink/widgets.js';
