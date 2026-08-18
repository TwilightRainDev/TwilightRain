/**
 * Mermaid 构建期静态化（2026-08-18）：after_post_render 阶段用 playwright
 * 把 marked-mermaid.js 生成的 .mermaid 占位容器内的源码渲染为静态 SVG。
 *
 * 双轨设计：
 * - 本地构建（装有 playwright 浏览器，见 D 盘规则）：静态 SVG 进页面，
 *   客户端零渲染开销（不加载 mermaid.min.js）；
 * - CF Pages 构建（npm ci 装依赖但无浏览器二进制）：launch 失败 → 保留
 *   占位容器 → ink.js 客户端渲染兜底（现状行为不变）。
 *
 * 静态容器输出 <div class="mermaid mermaid-rendered" data-code="...">SVG</div>：
 * - mermaid-rendered：ink.js 首次加载跳过（mermaid-rendered 检查在 data-code
 *   之前，零客户端开销）；
 * - data-code：主题切换时 ink.js force 重渲染（深色模式适配）。
 */
'use strict';

var fs = require('fs');

// 本机 playwright 浏览器与 mermaid 全局依赖都在 D 盘（工作区 D 盘规则）。
// CF（Linux）无这些路径，不设置环境变量，require/launch 失败自然回退。
// NODE_PATH 由 setx 写入用户环境（新终端生效）；此处进程内注入兜底——
// 常驻父进程（如 CI/自动化会话）启动早于 setx 时不会继承新变量。
// 注意：进程启动后改 process.env.NODE_PATH 不生效，需 Module._initPaths() 重建。
if (process.platform === 'win32' &&
    fs.existsSync('D:/npm-global/node_modules/mermaid-isomorphic')) {
  var Module = require('module');
  var GLOBAL_NM = 'D:/npm-global/node_modules';
  var cur = process.env.NODE_PATH || '';
  if (cur.split(';').indexOf(GLOBAL_NM) === -1) {
    process.env.NODE_PATH = cur ? cur + ';' + GLOBAL_NM : GLOBAL_NM;
    Module._initPaths();
  }
}
if (process.platform === 'win32' && !process.env.PLAYWRIGHT_BROWSERS_PATH &&
    fs.existsSync('D:/work_temp/ms-playwright')) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = 'D:/work_temp/ms-playwright';
}

function decodeHtml(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 模块级复用 renderer（内部复用浏览器实例），多篇文章构建不重复启动浏览器
var renderer = null;
function getRenderer() {
  if (!renderer) {
    try {
      renderer = require('mermaid-isomorphic').createMermaidRenderer();
    } catch (e) {
      console.warn('[mermaid-static] mermaid-isomorphic 加载失败，回退客户端渲染:', e.message);
      renderer = null;
    }
  }
  return renderer;
}

// 占位容器：<div class="mermaid"><pre><code>源码(转义)</code></pre></div>
var MERMAID_BLOCK = /<div class="mermaid">([\s\S]*?)<\/div>/g;

function renderBlocks(blocks) {
  var render = getRenderer();
  if (!render) return Promise.reject(new Error('no renderer'));
  return render(blocks, {
    mermaidConfig: {
      theme: 'default',
      securityLevel: 'strict',
      fontFamily: 'inherit',
      fontSize: '15px'
    }
  });
}

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('class="mermaid"') === -1) return data;

  // 收集所有占位容器内的源码（HTML 转义态 → 原文）
  var blocks = [];
  var m;
  while ((m = MERMAID_BLOCK.exec(data.content)) !== null) {
    var codeMatch = m[1].match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
    if (codeMatch) blocks.push(decodeHtml(codeMatch[1]));
  }
  if (!blocks.length) return data;

  // hexo 等待 filter 返回的 promise
  return renderBlocks(blocks)
    .then(function (results) {
      var i = 0;
      data.content = data.content.replace(MERMAID_BLOCK, function (match, inner) {
        var codeMatch = inner.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
        var idx = i++;
        if (codeMatch && results[idx] && results[idx].status === 'fulfilled' &&
            results[idx].value && results[idx].value.svg) {
          var svg = results[idx].value.svg;
          var code = decodeHtml(codeMatch[1]);
          return '<div class="mermaid mermaid-rendered" data-code="' +
            escapeAttr(code) + '">' + svg + '</div>';
        }
        // 该图渲染失败：保留占位容器，ink.js 客户端渲染兜底
        return match;
      });
      return data;
    })
    .catch(function (err) {
      // 渲染器整体不可用（CF 无浏览器/依赖缺失）：全部保留占位
      console.warn('[mermaid-static] 静态化不可用，回退客户端渲染:', err.message);
      return data;
    });
});
