/*
 * 正文图取色与封面池
 *
 * 文章正文图按主色铺底；首页无封面文章从封面池随机取图，首页缩略图取主色。
 *
 * 由 js/ink.js 入口按 import 顺序加载。
 * 块之间不共享作用域、不互相调用，只通过 DOM 与自定义事件通信。
 */

document.addEventListener('DOMContentLoaded', function () {
    const mainContent = document.querySelector('article');
    if (mainContent) {
        mainContent.querySelectorAll('img').forEach(img => {
            // 卡片/网格/头图等组件内图片不做 article-image 取色包裹（会破坏布局并误藏图）
            if (img.closest(
                '.md-grid, a.card-github, a.card-link, .post-imgcard'
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
    for (let i = 1; i <= 31; i++) {
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
