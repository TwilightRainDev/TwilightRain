document.addEventListener('DOMContentLoaded', function () {
    const mainContent = document.querySelector('article');
    if (mainContent) {
        mainContent.querySelectorAll('img').forEach(img => {
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

            img.addEventListener('load', function () {
                customElement.style.display = 'inline-block';
                const canvas = document.createElement('canvas');
                const rgbColor = getImageColor(canvas, img);
                figcaption.style.backgroundColor = rgbColor;
            });

            img.addEventListener('error', function () {
                customElement.remove();
            });
        });
    }

    function getImageColor(canvas, img) {
        canvas.width = img.width;
        canvas.height = img.height;

        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = context.getImageData(0, 0, img.width, img.height).data;
        let r = 0, g = 0, b = 0;

        const pixelCount = img.width * img.height;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);

        return `rgba(${r}, ${g}, ${b},0.4)`;
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const thumbnails = document.querySelectorAll('.thumbnail');

    thumbnails.forEach(img => {
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            console.log('Image loaded:', img.src);
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
        canvas.width = img.width;
        canvas.height = img.height;

        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = context.getImageData(0, 0, img.width, img.height).data;
        const colorCounts = {};

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const rgb = `rgba(${r},${g},${b},0.4)`;
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
        console.log(`Extracted color: ${dominantColor}`);
        return `${dominantColor}`;
    }
});

// ======================== 深色/浅色主题切换 ========================
(function() {
    var toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    var stored = localStorage.getItem('theme-preference');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    function giscusTheme(theme) {
        var giscus = document.querySelector('iframe.giscus-frame');
        if (giscus) {
            giscus.contentWindow.postMessage({
                giscus: { setConfig: { theme: theme === 'dark' ? 'dark' : 'light' } }
            }, 'https://giscus.app');
        }
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggleBtn.textContent = '☀️';
        } else {
            document.documentElement.removeAttribute('data-theme');
            toggleBtn.textContent = '🌙';
        }
        giscusTheme(theme);
    }

    // 初始应用：存储优先，无存储则跟随系统
    if (stored) {
        applyTheme(stored);
    } else if (prefersDark) {
        applyTheme('dark');
    }

    toggleBtn.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme-preference', next);
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
    article.insertBefore(toc, article.firstChild);

    // 折叠/展开
    toggleBtn.addEventListener('click', function() {
        list.classList.toggle('collapsed');
        toggleBtn.textContent = list.classList.contains('collapsed') ? '[展开]' : '[折叠]';
    });

    // 点击平滑滚动
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
            }
        }
    });

    // 滚动时高亮当前章节
    var callback = function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var id = entry.target.id;
                toc.querySelectorAll('.toc-item.active').forEach(function(el) { el.classList.remove('active'); });
                var activeA = toc.querySelector('a[href="#' + id + '"]');
                if (activeA) {
                    var activeLi = activeA.closest('.toc-item');
                    if (activeLi) activeLi.classList.add('active');
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

// ======================== 代码块一键复制 ========================
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('pre').forEach(function (pre) {
        var code = pre.querySelector('code');
        if (!code) return;
        // 跳过已经处理过的
        if (pre.querySelector('.copy-btn')) return;

        var btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = '复制';
        btn.setAttribute('aria-label', '复制代码');

        btn.addEventListener('click', function () {
            var text = code.textContent || code.innerText;
            // 去掉首尾空行
            text = text.replace(/^\n+/, '').replace(/\n+$/, '');
            navigator.clipboard.writeText(text).then(function () {
                btn.textContent = '已复制!';
                btn.classList.add('copied');
                setTimeout(function () {
                    btn.textContent = '复制';
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(function () {
                // 降级：fallback 到旧方法
                try {
                    var ta = document.createElement('textarea');
                    ta.value = text;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    btn.textContent = '已复制!';
                    btn.classList.add('copied');
                    setTimeout(function () {
                        btn.textContent = '复制';
                        btn.classList.remove('copied');
                    }, 2000);
                } catch (e) {
                    btn.textContent = '复制失败';
                    setTimeout(function () { btn.textContent = '复制'; }, 2000);
                }
            });
        });

        // 让 pre 成为相对定位容器
        pre.style.position = 'relative';
        pre.appendChild(btn);
    });
});