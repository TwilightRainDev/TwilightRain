'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var fs = require('node:fs');
var path = require('node:path');
var verify = require('../../scripts/verify-build');

var root = path.join(__dirname, '..', '..');
var SITE = 'https://twilightrain.com';

// 与产物同形的 sitemap 片段：loc 在前、lastmod 在后。
function urlset(rows) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    rows.map(function (r) {
      return '  <url>\n    <loc>' + r[0] + '</loc>\n    <lastmod>' + r[1] + '</lastmod>\n  </url>';
    }).join('\n'),
    '</urlset>'
  ].join('\n');
}

var SOURCES = [
  {
    source: 'source/_posts/blog-repo-cleanup.md',
    kind: 'post',
    urlPath: '/2026/09/21/blog-repo-cleanup/',
    dates: ['2026-09-28'],
    excluded: false
  },
  {
    source: 'source/about/index.md',
    kind: 'page',
    urlPath: '/about/index.html',
    dates: ['2026-07-24', '2026-07-25'],
    excluded: false
  }
];

function problemsFor(rows, sources) {
  return verify.checkSitemap({
    xml: urlset(rows),
    siteUrl: SITE,
    sources: sources || SOURCES
  });
}

test('parseFrontMatter 保留日期原文，不落成 Date', function () {
  var fm = verify.parseFrontMatter([
    '---',
    'title: 关于我',
    'date: 2026-07-13 17:44:00',
    'updated: 2026-07-25',
    'sitemap: false',
    '---',
    '正文',
    ''
  ].join('\n'));
  assert.equal(fm.date, '2026-07-13 17:44:00');
  assert.equal(fm.updated, '2026-07-25');
  assert.equal(fm.sitemap, 'false');
});

test('parseFrontMatter 无 front matter 时返回空对象', function () {
  assert.deepEqual(verify.parseFrontMatter('# 标题\n正文\n'), {});
});

test('expectedLastmod 取 updated 优先于 date', function () {
  assert.deepEqual(
    verify.expectedLastmod({ date: '2026-07-13 17:44:00', updated: '2026-07-25' }),
    ['2026-07-24', '2026-07-25']
  );
});

test('expectedLastmod 08:00 之后的钟点只有一天', function () {
  assert.deepEqual(verify.expectedLastmod({ date: '2026-07-25 14:00:00' }), ['2026-07-25']);
});

test('expectedLastmod 无日期返回空', function () {
  assert.deepEqual(verify.expectedLastmod({}), []);
});

test('parseSitemap 取 loc 与 lastmod', function () {
  assert.deepEqual(
    verify.parseSitemap(urlset([
      [SITE + '/', '2026-09-29'],
      [SITE + '/about/index.html', '2026-07-24']
    ])),
    [
      { loc: SITE + '/', lastmod: '2026-09-29' },
      { loc: SITE + '/about/index.html', lastmod: '2026-07-24' }
    ]
  );
});

test('首页与标签/分类归档页的 lastmod 由插件写死，跳过', function () {
  assert.equal(verify.isTimestampFreePath('/'), true);
  assert.equal(verify.isTimestampFreePath('/tags/Git/'), true);
  assert.equal(verify.isTimestampFreePath('/categories/%E6%8A%80%E6%9C%AF%E7%AC%94%E8%AE%B0/'), true);
  assert.equal(verify.isTimestampFreePath('/tags/index.html'), false);
  assert.equal(verify.isTimestampFreePath('/categories/index.html'), false);
  assert.equal(verify.isTimestampFreePath('/2026/09/21/blog-repo-cleanup/'), false);
  assert.equal(verify.isTimestampFreePath('/about/index.html'), false);
});

test('checkSitemap 一致时不报问题', function () {
  var problems = problemsFor([
    [SITE + '/', '2026-09-29'],
    [SITE + '/tags/Git/', '2026-09-29'],
    [SITE + '/2026/09/21/blog-repo-cleanup/', '2026-09-28'],
    [SITE + '/about/index.html', '2026-07-24']
  ]);
  assert.deepEqual(problems, []);
});

test('checkSitemap 报出 lastmod 落成构建当天', function () {
  var problems = problemsFor([
    [SITE + '/2026/09/21/blog-repo-cleanup/', '2026-09-29'],
    [SITE + '/about/index.html', '2026-07-24']
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /blog-repo-cleanup/);
  assert.match(problems[0], /2026-09-29/);
});

test('checkSitemap 报出源文件不存在的 URL', function () {
  var problems = problemsFor([
    [SITE + '/2026/09/21/blog-repo-cleanup/', '2026-09-28'],
    [SITE + '/about/index.html', '2026-07-24'],
    [SITE + '/ghost/index.html', '2026-01-01']
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /ghost/);
});

test('checkSitemap 报出没进 sitemap 的文章', function () {
  var problems = problemsFor([
    [SITE + '/about/index.html', '2026-07-24']
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /blog-repo-cleanup/);
});

test('checkSitemap 报出标了 sitemap: false 却仍被收录', function () {
  var sources = SOURCES.concat([{
    source: 'source/404.md',
    kind: 'page',
    urlPath: '/404.html',
    dates: [],
    excluded: true
  }]);
  var problems = problemsFor([
    [SITE + '/2026/09/21/blog-repo-cleanup/', '2026-09-28'],
    [SITE + '/about/index.html', '2026-07-24'],
    [SITE + '/404.html', '2026-09-28']
  ], sources);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /404/);
});

test('collectSources 从仓库源文件认出文章与页面', function () {
  var byUrl = {};
  verify.collectSources(path.join(root, 'source')).forEach(function (s) {
    byUrl[s.urlPath] = s;
  });
  assert.equal(byUrl['/2026/09/21/blog-repo-cleanup/'].dates.indexOf('2026-09-28') !== -1, true);
  assert.equal(byUrl['/about/index.html'].dates.indexOf('2026-07-24') !== -1, true);
});

test('每个页面源文件都带 date 或标了 sitemap: false', function () {
  var missing = verify.collectSources(path.join(root, 'source'))
    .filter(function (s) { return s.kind === 'page' && !s.excluded && !s.dates.length; })
    .map(function (s) { return s.source; });
  assert.deepEqual(missing, []);
});

test('build 脚本含 verify', function () {
  var pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.verify, 'node scripts/verify-build.js');
  assert.match(pkg.scripts.build, /npm run verify/);
});
