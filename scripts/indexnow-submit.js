/**
 * 独立于 Hexo 构建：拉线上 sitemap，向 IndexNow 提交 URL。
 * 见 docs/adr/0017-indexnow-submit.md。不要从 after_generate 或 npm run build 调用。
 */
'use strict';

var fs = require('fs');
var path = require('path');

var DEFAULT_HOST = 'twilightrain.com';
var DEFAULT_SITEMAP = 'https://twilightrain.com/sitemap.xml';
var DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
var KEY_ID = '7facecda-3b42-4e79-ac12-ccddb9a0270e';
var DEFAULT_KEY_LOCATION = 'https://twilightrain.com/' + KEY_ID + '.txt';
var MAX_URLS = 10000;

function defaultKeyFile() {
  return path.join(__dirname, '..', 'source', KEY_ID + '.txt');
}

function readKey(keyFile) {
  var raw = fs.readFileSync(keyFile, 'utf8').trim();
  if (raw !== KEY_ID) {
    throw new Error('IndexNow 密钥文件内容必须与文件名 UUID 一致');
  }
  return raw;
}

function parseSitemapLocs(xml) {
  var locs = [];
  var re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  var match;
  while ((match = re.exec(xml))) {
    locs.push(match[1].trim());
  }
  return locs;
}

function urlsForHost(locs, host) {
  var out = [];
  for (var i = 0; i < locs.length; i++) {
    var loc = locs[i];
    var parsed;
    try {
      parsed = new URL(loc);
    } catch (e) {
      continue;
    }
    if (parsed.protocol !== 'https:') continue;
    if (parsed.hostname !== host) continue;
    out.push(parsed.href);
  }
  return out;
}

function buildPayload(opts) {
  var urls = opts.urls || [];
  if (!urls.length) {
    throw new Error('IndexNow urlList 为空');
  }
  if (urls.length > MAX_URLS) {
    throw new Error('IndexNow urlList 超过 ' + MAX_URLS + ' 条，拒绝截断');
  }
  return {
    host: opts.host,
    key: opts.key,
    keyLocation: opts.keyLocation,
    urlList: urls
  };
}

async function submitIndexNow(opts) {
  var fetchImpl = opts.fetchImpl || fetch;
  var res = await fetchImpl(opts.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(opts.payload)
  });
  var ok = res.status === 200 || res.status === 202;
  return { status: res.status, ok: ok };
}

function parseArgs(argv) {
  return { dryRun: argv.indexOf('--dry-run') !== -1 };
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function run(opts) {
  opts = opts || {};
  var fetchImpl = opts.fetchImpl || fetch;
  var host = opts.host || DEFAULT_HOST;
  var sitemapUrl = opts.sitemapUrl || DEFAULT_SITEMAP;
  var endpoint = opts.endpoint || DEFAULT_ENDPOINT;
  var keyFile = opts.keyFile || defaultKeyFile();
  var keyLocation = opts.keyLocation || DEFAULT_KEY_LOCATION;
  var waitMs = Number(opts.waitMs || 0);
  var dryRun = !!opts.dryRun;

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  var key = readKey(keyFile);
  var sitemapRes = await fetchImpl(sitemapUrl);
  if (!sitemapRes.ok) {
    throw new Error('拉取 sitemap 失败：HTTP ' + sitemapRes.status);
  }
  var xml = await sitemapRes.text();
  var urls = urlsForHost(parseSitemapLocs(xml), host);
  var payload = buildPayload({
    host: host,
    key: key,
    keyLocation: keyLocation,
    urls: urls
  });

  if (dryRun) {
    return { dryRun: true, count: payload.urlList.length, payload: payload };
  }

  var result = await submitIndexNow({
    fetchImpl: fetchImpl,
    endpoint: endpoint,
    payload: payload
  });
  if (!result.ok) {
    throw new Error('IndexNow 提交失败：HTTP ' + result.status);
  }
  return { dryRun: false, count: payload.urlList.length, status: result.status };
}

async function main(argv) {
  var args = parseArgs(argv || process.argv.slice(2));
  var waitSeconds = Number(process.env.INDEXNOW_WAIT_SECONDS || 0);
  var result = await run({
    dryRun: args.dryRun,
    waitMs: waitSeconds > 0 ? waitSeconds * 1000 : 0
  });
  if (result.dryRun) {
    console.log('indexnow: dry-run ' + result.count + ' URLs');
    console.log(JSON.stringify(result.payload, null, 2));
  } else {
    console.log('indexnow: submitted ' + result.count + ' URLs (HTTP ' + result.status + ')');
  }
}

module.exports = {
  DEFAULT_HOST: DEFAULT_HOST,
  DEFAULT_SITEMAP: DEFAULT_SITEMAP,
  DEFAULT_ENDPOINT: DEFAULT_ENDPOINT,
  DEFAULT_KEY_LOCATION: DEFAULT_KEY_LOCATION,
  KEY_ID: KEY_ID,
  MAX_URLS: MAX_URLS,
  parseSitemapLocs: parseSitemapLocs,
  urlsForHost: urlsForHost,
  buildPayload: buildPayload,
  readKey: readKey,
  submitIndexNow: submitIndexNow,
  parseArgs: parseArgs,
  run: run,
  main: main
};

if (require.main === module) {
  main().catch(function (err) {
    console.error('indexnow: ' + err.message);
    process.exit(1);
  });
}
