'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var fs = require('node:fs');
var path = require('node:path');
var indexnow = require('../../scripts/indexnow-submit');

var root = path.join(__dirname, '..', '..');
var keyFile = path.join(root, 'source', indexnow.KEY_ID + '.txt');

test('build 脚本不含 indexnow', function () {
  var pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(typeof pkg.scripts.build, 'string');
  assert.doesNotMatch(pkg.scripts.build, /indexnow/i);
  assert.equal(pkg.scripts.indexnow, 'node scripts/indexnow-submit.js');
});

test('密钥文件内容与文件名 UUID 一致', function () {
  assert.equal(indexnow.readKey(keyFile), indexnow.KEY_ID);
});

test('parseSitemapLocs 抽出 loc', function () {
  var xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url><loc>https://twilightrain.com/</loc></url>',
    '  <url><loc>https://twilightrain.com/about/</loc></url>',
    '</urlset>'
  ].join('\n');
  assert.deepEqual(indexnow.parseSitemapLocs(xml), [
    'https://twilightrain.com/',
    'https://twilightrain.com/about/'
  ]);
});

test('urlsForHost 丢掉其它 host 与非 https', function () {
  var urls = indexnow.urlsForHost([
    'https://twilightrain.com/a/',
    'http://twilightrain.com/b/',
    'https://twilightrain.pages.dev/c/',
    'not-a-url',
    'https://twilightrain.com/d/'
  ], 'twilightrain.com');
  assert.deepEqual(urls, [
    'https://twilightrain.com/a/',
    'https://twilightrain.com/d/'
  ]);
});

test('buildPayload 组协议字段', function () {
  var payload = indexnow.buildPayload({
    host: indexnow.DEFAULT_HOST,
    key: indexnow.KEY_ID,
    keyLocation: indexnow.DEFAULT_KEY_LOCATION,
    urls: ['https://twilightrain.com/']
  });
  assert.deepEqual(payload, {
    host: 'twilightrain.com',
    key: indexnow.KEY_ID,
    keyLocation: indexnow.DEFAULT_KEY_LOCATION,
    urlList: ['https://twilightrain.com/']
  });
});

test('buildPayload 拒绝空列表与超额', function () {
  assert.throws(function () {
    indexnow.buildPayload({
      host: 'twilightrain.com',
      key: 'k',
      keyLocation: 'https://twilightrain.com/k.txt',
      urls: []
    });
  });
  var tooMany = [];
  for (var i = 0; i < indexnow.MAX_URLS + 1; i++) {
    tooMany.push('https://twilightrain.com/' + i + '/');
  }
  assert.throws(function () {
    indexnow.buildPayload({
      host: 'twilightrain.com',
      key: 'k',
      keyLocation: 'https://twilightrain.com/k.txt',
      urls: tooMany
    });
  });
});

test('submitIndexNow 视 200/202 为成功', async function () {
  var calls = [];
  async function fakeFetch(url, init) {
    calls.push({ url: url, init: init });
    return { status: 202 };
  }
  var payload = indexnow.buildPayload({
    host: 'twilightrain.com',
    key: indexnow.KEY_ID,
    keyLocation: indexnow.DEFAULT_KEY_LOCATION,
    urls: ['https://twilightrain.com/']
  });
  var result = await indexnow.submitIndexNow({
    fetchImpl: fakeFetch,
    endpoint: indexnow.DEFAULT_ENDPOINT,
    payload: payload
  });
  assert.equal(result.ok, true);
  assert.equal(result.status, 202);
  assert.equal(calls[0].url, indexnow.DEFAULT_ENDPOINT);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json; charset=utf-8');
  assert.equal(JSON.parse(calls[0].init.body).urlList.length, 1);
});

test('submitIndexNow 视其它状态为失败', async function () {
  var result = await indexnow.submitIndexNow({
    fetchImpl: async function () { return { status: 400 }; },
    endpoint: indexnow.DEFAULT_ENDPOINT,
    payload: { host: 'twilightrain.com', key: 'k', keyLocation: 'https://x/k.txt', urlList: ['https://twilightrain.com/'] }
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test('run --dry-run 不 POST', async function () {
  var urls = [];
  async function fakeFetch(url) {
    urls.push(url);
    return {
      ok: true,
      status: 200,
      text: async function () {
        return '<urlset><url><loc>https://twilightrain.com/about/</loc></url></urlset>';
      }
    };
  }
  var result = await indexnow.run({
    fetchImpl: fakeFetch,
    keyFile: keyFile,
    dryRun: true,
    waitMs: 0
  });
  assert.equal(result.dryRun, true);
  assert.equal(result.count, 1);
  assert.deepEqual(urls, [indexnow.DEFAULT_SITEMAP]);
});

test('workflow 独立于 Hexo 构建', function () {
  var yml = fs.readFileSync(path.join(root, '.github', 'workflows', 'indexnow.yml'), 'utf8');
  assert.match(yml, /node scripts\/indexnow-submit\.js/);
  assert.doesNotMatch(yml, /npm run build|hexo generate/i);
});
