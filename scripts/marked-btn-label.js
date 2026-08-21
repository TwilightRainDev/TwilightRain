/**
 * 按钮 / 标签小品（Butterfly 批一迁移）
 *
 *   ::btn{url="https://..." text="文案"}
 *   ::btn{url="/about/" text="关于"}          ← 站内相对路径也可
 *   ::label{text="Beta" tone="blue"}         ← tone: default|blue|green|red|orange
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

function parseAttrs(raw) {
  var attrs = {};
  var re = /([a-zA-Z-]+)="([^"]*)"/g;
  var m;
  while ((m = re.exec(raw)) !== null) attrs[m[1]] = m[2];
  return attrs;
}

function isSafeUrl(url) {
  if (!url) return false;
  if (/^https?:\/\//i.test(url)) return true;
  if (/^\/(?!\/)/.test(url)) return true; // 站内绝对路径，拒绝 protocol-relative //
  return false;
}

var TONES = { default: 1, blue: 1, green: 1, red: 1, orange: 1 };

var btnExtension = {
  name: 'mdBtn',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::btn(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = /^::btn\{([\s\S]*?)\}[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    var attrs = parseAttrs(match[1]);
    return {
      type: 'mdBtn',
      raw: match[0],
      url: (attrs.url || '').trim(),
      text: (attrs.text || '').trim()
    };
  },
  renderer: function (token) {
    if (!isSafeUrl(token.url) || !token.text) {
      return '<p class="md-btn-error">[WARN] 无效按钮语法，应为 ::btn{url="https://..." text="文案"}</p>';
    }
    var external = /^https?:\/\//i.test(token.url);
    var extra = external ? ' target="_blank" rel="noopener"' : '';
    return '<p class="md-btn-wrap"><a class="md-btn" href="' + escapeHtml(token.url) + '"' +
      extra + '>' + escapeHtml(token.text) + '</a></p>';
  }
};

var labelExtension = {
  name: 'mdLabel',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::label(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = /^::label\{([\s\S]*?)\}[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    var attrs = parseAttrs(match[1]);
    return {
      type: 'mdLabel',
      raw: match[0],
      text: (attrs.text || '').trim(),
      tone: (attrs.tone || 'default').trim().toLowerCase()
    };
  },
  renderer: function (token) {
    if (!token.text) {
      return '<p class="md-label-error">[WARN] 无效标签语法，应为 ::label{text="..."}</p>';
    }
    var tone = TONES[token.tone] ? token.tone : 'default';
    return '<p class="md-label-wrap"><mark class="md-label md-label-' + tone + '">' +
      escapeHtml(token.text) + '</mark></p>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [btnExtension, labelExtension] });
  });
}

module.exports = { btnExtension: btnExtension, labelExtension: labelExtension };
