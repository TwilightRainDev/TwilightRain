'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var inline = require('../../scripts/marked-inline');

test('parseInlineType 读取 type', function () {
  assert.equal(inline.parseInlineType({ type: 'btn', url: '/a/', text: 'A' }), 'btn');
  assert.equal(inline.parseInlineType({ type: 'label', text: 'Beta' }), 'label');
  assert.equal(inline.parseInlineType({ type: 'nope' }), '');
});

test('renderBtnHtml 与 renderLabelHtml', function () {
  var btn = inline.renderBtnHtml({ url: '/about/', text: '关于本站' });
  assert.match(btn, /class="md-btn"/);
  assert.match(btn, /href="\/about\/"/);
  assert.doesNotMatch(btn, /target="_blank"/);

  var ext = inline.renderBtnHtml({ url: 'https://example.com', text: '外链' });
  assert.match(ext, /target="_blank"/);

  var label = inline.renderLabelHtml({ text: 'Beta', tone: 'blue' });
  assert.match(label, /md-label md-label-blue/);
  assert.match(label, /Beta/);
});

test('::inline 围栏正则', function () {
  assert.ok(inline.INLINE_RULE.exec('::inline{type="btn" url="/about/" text="关于"}\n'));
});
