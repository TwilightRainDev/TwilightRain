'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var admon = require('../../scripts/marked-admonitions');

test('parseAdmonMeta 识别五种类型', function () {
  ['note', 'tip', 'important', 'warning', 'caution'].forEach(function (t) {
    assert.deepEqual(admon.parseAdmonMeta(t), { type: t, title: '' });
  });
});

test('parseAdmonMeta 类型后文本作标题', function () {
  assert.deepEqual(admon.parseAdmonMeta('warning 小心心火'), { type: 'warning', title: '小心心火' });
  assert.deepEqual(admon.parseAdmonMeta('note  多空格  标题'), { type: 'note', title: '多空格  标题' });
});

test('parseAdmonMeta 类型不区分大小写', function () {
  assert.deepEqual(admon.parseAdmonMeta('WARNING'), { type: 'warning', title: '' });
  assert.deepEqual(admon.parseAdmonMeta('Tip 提示'), { type: 'tip', title: '提示' });
});

test('parseAdmonMeta 无参与空方括号默认 note', function () {
  assert.deepEqual(admon.parseAdmonMeta(null), { type: 'note', title: '' });
  assert.deepEqual(admon.parseAdmonMeta(''), { type: 'note', title: '' });
  assert.deepEqual(admon.parseAdmonMeta('   '), { type: 'note', title: '' });
});

test('parseAdmonMeta 首词非类型时宽容：note + 全串作标题', function () {
  assert.deepEqual(admon.parseAdmonMeta('注意'), { type: 'note', title: '注意' });
  assert.deepEqual(admon.parseAdmonMeta('warnign 拼错'), { type: 'note', title: 'warnign 拼错' });
});

test('renderAdmonHtml 产物结构与转义', function () {
  var html = admon.renderAdmonHtml('important', '', '<p>body</p>');
  assert.equal(
    html,
    '<blockquote class="admonition bdm-important" data-callout="important">\n' +
    '<div class="bdm-title">Important</div>\n<p>body</p>\n</blockquote>'
  );
  var custom = admon.renderAdmonHtml('note', '自定义<b>标题</b>', '<p>x</p>');
  assert.match(custom, /<div class="bdm-title">自定义&lt;b&gt;标题&lt;\/b&gt;<\/div>/);
});

test(':::admon 围栏正则', function () {
  assert.ok(admon.RULE.exec(':::admon[warning]\n内容\n:::'));
  assert.ok(admon.RULE.exec(':::admon\n内容\n:::'));
  assert.ok(admon.RULE.exec(':::admon[note 标题]\n内容\n:::'));
  assert.equal(admon.RULE.exec(':::note\n内容\n:::'), null);
  assert.equal(admon.RULE.exec(':::admon[warning]\n未闭合'), null);
});
