/*
 * 页面框架件：返回顶部、阅读进度、文章目录、悬停资料卡
 *
 * 返回顶部按钮与阅读进度条为固定件；文章目录含桌面双卡与移动端胶囊两种形态。
 *
 * 由 js/ink.js 入口按 import 顺序加载。
 * 块之间不共享作用域、不互相调用，只通过 DOM 与自定义事件通信。
 */

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
        // 滚动 80px 后显示按钮；滚动中临时隐藏，停稳后再显示（减少遮挡正文）
        var tocScrollIdle = null;
        var onTocScroll = function () {
            if (!isMobileToc() || !tocMobileToggle) return;
            var show = window.scrollY > 80;
            tocMobileToggle.classList.toggle('is-visible', show);
            if (!show) {
                tocMobileToggle.classList.remove('is-scrolling');
                tocMobilePanel.classList.remove('is-open');
                tocMobileToggle.setAttribute('aria-expanded', 'false');
                return;
            }
            if (tocMobilePanel.classList.contains('is-open')) return;
            tocMobileToggle.classList.add('is-scrolling');
            clearTimeout(tocScrollIdle);
            tocScrollIdle = setTimeout(function () {
                tocMobileToggle.classList.remove('is-scrolling');
            }, 180);
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
