/**
 * B 站视频懒嵌入（Butterfly 批二迁移，自写；不调用第三方元数据 API）
 *
 *   ::bilibili{id="BV1xx411c7mD"}
 *   ::bilibili{id="av170001"}
 *   ::bilibili{id="https://www.bilibili.com/video/BV1xx411c7mD/"}
 *
 * av 号经 scripts/lib/av-bv-convert.js 规范为 BV 后嵌入；构建期输出占位卡片，
 * ink.js 在进入视口或点击后注入 sandbox iframe。
 */
'use strict';

var avBv = require('./lib/av-bv-convert');

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

/**
 * 解析并规范为可嵌入的 BV 号；非法或无法校验时返回 null。
 * @returns {{ type: 'bvid', id: string } | null}
 */
function parseBilibiliId(raw) {
  if (!raw) return null;
  var text = String(raw).trim();

  var bv = text.match(/(BV1[\w]{9})/);
  if (bv) {
    try {
      avBv.bvToAv(bv[1]);
      return { type: 'bvid', id: bv[1] };
    } catch (e) {
      return null;
    }
  }

  var av = text.match(/(?:^|[^\d])av(\d+)/i);
  if (av) {
    try {
      return { type: 'bvid', id: avBv.avToBv(av[1]) };
    } catch (e) {
      return null;
    }
  }

  if (/^\d+$/.test(text)) {
    try {
      return { type: 'bvid', id: avBv.avToBv(text) };
    } catch (e) {
      return null;
    }
  }

  return null;
}

function buildPlayerSrc(parsed, page) {
  var pageNum = page && /^[1-9]\d*$/.test(String(page)) ? String(page) : '1';
  return 'https://player.bilibili.com/player.html?bvid=' +
    encodeURIComponent(parsed.id) + '&page=' + pageNum + '&high_quality=1&danmaku=0';
}

var bilibiliExtension = {
  name: 'mdBilibili',
  level: 'block',
  start: function (src) {
    var m = src.match(/^::bilibili(?=[{\s])/);
    return m ? m.index : -1;
  },
  tokenizer: function (src) {
    var match = /^::bilibili\{([\s\S]*?)\}[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    var attrs = parseAttrs(match[1]);
    return {
      type: 'mdBilibili',
      raw: match[0],
      id: (attrs.id || '').trim(),
      page: (attrs.page || '1').trim()
    };
  },
  renderer: function (token) {
    var parsed = parseBilibiliId(token.id);
    if (!parsed) {
      return '<p class="md-bili-error">[WARN] 无效 B 站语法，应为 ::bilibili{id="BV..."} 或 av 号</p>';
    }
    var src = buildPlayerSrc(parsed, token.page);
    return '<figure class="bili-embed" data-bili-src="' + escapeHtml(src) + '">' +
      '<button type="button" class="bili-embed-trigger" aria-label="加载 B 站视频 ' +
      escapeHtml(parsed.id) + '">' +
      '<span class="bili-embed-icon" aria-hidden="true">▶</span>' +
      '<span class="bili-embed-label">B 站视频 · ' + escapeHtml(parsed.id) + '</span>' +
      '<span class="bili-embed-hint">点击或滚动到此处加载播放器</span>' +
      '</button>' +
      '<div class="bili-embed-frame" hidden></div>' +
      '</figure>';
  }
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('marked:use', function (markedUse) {
    markedUse({ extensions: [bilibiliExtension] });
  });
}

module.exports = {
  bilibiliExtension: bilibiliExtension,
  parseBilibiliId: parseBilibiliId,
  buildPlayerSrc: buildPlayerSrc
};
