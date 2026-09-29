/*
 * 文章页自研灯箱
 *
 * 只在存在 .post-imgcard 的文章页启用；展示图与原图切换见 ADR-0015。
 *
 * 由 js/ink.js 入口按 import 顺序加载。
 * 块之间不共享作用域、不互相调用，只通过 DOM 与自定义事件通信。
 */

// ======================== 文章页自研灯箱 ========================
// 只在存在 .post-imgcard 的文章页启用。灯箱显示 src 的拷贝，不移动原节点。
// 键盘 Esc 关、左右翻；「查看原图」在灯箱内切换 360px/ori，中键新标签打开。
(function () {
    if (!document.querySelector('.post-imgcard')) return;

    function ensureOri(el) {
        if (!el || el.getAttribute('data-ori')) return;
        var src = el.getAttribute('src') || '';
        if (src.indexOf('/img/360px/') !== -1) {
            el.setAttribute('data-ori', src.replace('/img/360px/', '/img/ori/'));
        }
    }

    function resolveOri(img) {
        if (!img) return '';
        var ori = img.getAttribute('data-ori') || '';
        if (!ori && img.closest) {
            var host = img.closest('[data-ori]');
            if (host) ori = host.getAttribute('data-ori') || '';
        }
        if (!ori) {
            var src = img.getAttribute('src') || '';
            if (src.indexOf('/img/360px/') !== -1) {
                ori = src.replace('/img/360px/', '/img/ori/');
            }
        }
        return ori;
    }

    function collectImages() {
        var list = [];
        function add(img) {
            if (!img || list.indexOf(img) !== -1) return;
            ensureOri(img);
            img.classList.add('ink-lb-src');
            list.push(img);
        }
        add(document.querySelector('.post-imgcard img'));
        var article = document.querySelector('article');
        if (article) {
            article.querySelectorAll('img').forEach(add);
        }
        return list;
    }

    var state = {
        open: false,
        index: 0,
        showingOri: false,
        lastFocus: null,
        images: [],
        skipPop: false
    };

    var root = document.createElement('div');
    root.className = 'ink-lb';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '图片查看');

    var stage = document.createElement('div');
    stage.className = 'ink-lb-stage';

    var lbImg = document.createElement('img');
    lbImg.alt = '';

    var btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'ink-lb-nav ink-lb-prev';
    btnPrev.setAttribute('aria-label', '上一张');
    btnPrev.textContent = '上一张';

    var btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'ink-lb-nav ink-lb-next';
    btnNext.setAttribute('aria-label', '下一张');
    btnNext.textContent = '下一张';

    var btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.className = 'ink-lb-close';
    btnClose.setAttribute('aria-label', '关闭');
    btnClose.textContent = '关闭';

    var oriLink = document.createElement('a');
    oriLink.className = 'ink-lb-ori';
    oriLink.target = '_blank';
    oriLink.rel = 'noopener noreferrer';
    oriLink.textContent = '查看原图';
    oriLink.hidden = true;

    var meta = document.createElement('div');
    meta.className = 'ink-lb-meta';
    var caption = document.createElement('span');
    caption.className = 'ink-lb-caption';
    var counter = document.createElement('span');
    counter.className = 'ink-lb-counter';
    meta.appendChild(caption);
    meta.appendChild(counter);

    stage.appendChild(lbImg);
    root.appendChild(oriLink);
    root.appendChild(btnClose);
    root.appendChild(btnPrev);
    root.appendChild(btnNext);
    root.appendChild(stage);
    root.appendChild(meta);
    document.body.appendChild(root);

    function currentImg() {
        return state.images[state.index] || null;
    }

    function focusables() {
        return [oriLink, btnPrev, btnNext, btnClose].filter(function (n) {
            return n && !n.hidden && n.offsetParent !== null;
        });
    }

    function updateOriButton() {
        var img = currentImg();
        var ori = resolveOri(img);
        var src = img ? (img.getAttribute('src') || '') : '';
        if (!ori) {
            oriLink.hidden = true;
            oriLink.removeAttribute('href');
            return;
        }
        oriLink.hidden = false;
        oriLink.href = ori;
        oriLink.textContent = (state.showingOri && ori !== src) ? '查看展示图' : '查看原图';
    }

    function render() {
        var img = currentImg();
        if (!img) return;
        var src = img.getAttribute('src') || '';
        var ori = resolveOri(img);
        var showSrc = (state.showingOri && ori) ? ori : src;
        if (lbImg.getAttribute('src') !== showSrc) {
            lbImg.src = showSrc;
        }
        lbImg.alt = img.getAttribute('alt') || '';
        caption.textContent = lbImg.alt;
        caption.hidden = !lbImg.alt;
        var total = state.images.length;
        counter.textContent = total > 1 ? (state.index + 1) + ' / ' + total : '';
        counter.hidden = total <= 1;
        btnPrev.hidden = total <= 1;
        btnNext.hidden = total <= 1;
        updateOriButton();
    }

    function close(fromPop) {
        if (!state.open) return;
        state.open = false;
        root.hidden = true;
        document.body.style.removeProperty('overflow');
        if (state.lastFocus && typeof state.lastFocus.focus === 'function') {
            try { state.lastFocus.focus(); } catch (e) { /* 节点可能已卸 */ }
        }
        state.lastFocus = null;
        if (!fromPop && history.state && history.state.inkLb) {
            state.skipPop = true;
            history.back();
        }
    }

    function openAt(index) {
        if (!state.images.length) return;
        var next = (index + state.images.length) % state.images.length;
        state.index = next;
        state.showingOri = false;
        if (!state.open) {
            state.lastFocus = document.activeElement;
            state.open = true;
            root.hidden = false;
            document.body.style.overflow = 'hidden';
            history.pushState({ inkLb: true }, '');
        }
        render();
        btnClose.focus();
    }

    function step(delta) {
        if (state.images.length <= 1) return;
        state.index = (state.index + delta + state.images.length) % state.images.length;
        state.showingOri = false;
        render();
    }

    collectImages();
    document.addEventListener('DOMContentLoaded', collectImages);

    document.addEventListener('click', function (e) {
        if (state.open) return;
        var t = e.target;
        if (!t || !t.closest) return;
        var img = t.closest('.post-imgcard img, article img');
        if (!img) return;
        state.images = collectImages();
        var idx = state.images.indexOf(img);
        if (idx === -1) return;
        e.preventDefault();
        e.stopPropagation();
        openAt(idx);
    });

    root.addEventListener('click', function (e) {
        if (e.target === root) close();
    });
    btnClose.addEventListener('click', function () { close(); });
    btnPrev.addEventListener('click', function () { step(-1); });
    btnNext.addEventListener('click', function () { step(1); });

    oriLink.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        var img = currentImg();
        var ori = resolveOri(img);
        var src = img ? (img.getAttribute('src') || '') : '';
        if (!ori || ori === src) return;
        e.preventDefault();
        state.showingOri = !state.showingOri;
        render();
    });

    lbImg.addEventListener('error', function () {
        if (!state.showingOri) return;
        state.showingOri = false;
        render();
    });

    document.addEventListener('keydown', function (e) {
        if (!state.open) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
            return;
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1);
            return;
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            step(1);
            return;
        }
        if (e.key !== 'Tab') return;
        var nodes = focusables();
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
    });

    window.addEventListener('popstate', function () {
        if (state.skipPop) {
            state.skipPop = false;
            return;
        }
        if (state.open) close(true);
    });

    var touchX = 0;
    stage.addEventListener('touchstart', function (e) {
        if (e.changedTouches && e.changedTouches[0]) {
            touchX = e.changedTouches[0].clientX;
        }
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) < 50) return;
        step(dx > 0 ? -1 : 1);
    }, { passive: true });
})();
