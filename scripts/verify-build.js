/**
 * 构建后校验 public/sitemap.xml：每个 URL 的 lastmod 必须与源文件 front matter 对得上。
 * 挂在 npm run build 尾巴上——产物不对就让构建失败，挡住 Cloudflare 部署。
 *
 * 为什么不能只看源码：hexo-generator-sitemap 的模板对文章/页面取 post.updated，
 * 而 post.updated 的来源由 _config.yml 的 updated_option 决定。改成 'mtime' 或
 * 页面漏写 date:，lastmod 就会静默变成构建当天，源码里看不出任何异常。
 * 背景与已知残留见 docs/WORKFLOW.md「时间戳口径：sitemap / feed / article:modified_time」一节。
 */
'use strict';

var fs = require('fs');
var path = require('path');

var UTC_OFFSET_MINUTES = 480;

/**
 * 只取 date/updated/sitemap 三个标量，且保留原文。
 * 不用 YAML 解析：日期一旦落成 Date 对象，date-only 与带钟点的写法就分不开了，
 * 而 lastmod 的算法恰恰取决于钟点。
 */
function parseFrontMatter(text) {
  var out = {};
  if (!text) return out;
  var block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(text).replace(/^\uFEFF/, ''));
  if (!block) return out;
  var lines = block[1].split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    var kv = /^(date|updated|sitemap):\s*(.*?)\s*$/.exec(lines[i]);
    if (!kv) continue;
    var value = kv[2].replace(/^['"]|['"]$/g, '');
    if (value) out[kv[1]] = value;
  }
  return out;
}

/**
 * 源文件允许出现的 lastmod，升序。
 * 优先 updated，回落 date；两者都没有返回空数组（调用方据此报错）。
 *
 * 为什么可能有两个候选值：插件自带的 formatDate 是
 * `input => input.toISOString().substring(0, 10)`
 * （node_modules/hexo-generator-sitemap/lib/template.js），直接取该时刻的 UTC 日期；
 * 而 front matter 里不带时区的钟点被解析成 Date 时，用的是**构建机本地时区**——
 * 本机东八区、Cloudflare 是 UTC。于是 `date: 2026-07-25 03:00:00` 会在两种机器上
 * 落成 07-24 与 07-25。放行这两种读法，换来的是同一个脚本在本地与 Cloudflare 上
 * 都能当关卡；收紧到一种就得先固定两边的构建时区。
 */
function expectedLastmod(fm) {
  var raw = fm && (fm.updated || fm.date);
  if (!raw) return [];
  var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(raw).trim());
  if (!m) return [];
  var asWritten = m[1] + '-' + m[2] + '-' + m[3];
  var asLocal = new Date(Date.UTC(
    Number(m[1]), Number(m[2]) - 1, Number(m[3]),
    m[4] ? Number(m[4]) : 0, m[5] ? Number(m[5]) : 0, m[6] ? Number(m[6]) : 0
  ) - UTC_OFFSET_MINUTES * 60000).toISOString().slice(0, 10);
  return asWritten === asLocal ? [asWritten] : [asLocal, asWritten].sort();
}

function parseSitemap(xml) {
  var out = [];
  var re = /<url>\s*<loc>\s*([^<]+?)\s*<\/loc>\s*(?:<lastmod>\s*([^<]*?)\s*<\/lastmod>)?/gi;
  var m;
  while ((m = re.exec(xml))) {
    out.push({ loc: m[1], lastmod: m[2] || '' });
  }
  return out;
}

/**
 * 首页与标签/分类归档页的 lastmod 由插件模板写死成构建当下，跳过不查。
 * 归档页 permalink 形如 /tags/Git/（末尾带斜杠）；/tags/index.html 是页面源文件，照查。
 */
function isTimestampFreePath(pathname) {
  if (pathname === '/') return true;
  return /^\/(?:tags|categories)\/.+\/$/.test(pathname);
}

function pathnameOf(loc, siteUrl) {
  var parsed;
  var base;
  try {
    parsed = new URL(String(loc).trim());
    base = new URL(String(siteUrl));
  } catch (e) {
    return null;
  }
  if (parsed.origin !== base.origin) return null;
  return parsed.pathname;
}

function walkMarkdown(dir, out) {
  var names = fs.readdirSync(dir).sort();
  for (var i = 0; i < names.length; i++) {
    var full = path.join(dir, names[i]);
    if (fs.statSync(full).isDirectory()) {
      walkMarkdown(full, out);
    } else if (/\.md$/.test(names[i])) {
      out.push(full);
    }
  }
  return out;
}

function makeEntry(sourceDir, file, kind) {
  var rel = path.relative(sourceDir, file).split(path.sep).join('/');
  var fm = parseFrontMatter(fs.readFileSync(file, 'utf8'));
  var excluded = fm.sitemap === 'false';
  var urlPath = '';
  if (kind === 'post') {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fm.date || '');
    if (m) {
      urlPath = '/' + m[1] + '/' + m[2] + '/' + m[3] + '/' + path.basename(rel, '.md') + '/';
    }
  } else {
    var stem = rel.replace(/\.md$/, '');
    urlPath = stem.slice(-6) === '/index'
      ? '/' + stem.slice(0, -6) + '/index.html'
      : '/' + stem + '.html';
  }
  return {
    source: 'source/' + rel,
    kind: kind,
    urlPath: urlPath,
    dates: expectedLastmod(fm),
    excluded: excluded
  };
}

/**
 * source/ 下所有会影响 sitemap 的 md：_posts 是文章，其余是页面。
 * 与 hexo 一致地跳过 `_` 开头的目录（_data 之类）。
 */
function collectSources(sourceDir) {
  var out = [];
  var files = walkMarkdown(sourceDir, []);
  for (var i = 0; i < files.length; i++) {
    var rel = path.relative(sourceDir, files[i]).split(path.sep).join('/');
    var segments = rel.split('/');
    var isPost = segments[0] === '_posts';
    var hidden = false;
    for (var j = 0; j < segments.length - 1; j++) {
      if (segments[j].charAt(0) === '_') {
        hidden = true;
        break;
      }
    }
    if (hidden && !isPost) continue;
    out.push(makeEntry(sourceDir, files[i], isPost ? 'post' : 'page'));
  }
  return out;
}

function checkSitemap(opts) {
  var sources = opts.sources || [];
  var entries = parseSitemap(opts.xml || '');
  var byPath = {};
  var problems = [];
  var seen = {};
  var i;

  for (i = 0; i < sources.length; i++) {
    if (sources[i].urlPath) byPath[sources[i].urlPath] = sources[i];
  }

  for (i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var pathname = pathnameOf(entry.loc, opts.siteUrl);
    if (pathname === null) {
      problems.push('站外 URL：' + entry.loc);
      continue;
    }
    if (isTimestampFreePath(pathname)) continue;
    var source = byPath[pathname];
    if (!source) {
      problems.push('sitemap 里有源文件不存在的 URL：' + pathname);
      continue;
    }
    seen[pathname] = true;
    if (source.excluded) {
      problems.push('源文件标了 sitemap: false 却仍被收录：' + source.source);
      continue;
    }
    if (source.dates.indexOf(entry.lastmod) === -1) {
      problems.push('lastmod 与源文件不符：' + pathname
        + '，产物 ' + (entry.lastmod || '（无）')
        + '，源文件应为 ' + (source.dates.join(' 或 ') || '（没写 date，会落到文件 stat 时间）'));
    }
  }

  for (i = 0; i < sources.length; i++) {
    var s = sources[i];
    if (s.kind !== 'post' || s.excluded) continue;
    if (!s.urlPath) {
      problems.push('文章缺 date，算不出 permalink：' + s.source);
    } else if (!seen[s.urlPath]) {
      problems.push('文章没进 sitemap：' + s.source);
    }
  }
  return problems;
}

function main() {
  var root = path.join(__dirname, '..');
  var sitemapFile = path.join(root, 'public', 'sitemap.xml');
  if (!fs.existsSync(sitemapFile)) {
    throw new Error('找不到 public/sitemap.xml，先跑 hexo generate');
  }
  var m = /^url:\s*(\S+)/m.exec(fs.readFileSync(path.join(root, '_config.yml'), 'utf8'));
  if (!m) {
    throw new Error('_config.yml 没写 url');
  }
  var siteUrl = m[1];
  var sources = collectSources(path.join(root, 'source'));
  var problems = checkSitemap({
    xml: fs.readFileSync(sitemapFile, 'utf8'),
    siteUrl: siteUrl,
    sources: sources
  });
  if (problems.length) {
    for (var i = 0; i < problems.length; i++) {
      console.error('verify-build: ' + problems[i]);
    }
    throw new Error('sitemap 校验未通过，共 ' + problems.length + ' 条');
  }
  console.log('verify-build: ' + sources.length + ' 个源文件与 sitemap 一致');
}

module.exports = {
  parseFrontMatter: parseFrontMatter,
  expectedLastmod: expectedLastmod,
  parseSitemap: parseSitemap,
  isTimestampFreePath: isTimestampFreePath,
  collectSources: collectSources,
  checkSitemap: checkSitemap,
  main: main
};

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('verify-build: ' + err.message);
    process.exit(1);
  }
}
