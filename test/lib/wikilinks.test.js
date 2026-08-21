'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var lib = require('../../scripts/lib/wikilinks');

test('提取 [[Title]] [[Title|Alias]] [[Title#Anchor]]', function () {
  var md = '见 [[Hello]] 与 [[Hello|点我]] 和 [[Hello#节一]]';
  var links = lib.extractWikilinks(md);
  assert.equal(links.length, 3);
  assert.deepEqual(links[0], { target: 'Hello', anchor: '', alias: '' });
  assert.deepEqual(links[1], { target: 'Hello', anchor: '', alias: '点我' });
  assert.deepEqual(links[2], { target: 'Hello', anchor: '节一', alias: '' });
});

test('代码块内双链不提取、不替换', function () {
  var md = '正文 [[Real]]\n```\n[[Fake]]\n```\n行内 `[[Nope]]`';
  assert.equal(lib.extractWikilinks(md).length, 1);
  assert.equal(lib.extractWikilinks(md)[0].target, 'Real');
  var out = lib.replaceWikilinks(md, function () {
    return { path: '/p/real/', title: 'Real' };
  });
  assert.match(out, /\[Real\]\(\/p\/real\/\)/);
  assert.match(out, /```\n\[\[Fake\]\]\n```/);
  assert.match(out, /`\[\[Nope\]\]`/);
});

test('未解析目标原样保留', function () {
  var out = lib.replaceWikilinks('[[Missing]]', function () { return null; });
  assert.equal(out, '[[Missing]]');
});

test('构建出站与入站图', function () {
  var posts = [
    { id: 'a', title: 'A', path: '/a/' },
    { id: 'b', title: 'B', path: '/b/' }
  ];
  var resolve = function (t) {
    if (t === 'B') return posts[1];
    if (t === 'A') return posts[0];
    return null;
  };
  var graph = lib.buildLinkGraph(posts, [{ id: 'a', raw: '链到 [[B]]' }], resolve);
  assert.equal(graph.a.outbounds.length, 1);
  assert.equal(graph.a.outbounds[0].id, 'b');
  assert.equal(graph.b.inbounds.length, 1);
  assert.equal(graph.b.inbounds[0].id, 'a');
});
