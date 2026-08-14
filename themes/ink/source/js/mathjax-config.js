// MathJax 3 全局配置（按需加载：仅公式页由 head.ejs 注入本文件与 tex-chtml.js）
// 必须是独立文件而非内联 <script>：CSP script-src 无 'unsafe-inline'，内联会被拦截
// 且必须位于 tex-chtml.js 之前加载（defer 按文档顺序执行，先注册 window.MathJax）
window.MathJax = {
  tex: {
    // 行内公式分隔符：$...$ 与 \(...\)
    // （显示公式 $$...$$ 与 \[...\] 是 MathJax 3 默认启用，无需配置）
    inlineMath: [['$', '$'], ['\\(', '\\)']]
  }
};
