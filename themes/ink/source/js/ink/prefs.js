/*
 * 偏好设置：主题 / 字体 / 首页列数
 *
 * 偏好存 localStorage，由 /settings/ 页控件与 header 切换按钮读写；同时把主题同步给 giscus。
 *
 * 由 js/ink.js 入口按 import 顺序加载。
 * 块之间不共享作用域、不互相调用，只通过 DOM 与自定义事件通信。
 */

// ======================== 偏好设置：主题 & 字体 ========================
// 设置项存 localStorage，由 /settings/ 页控件修改。
// 脚本为 defer，HTML 解析完成后立即应用偏好，尽可能减少闪烁。
(function() {
    var GISCUS_ORIGIN = 'https://giscus.app';
    var giscusReady = false;
    var pendingGiscusTheme = null;

    function giscusThemeName(actual) {
        return actual === 'dark' ? 'dark' : 'light';
    }

    /** 在 giscus client.js 执行前写入 data-theme，避免首屏闪色 */
    function syncGiscusScriptTheme(actual) {
        var script = document.querySelector('script[src*="giscus.app/client.js"]');
        if (script) {
            script.setAttribute('data-theme', giscusThemeName(actual));
        }
    }

    function sendGiscusTheme(theme) {
        pendingGiscusTheme = theme;
        if (!giscusReady) return;
        var iframe = document.querySelector('iframe.giscus-frame');
        if (!iframe || !iframe.contentWindow) return;
        try {
            iframe.contentWindow.postMessage({
                giscus: { setConfig: { theme: theme } }
            }, GISCUS_ORIGIN);
            pendingGiscusTheme = null;
        } catch (e) { /* iframe 未就绪 */ }
    }

    window.addEventListener('message', function (event) {
        if (event.origin !== GISCUS_ORIGIN) return;
        if (!event.data || typeof event.data !== 'object' || !event.data.giscus) return;
        giscusReady = true;
        if (pendingGiscusTheme !== null) {
            sendGiscusTheme(pendingGiscusTheme);
        }
    });

    function giscusTheme(actual) {
        var theme = giscusThemeName(actual);
        syncGiscusScriptTheme(actual);
        sendGiscusTheme(theme);
    }

    // 主题偏好：auto（跟随系统）/ light / dark
    function resolveTheme(pref) {
        if (pref === 'dark' || pref === 'light') return pref;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(pref) {
        var actual = resolveTheme(pref);
        if (actual === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        giscusTheme(actual);
        // 通知依赖主题的组件（mermaid 图表按新主题重渲染）
        document.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: actual } }));
    }

    // 字体偏好：lxgw（默认）/ system / hywenhei
    function applyFont(pref) {
        if (pref === 'system' || pref === 'hywenhei') {
            document.documentElement.setAttribute('data-font', pref);
        } else {
            document.documentElement.removeAttribute('data-font');
        }
    }

    // 首页列数偏好：auto（默认，响应式：宽屏 3 列/平板 2 列/手机 1 列）或 '1'-'4'（全端统一）
    // 实现：在 .blog-posts 上写 --cols，CSS 侧 width 用 var(--cols, 断点默认值)，
    // 未设置时各断点取各自兜底（现状），设置了则所有媒体查询内都解析为设置值（全端跟随）。
    function applyColumns(pref) {
        var list = document.querySelector('.blog-posts');
        if (!list) return;
        if (localStorage.getItem('ink-home-layout') === 'list') {
            list.style.removeProperty('--cols');
            return;
        }
        if (pref === '1' || pref === '2' || pref === '3' || pref === '4') {
            list.style.setProperty('--cols', pref);
        } else {
            // auto 或非法值：回退响应式现状
            list.style.removeProperty('--cols');
        }
    }

    var storedTheme = localStorage.getItem('theme-preference') || 'auto';
    var storedFont = localStorage.getItem('font-preference') || 'lxgw';
    var storedColumns = localStorage.getItem('columns-preference') || 'auto';

    applyTheme(storedTheme);
    applyFont(storedFont);
    applyColumns(storedColumns);

    // 设置页控件绑定（无控件时静默跳过）
    document.addEventListener('DOMContentLoaded', function() {
        var themeRadios = document.querySelectorAll('input[name="theme"]');
        for (var i = 0; i < themeRadios.length; i++) {
            (function(r) {
                r.checked = r.value === storedTheme;
                r.addEventListener('change', function() {
                    if (!r.checked) return;
                    storedTheme = r.value;
                    localStorage.setItem('theme-preference', storedTheme);
                    applyTheme(storedTheme);
                });
            })(themeRadios[i]);
        }

        // header 日/月切换按钮：与上方 radio 同构，读写同一 theme-preference。
        // auto 偏好下按钮显示当前实际主题，点击则显式切到相反值（写死偏好）。
        var toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            var syncToggleBtn = function () {
                toggleBtn.setAttribute('aria-checked',
                    String(resolveTheme(storedTheme) === 'dark'));
            };
            toggleBtn.addEventListener('click', function () {
                var next = resolveTheme(storedTheme) === 'dark' ? 'light' : 'dark';
                storedTheme = next;
                localStorage.setItem('theme-preference', storedTheme);
                applyTheme(storedTheme);
            });
            document.addEventListener('theme-change', syncToggleBtn);
            syncToggleBtn();
        }

        var fontRadios = document.querySelectorAll('input[name="font"]');
        for (var j = 0; j < fontRadios.length; j++) {
            (function(r) {
                r.checked = r.value === storedFont;
                r.addEventListener('change', function() {
                    if (!r.checked) return;
                    storedFont = r.value;
                    localStorage.setItem('font-preference', storedFont);
                    applyFont(storedFont);
                });
            })(fontRadios[j]);
        }

        var columnsRadios = document.querySelectorAll('input[name="columns"]');
        for (var k = 0; k < columnsRadios.length; k++) {
            (function(r) {
                r.checked = r.value === storedColumns;
                r.addEventListener('change', function() {
                    if (!r.checked) return;
                    storedColumns = r.value;
                    localStorage.setItem('columns-preference', storedColumns);
                    applyColumns(storedColumns);
                });
            })(columnsRadios[k]);
        }
    });
})();
