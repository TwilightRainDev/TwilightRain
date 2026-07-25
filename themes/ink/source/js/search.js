// ======================== 站内搜索 ========================
(function() {
    var searchInput = document.getElementById('search-input');
    var resultDiv = document.getElementById('search-result');
    var statsDiv = document.getElementById('search-stats');
    var clearBtn = document.getElementById('search-clear');
    if (!searchInput || !resultDiv) return;

    var searchIndex = null;
    var loaded = false;

    // 搜索关键词高亮
    function highlightText(text, keyword) {
        if (!keyword) return text;
        var escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp('(' + escaped + ')', 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    // 从 URL 提取 searchIndex URL
    function getSearchUrl() {
        // 尝试从页面 meta 或固定路径获取
        return '/search.xml';
    }

    function loadIndex() {
        if (loaded) return Promise.resolve(searchIndex);
        var url = getSearchUrl();
        return fetch(url)
            .then(function(res) {
                if (!res.ok) throw new Error('Failed to load search index');
                return res.text();
            })
            .then(function(xmlText) {
                var parser = new DOMParser();
                var xml = parser.parseFromString(xmlText, 'text/xml');
                var entries = xml.querySelectorAll('entry');
                searchIndex = [];
                entries.forEach(function(entry) {
                    var title = (entry.querySelector('title') || {}).textContent || '';
                    var content = (entry.querySelector('content') || {}).textContent || '';
                    var url = (entry.querySelector('url') || {}).textContent || '';
                    var categories = [];
                    entry.querySelectorAll('category').forEach(function(cat) {
                        categories.push(cat.textContent);
                    });
                    searchIndex.push({ title: title, content: content, url: url, categories: categories });
                });
                loaded = true;
                return searchIndex;
            })
            .catch(function(err) {
                resultDiv.innerHTML = '<p class="search-error">搜索索引加载失败，请稍后再试。</p>';
                console.error('Search index load error:', err);
                return [];
            });
    }

    function performSearch(keyword) {
        if (!keyword || !keyword.trim()) {
            resultDiv.innerHTML = '';
            if (statsDiv) statsDiv.textContent = '';
            return;
        }
        keyword = keyword.trim().toLowerCase();

        if (!loaded || !searchIndex) {
            resultDiv.innerHTML = '<p class="search-loading">正在加载搜索索引...</p>';
            return;
        }

        var results = [];
        searchIndex.forEach(function(item) {
            var titleLower = item.title.toLowerCase();
            var contentLower = item.content.toLowerCase();

            var titleIndex = titleLower.indexOf(keyword);
            var contentIndex = contentLower.indexOf(keyword);

            if (titleIndex === -1 && contentIndex === -1) return;

            // 提取内容片段
            var snippet = '';
            if (contentIndex >= 0) {
                var start = Math.max(0, contentIndex - 40);
                var end = Math.min(item.content.length, contentIndex + keyword.length + 80);
                snippet = (start > 0 ? '...' : '') + item.content.substring(start, end) + (end < item.content.length ? '...' : '');
            }

            results.push({
                title: item.title,
                url: item.url,
                snippet: snippet,
                titleMatch: titleIndex >= 0
            });
        });

        // 按标题匹配优先排序
        results.sort(function(a, b) {
            if (a.titleMatch && !b.titleMatch) return -1;
            if (!a.titleMatch && b.titleMatch) return 1;
            return 0;
        });

        // 渲染结果
        if (results.length === 0) {
            resultDiv.innerHTML = '<p class="search-no-result">未找到与 "<strong>' + highlightText(keyword, keyword) + '</strong>" 相关的结果。</p>';
            if (statsDiv) statsDiv.textContent = '';
            return;
        }

        if (statsDiv) statsDiv.textContent = '共找到 ' + results.length + ' 条结果';
        var html = '<ul class="search-results-list">';
        results.forEach(function(r) {
            html += '<li class="search-result-item">';
            html += '<a href="' + r.url + '">';
            html += '<h3>' + highlightText(r.title, keyword) + '</h3>';
            if (r.snippet) {
                html += '<p class="search-snippet">' + highlightText(r.snippet, keyword) + '</p>';
            }
            html += '</a>';
            html += '</li>';
        });
        html += '</ul>';
        resultDiv.innerHTML = html;
    }

    // 输入防抖
    var debounceTimer = null;
    searchInput.addEventListener('input', function() {
        if (clearBtn) {
            clearBtn.style.display = this.value ? 'block' : 'none';
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
            performSearch(searchInput.value);
        }, 300);
    });

    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            resultDiv.innerHTML = '';
            if (statsDiv) statsDiv.textContent = '';
            searchInput.focus();
        });
    }

    // 回车直接搜索
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            clearTimeout(debounceTimer);
            performSearch(this.value);
        }
    });

    // 加载索引
    loadIndex();
})();
