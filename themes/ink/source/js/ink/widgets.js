/*
 * 页面组件：归档展开、二级菜单、汉堡导航、Mermaid、代码折叠、B 站嵌入、tabs、剧透块
 *
 * 各组件互不依赖，均以选择器命中为前提，无对应 DOM 时零开销。
 *
 * 由 js/ink.js 入口按 import 顺序加载。
 * 块之间不共享作用域、不互相调用，只通过 DOM 与自定义事件通信。
 */

// ======================== 归档页：全部展开/收缩 ========================
(function() {
    var toggle = document.getElementById('archives-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function() {
        var months = document.querySelectorAll('.archive-month');
        var allOpen = months.length > 0;
        months.forEach(function(m) { if (!m.open) allOpen = false; });
        months.forEach(function(m) { m.open = !allOpen; });
    });
})();
// ======================== 二级菜单：触摸设备点击展开 ========================
// 桌面（hover: none 为 false）由 CSS :hover 展开，不拦截父项链接跳转；
// 触摸设备无 hover，点击父项切换 .open（CSS 展开），点击外部收起。
(function() {
    var coarse = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (!coarse) return;
    document.addEventListener('click', function(e) {
        if (e.target.closest('.mobile-drawer')) return;
        var inWrap = e.target.closest('.has-sub');
        document.querySelectorAll('.has-sub.open').forEach(function(el) {
            if (el !== inWrap) el.classList.remove('open');
        });
        var trigger = e.target.closest('.sub-trigger');
        if (!trigger) return;
        var wrap = trigger.parentElement;
        if (wrap && wrap.classList.contains('has-sub')) {
            e.preventDefault();
            wrap.classList.toggle('open');
        }
    });
})();

// ======================== 移动端汉堡导航（TD-002） ========================
(function() {
    function initMobileNav() {
        var btn = document.getElementById('menu-btn');
        var drawer = document.getElementById('mobile-drawer');
        if (!btn || !drawer) return;

        var backdrop = drawer.querySelector('.mobile-drawer__backdrop');
        var panel = drawer.querySelector('.mobile-drawer__panel');
        if (!backdrop || !panel) return;

        var focusables = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

        function openDrawer() {
            drawer.classList.add('is-open');
            drawer.setAttribute('aria-hidden', 'false');
            btn.classList.add('is-active');
            btn.setAttribute('aria-expanded', 'true');
            btn.setAttribute('aria-label', '关闭菜单');
            document.body.style.overflow = 'hidden';
            var first = panel.querySelector(focusables);
            if (first) first.focus();
        }

        function closeDrawer() {
            drawer.classList.remove('is-open');
            drawer.setAttribute('aria-hidden', 'true');
            btn.classList.remove('is-active');
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', '打开菜单');
            document.body.style.overflow = '';
            drawer.querySelectorAll('.has-sub.open').forEach(function(el) {
                el.classList.remove('open');
            });
            btn.focus();
        }

        btn.addEventListener('click', function() {
            if (drawer.classList.contains('is-open')) closeDrawer();
            else openDrawer();
        });

        backdrop.addEventListener('click', closeDrawer);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
                e.preventDefault();
                closeDrawer();
            }
            if (e.key === 'Tab' && drawer.classList.contains('is-open')) {
                var nodes = panel.querySelectorAll(focusables);
                if (!nodes.length) return;
                var first = nodes[0];
                var last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        drawer.addEventListener('click', function(e) {
            var trigger = e.target.closest('.sub-trigger');
            if (trigger && panel.contains(trigger)) {
                e.preventDefault();
                e.stopPropagation();
                var wrap = trigger.closest('.has-sub');
                if (!wrap) return;
                var wasOpen = wrap.classList.contains('open');
                panel.querySelectorAll('.has-sub.open').forEach(function(el) {
                    el.classList.remove('open');
                });
                if (!wasOpen) wrap.classList.add('open');
                return;
            }

            var link = e.target.closest('a');
            if (!link || link.classList.contains('sub-trigger')) return;
            if (link.getAttribute('href') === '#') return;
            closeDrawer();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileNav);
    } else {
        initMobileNav();
    }
})();

// ======================== Mermaid 图表（```mermaid 按需渲染） ========================
// marked 扩展（scripts/marked-mermaid.js）把 ```mermaid 代码块渲染为
// .mermaid 容器（内含源码 pre code）。本模块：
// - 页面无 .mermaid 时零开销（不加载库）；
// - 动态加载自托管 mermaid.min.js（script-src 'self' 放行，无需扩 CSP 白名单）；
// - 渲染成功后 SVG 替换容器内容，源码存 el.dataset.code 供主题切换重渲染；
// - 主题切换（theme-change 事件，偏好模块 dispatch）时按新主题全部重渲染。
(function() {
    var MERMAID_SRC = '/js/mermaid.min.js';
    var hasMermaid = !!document.querySelector('.mermaid');
    var libraryLoading = false;

    function currentTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
    }

    function renderError(err) {
        document.querySelectorAll('.mermaid').forEach(function (el) {
            if (el.querySelector('.mermaid-error')) return;
            var msg = document.createElement('p');
            msg.className = 'mermaid-error';
            msg.textContent = '图表渲染失败：' + (err && err.message ? err.message : '未知错误');
            el.appendChild(msg);
        });
        console.error('Mermaid:', err);
    }

    function loadLibrary(onload) {
        if (window.mermaid) { onload(); return; }
        if (libraryLoading) {
            // 已在加载中：轮询等待，避免重复注入脚本
            var tries = 0;
            var timer = setInterval(function () {
                tries++;
                if (window.mermaid) { clearInterval(timer); onload(); }
                else if (tries > 100) {
                    clearInterval(timer);
                    renderError(new Error('mermaid.min.js 加载超时'));
                }
            }, 100);
            return;
        }
        libraryLoading = true;
        var script = document.createElement('script');
        script.src = MERMAID_SRC;
        script.onload = function () { libraryLoading = false; onload(); };
        script.onerror = function () {
            libraryLoading = false;
            renderError(new Error('mermaid.min.js 加载失败'));
        };
        document.head.appendChild(script);
    }

    // 超宽图表保持原始尺寸（2026-08-18 修复）：mermaid 输出 svg 带
    // width="100%" + 内联 style="max-width: Npx"（N = 图表自然宽），容器窄于 N
    // 时浏览器按 min(容器, N) 渲染，整图等比缩小、节点文字无法辨认。
    // 检测自然宽 > 容器宽时改为原始尺寸，靠容器 overflow-x: auto 横向滚动；
    // 窄图保持默认行为不变。
    function fitMermaid(el) {
        var svg = el.querySelector('svg');
        if (!svg) return;
        var natural = parseFloat(svg.style.maxWidth);
        if (!natural || natural <= el.clientWidth) return;
        svg.setAttribute('width', natural + 'px');
        svg.style.maxWidth = 'none';
    }

    function renderAll(force) {
        var elements = document.querySelectorAll('.mermaid');
        if (!elements.length) return;
        if (!window.mermaid || typeof window.mermaid.render !== 'function') return;
        if (renderAll._rendering) return;
        renderAll._rendering = true;

        window.mermaid.initialize({
            startOnLoad: false,
            theme: currentTheme(),
            themeVariables: { fontFamily: 'inherit', fontSize: '15px' },
            // strict：不执行图表内的 HTML/click 指令，防注入（Twilight 用 loose，不迁移）
            securityLevel: 'strict',
            logLevel: 'error'
        });

        var tasks = [];
        elements.forEach(function (el, idx) {
            if (el.classList.contains('mermaid-rendered') && !force) return;
            var code;
            if (el.dataset.code) {
                code = el.dataset.code;
            } else {
                var srcCode = el.querySelector('code');
                if (!srcCode || !srcCode.textContent.trim()) return;
                code = srcCode.textContent;
                el.dataset.code = code;
            }
            tasks.push(window.mermaid.render('mermaid-' + idx + '-' + Date.now(), code)
                .then(function (res) {
                    el.innerHTML = res.svg;
                    el.classList.add('mermaid-rendered');
                    fitMermaid(el); // 每次渲染后（含主题切换 force 重渲染）做超宽适配
                })
                .catch(function (err) { renderError(err); }));
        });
        Promise.all(tasks).then(function () { renderAll._rendering = false; });
    }

    if (hasMermaid) {
        loadLibrary(function () { renderAll(false); });
    }
    document.addEventListener('theme-change', function () {
        if (hasMermaid) renderAll(true);
    });
    // DOMContentLoaded 兜底（极端时序下保证渲染）
    document.addEventListener('DOMContentLoaded', function () {
        if (!hasMermaid) hasMermaid = !!document.querySelector('.mermaid');
        document.querySelectorAll('.mermaid').forEach(fitMermaid);
        if (hasMermaid) loadLibrary(function () { renderAll(false); });
    });
})();

// ======================== 代码块超长折叠（2026-08-18，Reimu 批一；2026-08-23 布局修复） ========================
// 行数 = .code pre 内 <br> 数量。超阈值时用 .code-fold-viewport 裁切整表（行号列
// 与代码列同高），按钮与渐变贴在预览区底部，避免 gutter 撑满数万 px。
document.addEventListener('DOMContentLoaded', function () {
    var COLLAPSE_LINES = 40;
    document.querySelectorAll('figure.highlight').forEach(function (figure) {
        var pre = figure.querySelector('.code pre');
        if (!pre) return;
        var lines = pre.querySelectorAll('br').length;
        if (lines < COLLAPSE_LINES) return;

        var table = figure.querySelector('table');
        if (!table) return;
        var viewport = document.createElement('div');
        viewport.className = 'code-fold-viewport';
        table.parentNode.insertBefore(viewport, table);
        viewport.appendChild(table);

        figure.classList.add('code-collapsed');
        var btn = document.createElement('button');
        btn.className = 'code-fold-btn';
        btn.textContent = '展开全部（' + lines + ' 行）';
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', function () {
            var collapsed = figure.classList.toggle('code-collapsed');
            btn.textContent = collapsed ? '展开全部（' + lines + ' 行）' : '收起代码块';
            btn.setAttribute('aria-expanded', String(!collapsed));
        });
        figure.appendChild(btn);
    });
});

// ======================== B 站懒嵌入（2026-08-23，Butterfly 批二迁移） ========================
// marked-bilibili.js 输出 .bili-embed 占位；进入视口或点击后注入 sandbox iframe。
(function () {
    function mountBiliEmbed(root) {
        if (!root || root.dataset.biliLoaded === '1') return;
        var src = root.getAttribute('data-bili-src');
        if (!src) return;
        var frameWrap = root.querySelector('.bili-embed-frame');
        var trigger = root.querySelector('.bili-embed-trigger');
        if (!frameWrap) return;

        var iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = 'Bilibili 视频播放器';
        iframe.loading = 'lazy';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute(
            'sandbox',
            'allow-scripts allow-same-origin allow-presentation allow-popups'
        );
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        frameWrap.innerHTML = '';
        frameWrap.appendChild(iframe);
        frameWrap.hidden = false;
        if (trigger) trigger.hidden = true;
        root.dataset.biliLoaded = '1';
    }

    function initBiliEmbeds() {
        var nodes = document.querySelectorAll('.bili-embed:not([data-bili-loaded])');
        if (!nodes.length) return;

        nodes.forEach(function (root) {
            var trigger = root.querySelector('.bili-embed-trigger');
            if (trigger) {
                trigger.addEventListener('click', function () {
                    mountBiliEmbed(root);
                });
            }
        });

        if (!('IntersectionObserver' in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    mountBiliEmbed(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '120px 0px', threshold: 0.01 });
        nodes.forEach(function (root) {
            if (root.dataset.biliLoaded !== '1') io.observe(root);
        });
    }

    document.addEventListener('DOMContentLoaded', initBiliEmbeds);
})();

// ======================== 标签页 tabs 切换（2026-08-18，Reimu 批二迁移） ========================
// scripts/marked-tabs.js 渲染 .tabs（nav 按钮 + 面板），本模块事件委托切换
// is-active / aria-selected。无框架依赖；页面无 .tabs 时零开销（事件委托挂 document）。
document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.tabs-tab') : null;
    if (!btn) return;
    var root = btn.closest('.tabs');
    if (!root) return;
    var idx = btn.getAttribute('data-tab');
    root.querySelectorAll('.tabs-tab').forEach(function (b) {
        var active = b.getAttribute('data-tab') === idx;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    root.querySelectorAll('.tabs-panel').forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-tab') === idx);
    });
});

// ======================== 剧透块 md-text（拍板 M2） ========================
document.addEventListener('click', function (e) {
    var root = e.target && e.target.closest ? e.target.closest('.md-text') : null;
    if (!root) return;
    root.classList.toggle('is-revealed');
});
