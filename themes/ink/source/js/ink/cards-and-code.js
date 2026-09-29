/*
 * GitHub 仓库卡片数据与代码块一键复制
 *
 * 卡片用 GitHub API 补 stars/forks 等，限流时静默保留静态内容；复制按钮取 .code pre 文本。
 *
 * 由 js/ink.js 入口按 import 顺序加载。
 * 块之间不共享作用域、不互相调用，只通过 DOM 与自定义事件通信。
 */

// ======================== GitHub 仓库卡片数据 ========================
// 卡片由 marked 扩展静态渲染（owner/repo/链接/可选 desc），本模块用
// GitHub API 补充 stars/forks/language/license 与 description（无静态
// desc 时）。CSP connect-src 已放行 api.github.com（唯一第三方 fetch
// 例外，见 SECURITY.md）。无 token 限流 60 次/小时/IP：localStorage
// 缓存 1 小时；请求失败（限流/网络）静默保留静态内容，渐进增强。
(function() {
    var CARDS = document.querySelectorAll('a.card-github[data-repo]');
    if (!CARDS.length) return;

    var CACHE_TTL = 3600000; // 1 小时

    function getRepoData(repo) {
        var key = 'gh-repo-cache:' + repo;
        try {
            var hit = localStorage.getItem(key);
            if (hit) {
                var parsed = JSON.parse(hit);
                if (parsed && parsed.ts && Date.now() - parsed.ts < CACHE_TTL) {
                    return Promise.resolve(parsed.data);
                }
            }
        } catch (e) { /* 缓存不可用则直接请求 */ }
        // 注意：不能整串 encodeURIComponent(repo)——"/" 变 %2F 后 GitHub API
        // 不返回 CORS 头，预检被拒（2026-08-17 实测）；owner/repo 各段编码
        // （GitHub 命名规则字母数字 . _ -，编码结果与原值一致）
        return fetch('https://api.github.com/repos/' + repo.split('/').map(encodeURIComponent).join('/'))
            .then(function (res) {
                if (!res.ok) throw new Error('GitHub API ' + res.status);
                return res.json();
            })
            .then(function (data) {
                try {
                    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data }));
                } catch (e) { /* 存储失败忽略 */ }
                return data;
            });
    }

    function fmt(n) {
        if (typeof n !== 'number') return '';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(n);
    }

    function setText(el, text) {
        if (el && text) el.textContent = text;
    }

    CARDS.forEach(function (card) {
        var repo = card.getAttribute('data-repo');
        getRepoData(repo).then(function (data) {
            // data.message 为 API 错误响应（如仓库不存在/被限流时仍 200 的 404 响应）
            if (!data || data.message) return;
            setText(card.querySelector('.gc-stars'), 'stars ' + fmt(data.stargazers_count));
            setText(card.querySelector('.gc-forks'), 'forks ' + fmt(data.forks_count));
            setText(card.querySelector('.gc-language'), 'lang ' + data.language);
            setText(card.querySelector('.gc-license'), data.license && data.license.spdx_id);
            // 静态 desc 优先（语法 desc 有值则不动），无静态 desc 时用 API 描述
            var descEl = card.querySelector('.gc-description');
            if (descEl && !descEl.textContent.trim() && data.description) {
                descEl.textContent = data.description;
            }
        }).catch(function (err) {
            // 限流/网络失败：静默保留静态内容（渐进增强）
            console.warn('GitHub card data unavailable for ' + repo + ':', err.message);
        });
    });
})();

// ======================== 代码块一键复制 ========================
// Hexo 8 highlight.js 输出结构：<figure class="highlight"><table>
//   <td class="gutter"><pre>行号</pre></td><td class="code"><pre><span class="line">代码</span><br>...</pre></td>
// 复制内容取 .code pre 的文本；行分隔是 <br>，textContent 不含 br，需手工拼接换行。
document.addEventListener('DOMContentLoaded', function () {
    // 递归提取代码文本：克隆后把 <br> 换成换行文本节点再取 textContent，
    // 兼容 hljs: true 后 <br> 嵌套在 <code> 内部的结构（textContent 不含 br）。
    function getCodeText(pre) {
        var clone = pre.cloneNode(true);
        clone.querySelectorAll('br').forEach(function (br) {
            br.replaceWith(document.createTextNode('\n'));
        });
        return clone.textContent;
    }

    function bindCopy(pre) {
        if (!pre || pre.querySelector('.copy-btn')) return;

        var btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = '复制';
        btn.setAttribute('aria-label', '复制代码');

        btn.addEventListener('click', function () {
            var text = getCodeText(pre).replace(/^\n+/, '').replace(/\n+$/, '');
            function done() {
                btn.textContent = '已复制!';
                btn.classList.add('copied');
                setTimeout(function () {
                    btn.textContent = '复制';
                    btn.classList.remove('copied');
                }, 2000);
            }
            function fail() {
                btn.textContent = '复制失败';
                setTimeout(function () { btn.textContent = '复制'; }, 2000);
            }
            function legacyCopy() {
                try {
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    done();
                } catch (e) {
                    fail();
                }
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(legacyCopy);
            } else {
                legacyCopy();
            }
        });

        // 让 pre 成为相对定位容器
        pre.style.position = 'relative';
        pre.appendChild(btn);
    }

    // Hexo 8 highlight 结构：按钮挂到代码列 pre（gutter 列无代码，不处理）
    document.querySelectorAll('figure.highlight').forEach(function (figure) {
        var codePre = figure.querySelector('.code pre');
        if (codePre) bindCopy(codePre);
    });
    // 兜底：figure 外的裸 <pre><code>（非 hexo highlight 结构）
    document.querySelectorAll('pre').forEach(function (pre) {
        if (pre.closest('figure.highlight')) return;
        if (pre.closest('.mermaid')) return; // mermaid 源码容器（渲染后即替换为 SVG）
        if (pre.querySelector('code')) bindCopy(pre);
    });
});
