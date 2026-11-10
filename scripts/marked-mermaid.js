/**
 * Mermaid 图表：```mermaid 围栏 → <div class="mermaid"> 容器，源码留在 <pre><code> 里，
 * 由 ink.js 读 textContent 渲染成 SVG（mermaid.min.js 自托管在 js/，script-src 'self' 放行）。
 *
 * 必须走 before_post_render 且 priority 9：hexo 内置 backtick_code_block（priority 10）会
 * 把源文里的围栏代码块换成占位符，经 marked 扩展的 tokenizer 就看不到 ```mermaid。
 * 本过滤器先跑、用 HTML 容器替掉 mermaid 围栏，故那一步不匹配它，其余代码块高亮不变。
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
