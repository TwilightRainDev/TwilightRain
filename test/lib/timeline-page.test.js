'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var fs = require('node:fs');
var path = require('node:path');

var root = path.join(__dirname, '..', '..');
var helpers = {};

global.hexo = {
  base_dir: root,
  log: {
    warn: function () {},
    info: function () {}
  },
  extend: {
    filter: {
      register: function () {}
    },
    helper: {
      register: function (name, fn) {
        helpers[name] = fn;
      }
    }
  }
};

require('../../scripts/timeline-page');

test('timeline_page_html 在 git 缓存为空且 page.items 缺失时输出暂无记录且不抛', function () {
  assert.doesNotThrow(function () {
    helpers.timeline_page_html(undefined);
    helpers.timeline_page_html();
    helpers.timeline_page_html(null);
    helpers.timeline_page_html([]);
  });
  assert.equal(helpers.timeline_page_html(undefined), '<p>暂无记录。</p>');
  assert.equal(helpers.timeline_page_html(), '<p>暂无记录。</p>');
  assert.equal(helpers.timeline_page_html(null), '<p>暂无记录。</p>');
  assert.equal(helpers.timeline_page_html([]), '<p>暂无记录。</p>');
});

test('source/timeline/index.md 不再含 items 兜底快照', function () {
  var md = fs.readFileSync(path.join(root, 'source/timeline/index.md'), 'utf8');
  assert.doesNotMatch(md, /^items:/m);
  assert.match(md, /^title: 时间线$/m);
  assert.match(md, /^layout: timeline$/m);
  assert.match(md, /^comments: false$/m);
  assert.doesNotMatch(md, /兜底快照/);
});

test('浅克隆与 git 失败告警指向 WORKFLOW 构建前置，不再提兜底列表', function () {
  var src = fs.readFileSync(path.join(root, 'scripts/timeline-page.js'), 'utf8');
  assert.match(src, /WORKFLOW\.md/);
  assert.match(src, /构建前置/);
  assert.doesNotMatch(src, /front matter 兜底列表/);
  assert.doesNotMatch(src, /git fetch --unshallow/);
});
