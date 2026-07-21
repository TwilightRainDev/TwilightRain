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