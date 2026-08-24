'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var fold = require('../../scripts/marked-fold');

test('parseFoldMeta 识别 mode 与标签', function () {
  assert.deepEqual(fold.parseFoldMeta('text'), { mode: 'text', label: '' });
  assert.deepEqual(fold.parseFoldMeta('text 悬停查看'), { mode: 'text', label: '悬停查看' });
  assert.deepEqual(fold.parseFoldMeta('details 摘要标题'), { mode: 'details', label: '摘要标题' });
  assert.deepEqual(fold.parseFoldMeta('mode=text 剧透'), { mode: 'text', label: '剧透' });
  assert.deepEqual(fold.parseFoldMeta('mode=details 展开'), { mode: 'details', label: '展开' });
  assert.deepEqual(fold.parseFoldMeta('展开说明'), { mode: 'text', label: '展开说明' });
});

test('renderFoldHtml text 模式输出 md-text', function () {
  var html = fold.renderFoldHtml('text', '悬停或点击查看', '<p>secret</p>');
  assert.match(html, /class="md-text"/);
  assert.match(html, /md-text-hint/);
  assert.match(html, /secret/);
});

test('renderFoldHtml details 模式输出 md-details', function () {
  var html = fold.renderFoldHtml('details', '摘要标题', '<p>body</p>');
  assert.match(html, /<details class="md-details">/);
  assert.match(html, /摘要标题/);
  assert.match(html, /body/);
});

test(':::fold 围栏正则', function () {
  var foldSample = ':::fold[text 悬停]\n秘密\n:::';
  assert.ok(fold.FOLD_RULE.exec(foldSample));
});
