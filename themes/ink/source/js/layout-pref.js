/**
 * 首页列表 / 网格布局偏好（拍板 M6）。
 * localStorage 键：ink-home-layout（grid | list）
 */
(function() {
    var STORAGE_KEY = 'ink-home-layout';
    var COLUMNS_GROUP_ID = 'home-columns-group';

    function getLayout() {
        var stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'list' ? 'list' : 'grid';
    }

    function applyLayout(pref) {
        var list = document.querySelector('.blog-posts');
        if (!list) return;
        var layout = pref === 'list' ? 'list' : 'grid';
        list.classList.toggle('blog-posts--list', layout === 'list');
        document.documentElement.setAttribute('data-home-layout', layout);
        syncColumnsState(layout);
    }

    function syncColumnsState(layout) {
        var disabled = layout === 'list';
        var group = document.getElementById(COLUMNS_GROUP_ID);
        if (group) {
            group.classList.toggle('setting-group--disabled', disabled);
        }
        var columnsRadios = document.querySelectorAll('input[name="columns"]');
        for (var i = 0; i < columnsRadios.length; i++) {
            columnsRadios[i].disabled = disabled;
            var wrap = columnsRadios[i].closest('.setting-option');
            if (wrap) wrap.classList.toggle('setting-option--disabled', disabled);
        }
    }

    var storedLayout = getLayout();
    applyLayout(storedLayout);

    document.addEventListener('DOMContentLoaded', function() {
        var layoutRadios = document.querySelectorAll('input[name="home-layout"]');
        for (var i = 0; i < layoutRadios.length; i++) {
            (function(r) {
                r.checked = r.value === storedLayout;
                r.addEventListener('change', function() {
                    if (!r.checked) return;
                    storedLayout = r.value === 'list' ? 'list' : 'grid';
                    localStorage.setItem(STORAGE_KEY, storedLayout);
                    applyLayout(storedLayout);
                });
            })(layoutRadios[i]);
        }
        syncColumnsState(storedLayout);
    });
})();
