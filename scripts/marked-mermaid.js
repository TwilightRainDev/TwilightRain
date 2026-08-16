/**
 * Mermaid 图表：```mermaid 代码块 → <div class="mermaid"> 容器
 *
 * 语法：
 *   ```mermaid
 *   graph TD
 *       A --> B
 *   ```
 * 渲染为 <div class="mermaid"><pre><code>源码</code></pre></div>：
 * - 源码保留在 DOM（无 JS 时可见、可复制），ink.js 读取 code.textContent
 *   交给 mermaid 渲染，渲染成功后替换为 SVG；
 * - mermaid.min.js 自托管在 themes/ink/source/js/（script-src 'self' 放行，
 *   无需改动 scripts/csp.js）；由 ink.js 按需加载渲染，页面无图表时零开销。
 *
 * 为什么用 before_post_render 预处理而不是 marked 扩展：
 * hexo 内置 backtick_code_block 过滤器（before_post_render，priority 10）
 * 会在 marked 渲染前把源文里所有围栏代码块整体替换为占位符——marked 的
 * 扩展 tokenizer 永远看不到 ```mermaid 围栏（实测扩展注册成功但不命中）。
 * 本过滤器 priority 9 先于它执行，把 mermaid 围栏直接替换为 HTML 容器，
 * 围栏结构消失后 backtick_code_block 不再匹配，其余代码块不受影响
 * （highlight.js 构建时高亮路径不变）。
 */
'use strict';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 围栏语言为 mermaid 的代码块（支持 3+ 反引号或波浪线；闭合围栏可带尾随空格）
var MERMAID_BLOCK = /^ {0,3}(`{3,}|~{3,})mermaid[ \t]*\n([\s\S]*?)\n {0,3}\1[ \t]*(?=\n|$)/gm;

hexo.extend.filter.register('before_post_render', function (data) {
  if (data.content && /mermaid/.test(data.content)) {
    data.content = data.content.replace(MERMAID_BLOCK, function (match, fence, code) {
      return '<div class="mermaid"><pre><code>' + escapeHtml(code) + '</code></pre></div>';
    });
  }
  return data;
}, 9);
