// 最新评论挂件（2026-08-18 移植自 SanYeCao-blog LatestComments，数据源改 GitHub REST）
// 位于文章页 giscus 评论区下方，低调展示最近互动。
// 关键决策：
// - GitHub GraphQL API 需 token（匿名不可用），故用 REST（public repo 匿名可用，
//   60req/h 限流）+ localStorage 缓存 30 分钟消解限流；
// - 评论 body 是 Markdown：纯文本化 + 截断，只输出转义文本，不做 HTML 渲染
//   （防 DOM XSS，与 search.js 同纪律）；
// - 限流/网络失败静默降级，不打扰阅读。
(function () {
    'use strict';

    var MAX_SHOW = 8;            // 展示条数
    var DISCUSSIONS = 10;        // 拉取的最近讨论数（每讨论取 1 条最新评论）
    var CACHE_TTL = 30 * 60 * 1000;

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function fmtTime(iso) {
        try {
            var d = new Date(iso);
            var diff = (Date.now() - d.getTime()) / 1000;
            if (diff < 60) return '刚刚';
            if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
            if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
            if (diff < 86400 * 30) return Math.floor(diff / 86400) + ' 天前';
            var y = d.getFullYear();
            var m = String(d.getMonth() + 1).padStart(2, '0');
            var dd = String(d.getDate()).padStart(2, '0');
            return y + '/' + m + '/' + dd;
        } catch (e) { return ''; }
    }

    // Markdown 评论体纯文本化：代码块/图片/链接/标记符号剥离后截断
    function snippet(md) {
        var t = String(md || '')
            .replace(/```[\s\S]*?```/g, ' ')
            .replace(/`([^`]*)`/g, '$1')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/[#>*_~|-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return t.length > 90 ? t.slice(0, 90) + '...' : t;
    }

    function cacheKey(repo) { return 'latest-comments:' + repo; }

    function readCache(repo) {
        try {
            var raw = localStorage.getItem(cacheKey(repo));
            if (!raw) return null;
            var item = JSON.parse(raw);
            if (!item || !item.ts || Date.now() - item.ts > CACHE_TTL) return null;
            return item.items;
        } catch (e) { return null; }
    }

    function writeCache(repo, items) {
        try {
            localStorage.setItem(cacheKey(repo), JSON.stringify({ ts: Date.now(), items: items }));
        } catch (e) { /* 隐私模式等场景忽略 */ }
    }

    function fetchJson(url) {
        return fetch(url, { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }

    function render(list, items) {
        if (!items || !items.length) {
            list.innerHTML = '<p class="latest-comments-empty">还没有评论</p>';
            return;
        }
        list.innerHTML = items.map(function (c) {
            var avatar = c.avatar || '';
            var avatarHtml = avatar
                ? '<img class="lc-avatar" src="' + escapeHtml(avatar) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />'
                : '<span class="lc-avatar lc-avatar-fallback" aria-hidden="true">' + escapeHtml((c.author || '匿').slice(0, 1)) + '</span>';
            return '<article class="lc-item">' +
                avatarHtml +
                '<div class="lc-body">' +
                '<div class="lc-meta">' +
                '<span class="lc-author">' + escapeHtml(c.author || '匿名用户') + '</span>' +
                (c.time ? '<time class="lc-time">' + escapeHtml(c.time) + '</time>' : '') +
                '</div>' +
                '<p class="lc-text">' + escapeHtml(snippet(c.body)) + '</p>' +
                '<a class="lc-post" href="' + escapeHtml(c.url) + '" target="_blank" rel="noopener noreferrer">' +
                escapeHtml(c.postTitle) + '</a>' +
                '</div></article>';
        }).join('');
    }

    function load(section) {
        var repo = section.getAttribute('data-github-repo');
        var list = section.querySelector('.latest-comments-list');
        if (!repo || !list) return;

        var cached = readCache(repo);
        if (cached) { render(list, cached); return; }

        var parts = repo.split('/');
        if (parts.length !== 2) return;
        var owner = parts[0];
        var name = parts[1];

        fetchJson('https://api.github.com/repos/' + owner + '/' + name +
            '/discussions?sort=updated&direction=desc&per_page=' + DISCUSSIONS)
            .then(function (discussions) {
                if (!Array.isArray(discussions) || !discussions.length) {
                    render(list, []);
                    return [];
                }
                return Promise.all(discussions.map(function (d) {
                    return fetchJson('https://api.github.com/repos/' + owner + '/' + name +
                        '/discussions/' + d.number + '/comments?sort=updated&direction=desc&per_page=1')
                        .then(function (comments) {
                            var c = comments && comments[0];
                            if (!c) return null;
                            return {
                                author: c.user ? c.user.login : '',
                                avatar: c.user ? c.user.avatar_url : '',
                                body: c.body || '',
                                url: c.html_url || d.html_url,
                                postTitle: d.title || '',
                                time: fmtTime(c.created_at)
                            };
                        });
                }));
            })
            .then(function (items) {
                var valid = (items || []).filter(Boolean).slice(0, MAX_SHOW);
                writeCache(repo, valid);
                render(list, valid);
            })
            .catch(function () {
                // 限流/网络失败：静默降级，不打扰阅读
                list.innerHTML = '';
                var p = document.createElement('p');
                p.className = 'latest-comments-empty';
                p.textContent = '评论加载失败';
                list.appendChild(p);
            });
    }

    document.querySelectorAll('.latest-comments[data-github-repo]').forEach(load);
})();
