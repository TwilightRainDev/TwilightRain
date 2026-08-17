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
    // 首页无 cover 文章：每次页面加载从前端封面池随机取一张（替代原构建期随机的 picsum 图源）
    // 加新封面：裁 800x800 放入 source/img/covers/ 连续编号，并同步更新下方 coverPool 循环上界
    const coverPool = [];
    for (let i = 1; i <= 26; i++) {
        coverPool.push('/img/covers/cover-' + (i < 10 ? '0' + i : i) + '.jpg');
    }
    document.querySelectorAll('img[data-random-cover]').forEach(img => {
        img.src = coverPool[Math.floor(Math.random() * coverPool.length)];
    });

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
    if (tocSlot) {
        tocSlot.appendChild(toc);
        // 目录卡与图卡等高：max-height 跟随图卡实际高度（图片自然比例，
        // 随宽度与图片加载时机变化），目录内容超出后卡片内滚动。
        // 图卡高度为 0（图片未加载/加载失败）时不设限，避免目录卡消失。
        var imgcard = document.querySelector('.post-imgcard');
        if (imgcard) {
            // 目录卡高度与图卡等高（height 同步）：目录内容少于图卡高时
            // 填充留白（等高卡片），内容超出时卡片内滚动（overflow-y: auto）。
            // 图片解码完成、窗口缩放等任何图卡高度变化都由 ResizeObserver
            // 同步（img 未解码时高度会塌陷，RO 在解码完成后自动修正；
            // h > 0 防止图片加载失败时目录卡高度归零）。
            var syncTocHeight = function () {
                var h = imgcard.offsetHeight;
                if (h > 0) toc.style.height = h + 'px';
            };
            syncTocHeight();
            if (typeof ResizeObserver !== 'undefined') {
                new ResizeObserver(syncTocHeight).observe(imgcard);
            }
            window.addEventListener('resize', function () {
                clearTimeout(syncTocHeight._timer);
                syncTocHeight._timer = setTimeout(syncTocHeight, 100);
            });
        }
    } else {
        article.insertBefore(toc, article.firstChild);
    }

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

// ======================== 文章内图片灯箱 ========================
// 给 article 内 img 加 data-fancybox 属性，fancybox 3 通过事件委托
// 自动绑定点击放大（资源由 post.ejs 按页引入，仅文章页加载）。
// 文章页头图卡（.post-imgcard，banner→TOC 双卡布局）的图片同样支持放大。
(function() {
    var article = document.querySelector('article');
    if (!article) return;
    article.querySelectorAll('img').forEach(function(img) {
        img.setAttribute('data-fancybox', 'article');
    });
    document.querySelectorAll('.post-imgcard img').forEach(function(img) {
        img.setAttribute('data-fancybox', 'article');
    });
})();

// ======================== fancybox 关闭后恢复头图显示 ========================
// fancybox 3.5.7 对直接 <img> 触发（无 <a> 包裹）时会把原图移动进灯箱
// （原位置插隐藏占位符），关闭时放回原位但残留 style="display: none"，
// 导致文章页头图"消失"（2026-08-17 复现：点开灯箱再关闭即不可见）。
// 文章页有 jQuery（post.ejs 引入 cdnjs），监听 fancybox 的 afterClose.fb
// 事件，恢复被置 none 的头图/正文图内联样式；首页无 jQuery 时自然跳过。
(function() {
    if (!window.jQuery) return;
    window.jQuery(document).on('afterClose.fb', function () {
        document.querySelectorAll('.post-imgcard img, article img').forEach(function (img) {
            if (img.style.display === 'none') {
                img.style.removeProperty('display');
            }
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
        if (hasMermaid) loadLibrary(function () { renderAll(false); });
    });
})();
