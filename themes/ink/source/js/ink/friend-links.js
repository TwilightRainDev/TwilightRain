/*
 * 友链：主站可用性探测与头像回退
 *
 * 默认 href 指向 fallback，探测主站恢复后切回；头像加载失败回退为首字。
 *
 * 由 js/ink.js 入口按 import 顺序加载。
 * 块之间不共享作用域、不互相调用，只通过 DOM 与自定义事件通信。
 */

// ======================== 友链主站可用性探测 ========================
// 友链默认 href 指向 fallback（主站 DNS 不可达时保证可访问）。
// 用 Image() 探测主站 favicon：img-src 允许 https，不受 CSP connect-src
// 限制（fetch 会被 connect-src 'self' 拦截，不能用于探测）。
// 探测成功（主站恢复）→ 把链接切回主站；失败 → 保持 fallback。
(function() {
    var links = document.querySelectorAll('a[data-probe]');
    links.forEach(function(a) {
        var probeUrl = a.getAttribute('data-probe');
        var img = new Image();
        img.onload = function() {
            a.href = probeUrl;
            a.classList.add('link-probed-live');
        };
        img.onerror = function() {
            // 主站不可达，保持 fallback href
        };
        img.src = probeUrl + '/favicon.ico';
    });
})();

// 友链头像加载失败时回退为首字（外链 favicon 防盗链等）
(function() {
    document.querySelectorAll('.link-avatar').forEach(function(img) {
        if (img.dataset.fallbackReady) return;
        img.dataset.fallbackReady = '1';
        img.addEventListener('error', function onErr() {
            img.removeEventListener('error', onErr);
            if (img.classList.contains('link-avatar-fallback')) return;
            var name = img.getAttribute('alt') || '?';
            var span = document.createElement('span');
            span.className = 'link-avatar link-avatar-fallback';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = name.trim().slice(0, 1) || '?';
            img.replaceWith(span);
        });
    });
})();
