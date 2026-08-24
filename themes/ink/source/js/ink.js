document.addEventListener('DOMContentLoaded', function () {
    const mainContent = document.querySelector('article');
    if (mainContent) {
        mainContent.querySelectorAll('img').forEach(img => {
            // 卡片/网格/头图等组件内图片不做 article-image 取色包裹（会破坏布局并误藏图）
            if (img.closest(
                'a.card-site, a.card-intro, .photo-grid, .md-grid, .site-group, a.card-github, a.card-link, .post-imgcard'
            )) {
                return;
            }

            const title = img.getAttribute('title');
            const alt = img.getAttribute('alt');

            if (title === null && alt === null) {
                return;
            }

            img.crossOrigin = 'anonymous';

            const customElement = document.createElement('div');
            customElement.setAttribute('class', 'article-image');
            customElement.style.display = 'none';

            const figcaption = document.createElement('figcaption');
            figcaption.setAttribute('class', 'image-info');

            if (alt) {
                const altElement = document.createElement('span');
                altElement.setAttribute('class', 'image-alt');
                altElement.textContent = alt;
                figcaption.appendChild(altElement);
            }

            if (title) {
                const titleElement = document.createElement('span');
                titleElement.setAttribute('class', 'image-title');
                titleElement.textContent = title;
                figcaption.appendChild(titleElement);
            }

            img.parentNode.insertBefore(customElement, img);
            customElement.appendChild(img);
            customElement.appendChild(figcaption);

            function revealImage() {
                customElement.style.display = 'inline-block';
                const canvas = document.createElement('canvas');
                const rgbColor = getImageColor(canvas, img);
                figcaption.style.backgroundColor = rgbColor;
            }

            img.addEventListener('load', revealImage);

            img.addEventListener('error', function () {
                customElement.remove();
            });

            // 缓存图或 lazy 已解码时 load 不再触发，避免永久 display:none
            if (img.complete && img.naturalWidth) {
                revealImage();
            }
        });
    }

    function getImageColor(canvas, img) {
        // 降采样后再取色，避免全分辨率扫像素卡主线程
        var maxSide = 64;
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var scale = Math.min(1, maxSide / Math.max(w, h, 1));
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));

        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        var r = 0, g = 0, b = 0;
        var pixelCount = canvas.width * canvas.height;
        for (var i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        return 'rgba(' + r + ', ' + g + ', ' + b + ',0.4)';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // 首页无 cover：封面池使用 360px 展示图；data-ori 指向同名原图
    // 加新封面：原图放 source/img/ori/covers/cover-NN.jpg，构建生成 360px，并同步更新循环上界
    const coverPool = [];
    for (let i = 1; i <= 26; i++) {
        coverPool.push('/img/360px/covers/cover-' + (i < 10 ? '0' + i : i) + '.jpg');
    }
    document.querySelectorAll('img[data-random-cover]').forEach(img => {
        var src = coverPool[Math.floor(Math.random() * coverPool.length)];
        img.src = src;
        img.setAttribute('data-ori', src.replace('/img/360px/', '/img/ori/'));
    });

    const thumbnails = document.querySelectorAll('.thumbnail');

    thumbnails.forEach(img => {
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const rgbColor = getImageColor(canvas, img);
            const articleItem = img.closest('.article-item');
            const articleInfo = articleItem.querySelector('.article-info');
            articleInfo.style.backgroundColor = rgbColor;
        };

        img.addEventListener('error', function () {
            console.error(`Failed to load image: ${img.src}`);
        });
    });

    function getImageColor(canvas, img) {
        var maxSide = 64;
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var scale = Math.min(1, maxSide / Math.max(w, h, 1));
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));

        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const colorCounts = {};

        for (let i = 0; i < data.length; i += 4) {
            // 量化到 16 级，减少 Map 体积
            const r = data[i] & 0xf0;
            const g = data[i + 1] & 0xf0;
            const b = data[i + 2] & 0xf0;
            const rgb = 'rgba(' + r + ',' + g + ',' + b + ',0.4)';
            colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        }

        let dominantColor = '';
        let maxCount = 0;
        for (const color in colorCounts) {
            if (colorCounts[color] > maxCount) {
                maxCount = colorCounts[color];
                dominantColor = color;
            }
        }
        return dominantColor;
    }
});

// ======================== 偏好设置：主题 & 字体 ========================
// 设置项存 localStorage，由 /settings/ 页控件修改。
// 脚本为 defer，HTML 解析完成后立即应用偏好，尽可能减少闪烁。
(function() {
    function giscusTheme(actual) {
        var theme = actual === 'dark' ? 'dark' : 'light';
        var sync = function () {
            var giscus = document.querySelector('iframe.giscus-frame');
            if (giscus) {
                giscus.contentWindow.postMessage({
                    giscus: { setConfig: { theme: theme } }
                }, 'https://giscus.app');
            }
        };
        sync();
        // giscus iframe 异步加载，晚些再同步一次
        setTimeout(sync, 2000);
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

// ======================== 返回顶部 ========================
(function() {
    var btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.textContent = '↑';
    btn.setAttribute('aria-label', '返回顶部');
    document.body.appendChild(btn);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ======================== 阅读进度条 ========================
(function() {
    var bar = document.createElement('div');
    bar.id = 'reading-progress';
    document.body.appendChild(bar);

    window.addEventListener('scroll', function() {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
            var progress = Math.min(scrollTop / docHeight * 100, 100);
            bar.style.width = progress + '%';
        }
    });
})();

// ======================== 文章目录 TOC ========================
(function() {
    var article = document.querySelector('article');
    if (!article) return;

    var headings = article.querySelectorAll('h2, h3');
    if (headings.length < 2) return;

    // 确保每个标题有 id
    headings.forEach(function(h) {
        if (!h.id) {
            h.id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-|-$/g, '');
        }
    });

    var toc = document.createElement('div');
    toc.className = 'post-toc';

    var header = document.createElement('div');
    header.className = 'toc-header';
    var label = document.createElement('span');
    label.className = 'toc-label';
    label.textContent = '目录';
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'toc-toggle';
    toggleBtn.textContent = '[折叠]';
    toggleBtn.setAttribute('aria-label', '折叠目录');
    header.appendChild(label);
    header.appendChild(toggleBtn);
    toc.appendChild(header);

    var list = document.createElement('ol');
    list.className = 'toc-list';

    var currentH2Li = null;
    var sublist = null;

    headings.forEach(function(h) {
        var tag = h.tagName;
        var li = document.createElement('li');
        li.className = 'toc-item toc-' + tag.toLowerCase();
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);

        if (tag === 'H2') {
            if (sublist && currentH2Li) {
                currentH2Li.appendChild(sublist);
                sublist = null;
            }
            list.appendChild(li);
            currentH2Li = li;
        } else if (tag === 'H3') {
            if (!sublist && currentH2Li) {
                sublist = document.createElement('ol');
                sublist.className = 'toc-sublist';
                sublist.appendChild(li);
            } else if (sublist) {
                sublist.appendChild(li);
            } else {
                list.appendChild(li);
            }
        }
    });

    if (sublist && currentH2Li) {
        currentH2Li.appendChild(sublist);
    }

    toc.appendChild(list);
    // 优先移入文章页的 .post-toc-slot（banner→TOC 双卡布局），无 slot 时退回旧行为
    var tocSlot = document.querySelector('.post-toc-slot');
    var tocMobilePanel = document.querySelector('.post-toc-mobile-panel');
    var tocMobileToggle = document.querySelector('.post-toc-mobile-toggle');
    var tocMobilePreview = tocMobileToggle ? tocMobileToggle.querySelector('[data-toc-preview]') : null;

    // 移动端胶囊 TOC（2026-08-18 移植自 SanYeCao-blog）：
    // <768px 时 toc 移入悬浮面板，桌面时移回 slot 双卡，resize 跨界自动迁移。
    var isMobileToc = function () { return window.matchMedia('(max-width: 767px)').matches; };
    var placeToc = function () {
        if (isMobileToc() && tocMobilePanel) {
            if (toc.parentNode !== tocMobilePanel) tocMobilePanel.appendChild(toc);
            if (tocMobileToggle) tocMobileToggle.hidden = false;
        } else if (tocSlot) {
            if (toc.parentNode !== tocSlot) tocSlot.appendChild(toc);
            if (tocMobileToggle) tocMobileToggle.hidden = true;
            syncTocHeight();
        }
    };

    // 目录卡高度与图卡等高（height 同步）：目录内容少于图卡高时
    // 填充留白（等高卡片），内容超出时卡片内滚动（overflow-y: auto）。
    // 图片解码完成、窗口缩放等任何图卡高度变化都由 ResizeObserver
    // 同步（img 未解码时高度会塌陷，RO 在解码完成后自动修正；
    // h > 0 防止图片加载失败时目录卡高度归零；移动端胶囊模式不设高）。
    var imgcard = tocSlot ? document.querySelector('.post-imgcard') : null;
    var syncTocHeight = function () {
        if (isMobileToc()) { toc.style.height = ''; return; }
        if (!imgcard) return;
        var h = imgcard.offsetHeight;
        if (h > 0) toc.style.height = h + 'px';
    };

    if (tocSlot) {
        placeToc();
        if (imgcard) {
            syncTocHeight();
            if (typeof ResizeObserver !== 'undefined') {
                new ResizeObserver(syncTocHeight).observe(imgcard);
            }
        }
    } else {
        article.insertBefore(toc, article.firstChild);
    }

    // resize 跨界迁移 + 高度同步（防抖 100ms，复用原同步节奏）
    window.addEventListener('resize', function () {
        clearTimeout(syncTocHeight._timer);
        syncTocHeight._timer = setTimeout(function () {
            placeToc();
            syncTocHeight();
        }, 100);
    });

    // 移动端胶囊：按钮展开/收起面板，点击面板外关闭
    if (tocMobileToggle && tocMobilePanel) {
        tocMobileToggle.addEventListener('click', function () {
            var open = tocMobilePanel.classList.toggle('is-open');
            tocMobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', function (e) {
            if (tocMobilePanel.classList.contains('is-open') &&
                !tocMobilePanel.contains(e.target) && !tocMobileToggle.contains(e.target)) {
                tocMobilePanel.classList.remove('is-open');
                tocMobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
        // 滚动 80px 后显示按钮（移动端），顶部隐藏并收起面板
        var onTocScroll = function () {
            if (!isMobileToc() || !tocMobileToggle) return;
            var show = window.scrollY > 80;
            tocMobileToggle.classList.toggle('is-visible', show);
            if (!show) {
                tocMobilePanel.classList.remove('is-open');
                tocMobileToggle.setAttribute('aria-expanded', 'false');
            }
        };
        window.addEventListener('scroll', onTocScroll, { passive: true });
        onTocScroll();
    }

    // 折叠/展开
    toggleBtn.addEventListener('click', function() {
        list.classList.toggle('collapsed');
        toggleBtn.textContent = list.classList.contains('collapsed') ? '[展开]' : '[折叠]';
    });

    // 点击平滑滚动（移动端胶囊面板内点击后收起面板）
    toc.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (link && link.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            var targetId = link.getAttribute('href').slice(1);
            var target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                toc.querySelectorAll('.toc-item.active').forEach(function(el) { el.classList.remove('active'); });
                var parentLi = link.closest('.toc-item');
                if (parentLi) parentLi.classList.add('active');
                if (tocMobilePanel) {
                    tocMobilePanel.classList.remove('is-open');
                    if (tocMobileToggle) tocMobileToggle.setAttribute('aria-expanded', 'false');
                }
            }
        }
    });

    // 滚动时高亮当前章节（并同步移动端胶囊按钮的标题预览）
    var callback = function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var id = entry.target.id;
                toc.querySelectorAll('.toc-item.active').forEach(function(el) { el.classList.remove('active'); });
                var activeA = toc.querySelector('a[href="#' + id + '"]');
                if (activeA) {
                    var activeLi = activeA.closest('.toc-item');
                    if (activeLi) activeLi.classList.add('active');
                    if (tocMobilePreview) tocMobilePreview.textContent = activeA.textContent;
                }
            }
        });
    };
    var observer = new IntersectionObserver(callback, { rootMargin: '-60px 0px -70% 0px' });
    headings.forEach(function(h) { observer.observe(h); });
})();

// ======================== 悬停资料卡 (关于页彩蛋) ========================
(function() {
    const nameEl = document.getElementById('twilight-rain-name');
    if (!nameEl) return;

    let cardEl = null;
    let showTimer = null;
    let hideTimer = null;

    function createCard() {
        var card = document.createElement('div');
        card.id = 'hover-card';

        var content = document.createElement('div');
        content.className = 'hover-card-content';

        var title = document.createElement('div');
        title.className = 'hover-card-title';
        title.textContent = '成分复杂';

        var list = document.createElement('ul');
        list.className = 'hover-card-list';
        var items = [
            { label: '出身与信仰：', text: '键っ子出身，后遗症至今未愈；附加属性为"月厨失格"。' },
            { label: '动画与文库：', text: '千禧动画年鉴（人形禁书目录），判定新番标准为"厕纸三集定生死"。' },
            { label: '游戏日常：', text: '手游侧专注日课周回搬砖；PC侧沉迷P社四萌，自称时间刺客。' },
            { label: '同人/音乐向：', text: '东方全人物辨识度取决于出题人深度；V家周刊苦手，但脑内再生曲库存足以开十场拼盘。' },
            { label: '技术产出：', text: 'GitHub仓库仅限自嗨项目，无开源贡献。' },
            { label: '社交人格：', text: '电波系废物，社交互动全靠弹幕共感。' },
            { label: '结语：', text: '综上，活化石萨卡萨卡班班甲鱼鱼，请多指教。' }
        ];
        for (var i = 0; i < items.length; i++) {
            var li = document.createElement('li');
            var strong = document.createElement('strong');
            strong.textContent = items[i].label;
            li.appendChild(strong);
            li.appendChild(document.createTextNode(items[i].text));
            list.appendChild(li);
        }

        var sig = document.createElement('div');
        sig.className = 'hover-card-signature';
        sig.textContent = '—— 签名档：绝赞绝赞绝赞绝赞中';

        content.appendChild(title);
        content.appendChild(list);
        content.appendChild(sig);
        card.appendChild(content);

        // Card hover events
        card.addEventListener('mouseenter', function() {
            clearTimeout(hideTimer);
        });
        card.addEventListener('mouseleave', function() {
            hideTimer = setTimeout(function() {
                card.classList.remove('visible');
            }, 200);
        });

        document.body.appendChild(card);
        return card;
    }

    function getCard() {
        if (!cardEl) cardEl = createCard();
        return cardEl;
    }

    nameEl.addEventListener('mouseenter', function() {
        clearTimeout(hideTimer);
        showTimer = setTimeout(function() {
            var card = getCard();
            var rect = nameEl.getBoundingClientRect();
            var cardWidth = 320;
            var left = rect.left;
            if (left + cardWidth > window.innerWidth - 10) {
                left = window.innerWidth - cardWidth - 10;
            }
            if (left < 10) left = 10;
            card.style.left = left + 'px';
            card.style.top = (rect.bottom + 6) + 'px';
            card.classList.add('visible');
        }, 300);
    });

    nameEl.addEventListener('mouseleave', function(e) {
        clearTimeout(showTimer);
        if (cardEl && e.relatedTarget && (e.relatedTarget === cardEl || cardEl.contains(e.relatedTarget))) {
            return;
        }
        hideTimer = setTimeout(function() {
            if (cardEl) cardEl.classList.remove('visible');
        }, 200);
    });
})();

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

// ======================== 文章内图片灯箱 ========================
// 给 article 内 img 加 data-fancybox；展示图为 360px，data-ori 指向原图。
// 文章页头图卡（.post-imgcard）同样支持放大。
(function() {
    function ensureOri(el) {
        if (el.getAttribute('data-ori')) return;
        var src = el.getAttribute('src') || '';
        if (src.indexOf('/img/360px/') !== -1) {
            el.setAttribute('data-ori', src.replace('/img/360px/', '/img/ori/'));
        }
    }
    var article = document.querySelector('article');
    if (article) {
        article.querySelectorAll('img').forEach(function(img) {
            ensureOri(img);
            img.setAttribute('data-fancybox', 'article');
        });
    }
    document.querySelectorAll('.post-imgcard img').forEach(function(img) {
        ensureOri(img);
        img.setAttribute('data-fancybox', 'article');
    });
})();

// ======================== fancybox「查看原图」+ 关闭后恢复头图 ========================
// 灯箱内仍显示 360px；左上角按钮新标签打开 data-ori。
// fancybox 3.5.7 对直接 <img> 触发会把原图移进灯箱并残留 display:none，afterClose 恢复。
(function() {
    if (!window.jQuery) return;
    var $ = window.jQuery;

    function resolveOriUrl(instance, current) {
        var ori = '';
        if (current && current.opts && current.opts.$orig && current.opts.$orig.length) {
            var el = current.opts.$orig[0];
            ori = el.getAttribute('data-ori') || '';
            if (!ori && el.closest) {
                var host = el.closest('[data-ori]');
                if (host) ori = host.getAttribute('data-ori') || '';
            }
            if (!ori) {
                var src = el.getAttribute('src') || el.getAttribute('href') || '';
                if (src.indexOf('/img/360px/') !== -1) {
                    ori = src.replace('/img/360px/', '/img/ori/');
                }
            }
        }
        if (!ori && current && current.src && String(current.src).indexOf('/img/360px/') !== -1) {
            ori = String(current.src).replace('/img/360px/', '/img/ori/');
        }
        return ori;
    }

    function placeOriButton(instance, current) {
        var container = instance.$refs && instance.$refs.container
            ? instance.$refs.container[0]
            : document.querySelector('.fancybox-container');
        if (!container) return;
        var old = container.querySelector('.fancybox-ori-link');
        if (old) old.remove();
        var ori = resolveOriUrl(instance, current);
        if (!ori) return;
        var a = document.createElement('a');
        a.className = 'fancybox-ori-link';
        a.href = ori;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = '查看原图';
        container.appendChild(a);
    }

    $(document).on('afterShow.fb', function (e, instance, current) {
        placeOriButton(instance, current);
    });
    $(document).on('afterClose.fb', function () {
        document.querySelectorAll('.post-imgcard img, article img').forEach(function (img) {
            if (img.style.display === 'none') {
                img.style.removeProperty('display');
            }
        });
    });
})();

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
