/**
 * 内联小品 ::inline（阶段七，非兼容）
 *
 *   ::inline{type="btn" url="https://..." text="文案"}
 *   ::inline{type="label" text="Beta" tone="blue"}
 *
 * HTML 类名仍为 .md-btn / .md-label。
 */
'use strict';

var INLINE_RULE = /^::inline\{([\s\S]*?)\}[ \t]*(?:\n|$)/;

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
  if (/^\/(?!\/)/.test(url)) return true;
  return false;
}

var TONES = { default: 1, blue: 1, green: 1, red: 1, orange: 1 };

function parseInlineType(attrs) {
  var t = String((attrs && attrs.type) || '').trim().toLowerCase();
  if (t === 'btn' || t === 'label') return t;
  return '';
}

function renderBtnHtml(attrs) {
  var url = (attrs.url || '').trim();
  var text = (attrs.text || '').trim();
  if (!isSafeUrl(url) || !text) {
    return '<p class="md-btn-error">[WARN] 无效按钮语法，应为 ::inline{type="btn" url="https://..." text="文案"}</p>';
  }
  var external = /^https?:\/\//i.test(url);
  var extra = external ? ' target="_blank" rel="noopener"' : '';
  return '<p class="md-btn-wrap"><a class="md-btn" href="' + escapeHtml(url) + '"' +
    extra + '>' + escapeHtml(text) + '</a></p>';
}

function renderLabelHtml(attrs) {
  var text = (attrs.text || '').trim();
  if (!text) {
    return '<p class="md-label-error">[WARN] 无效标签语法，应为 ::inline{type="label" text="..."}</p>';
  }
  var tone = (attrs.tone || 'default').trim().toLowerCase();
  if (!TONES[tone]) tone = 'default';
  return '<p class="md-label-wrap"><mark class="md-label md-label-' + tone + '">' +
    escapeHtml(text) + '</mark></p>';
}

var inlineExtension = {
  name: 'mdInline',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::inline(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = INLINE_RULE.exec(src);
    if (!match) return undefined;
    return {
      type: 'mdInline',
      raw: match[0],
      attrs: parseAttrs(match[1])
    };
  },
  renderer: function (token) {
    var kind = parseInlineType(token.attrs);
    if (kind === 'btn') return renderBtnHtml(token.attrs);
    if (kind === 'label') return renderLabelHtml(token.attrs);
    return '<p class="md-btn-error">[WARN] 无效内联语法，应为 ::inline{type="btn|label" ...}</p>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [inlineExtension] });
  });
}

module.exports = {
  inlineExtension: inlineExtension,
  parseInlineType: parseInlineType,
  renderBtnHtml: renderBtnHtml,
  renderLabelHtml: renderLabelHtml,
  INLINE_RULE: INLINE_RULE
};
