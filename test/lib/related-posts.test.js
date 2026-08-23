'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var lib = require('../../scripts/lib/related-posts');
var bili = require('../../scripts/marked-bilibili');

test('无标签返回空列表', function () {
  assert.deepEqual(lib.pickRelatedPosts({ path: '/a/', tags: [] }), []);
});

test('按标签交集权重排序并排除当前文', function () {
  var current = {
    path: '/current/',
    tags: [
      {
        name: 'hexo',
        posts: [
          { path: '/current/', title: '当前' },
          { path: '/a/', title: 'A' },
          { path: '/b/', title: 'B' }
        ]
      },
      {
        name: 'css',
        posts: [
          { path: '/current/', title: '当前' },
          { path: '/a/', title: 'A' },
          { path: '/c/', title: 'C' }
        ]
      }
    ]
  };
  var items = lib.pickRelatedPosts(current, { limit: 3 });
  assert.equal(items[0].path, '/a/');
  assert.equal(items[0].weight, 2);
  assert.deepEqual(items.map(function (x) { return x.path; }).sort(), ['/a/', '/b/', '/c/']);
});

test('parseBilibiliId 识别 BV 与 av，av 规范为 BV', function () {
  assert.deepEqual(bili.parseBilibiliId('BV17x411w7KC'), { type: 'bvid', id: 'BV17x411w7KC' });
  assert.deepEqual(bili.parseBilibiliId('https://www.bilibili.com/video/BV17x411w7KC/'), {
    type: 'bvid',
    id: 'BV17x411w7KC'
  });
  assert.deepEqual(bili.parseBilibiliId('av170001'), { type: 'bvid', id: 'BV17x411w7KC' });
  assert.deepEqual(bili.parseBilibiliId('170001'), { type: 'bvid', id: 'BV17x411w7KC' });
  assert.equal(bili.parseBilibiliId('bad'), null);
  assert.equal(bili.parseBilibiliId('BV17x411w7K0'), null);
});

test('buildPlayerSrc 统一走 bvid 参数', function () {
  var src = bili.buildPlayerSrc({ type: 'bvid', id: 'BV17x411w7KC' }, '2');
  assert.match(src, /^https:\/\/player\.bilibili\.com\/player\.html\?/);
  assert.match(src, /bvid=BV17x411w7KC/);
  assert.match(src, /page=2/);
  assert.doesNotMatch(src, /aid=/);
});
