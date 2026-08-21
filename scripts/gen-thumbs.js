/**
 * 从 source/img/ori 生成 source/img/360px（居中裁切 360×360）。
 * CLI：node scripts/gen-thumbs.js [--force]
 * 亦可被 scripts/img-thumbs.js（before_generate）require。
 */
'use strict';

var fs = require('fs');
var path = require('path');

var SIZE = 360;
var RASTER_RE = /\.(jpe?g|png|webp|gif)$/i;

/**
 * @param {{ rootDir: string, force?: boolean, log?: function }} opts
 * @returns {Promise<{ made: number, skipped: number, errors: string[] }>}
 */
async function generateThumbs(opts) {
  var rootDir = opts.rootDir;
  var force = !!opts.force;
  var log = opts.log || function () {};
  var sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    throw new Error('缺少依赖 sharp，请在 blog/ 目录执行 npm install');
  }

  var oriRoot = path.join(rootDir, 'source', 'img', 'ori');
  var outRoot = path.join(rootDir, 'source', 'img', '360px');
  var result = { made: 0, skipped: 0, errors: [] };

  if (!fs.existsSync(oriRoot)) {
    log('gen-thumbs: source/img/ori 不存在，跳过');
    return result;
  }

  var files = listRasterFiles(oriRoot);
  for (var i = 0; i < files.length; i++) {
    var absIn = files[i];
    var rel = path.relative(oriRoot, absIn);
    var absOut = path.join(outRoot, rel);
    try {
      if (!force && shouldSkip(absIn, absOut)) {
        result.skipped++;
        continue;
      }
      fs.mkdirSync(path.dirname(absOut), { recursive: true });
      var pipeline = sharp(absIn).rotate().resize(SIZE, SIZE, {
        fit: 'cover',
        position: 'centre'
      });
      var ext = path.extname(absIn).toLowerCase();
      if (ext === '.png') {
        await pipeline.png({ compressionLevel: 8 }).toFile(absOut);
      } else if (ext === '.webp') {
        await pipeline.webp({ quality: 82 }).toFile(absOut);
      } else if (ext === '.gif') {
        // 静态帧：转 jpeg 展示图（灯箱仍可指回 ori gif）
        absOut = absOut.replace(/\.gif$/i, '.jpg');
        await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(absOut);
      } else {
        await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(absOut);
      }
      result.made++;
      log('gen-thumbs: wrote ' + path.relative(rootDir, absOut).replace(/\\/g, '/'));
    } catch (err) {
      var msg = rel.replace(/\\/g, '/') + ': ' + (err && err.message ? err.message : String(err));
      result.errors.push(msg);
      log('gen-thumbs ERROR: ' + msg);
    }
  }
  return result;
}

function listRasterFiles(dir) {
  var out = [];
  if (!fs.existsSync(dir)) return out;
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var ent = entries[i];
    var full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out = out.concat(listRasterFiles(full));
    } else if (RASTER_RE.test(ent.name)) {
      out.push(full);
    }
  }
  return out;
}

function shouldSkip(absIn, absOut) {
  if (!fs.existsSync(absOut)) return false;
  var sIn = fs.statSync(absIn);
  var sOut = fs.statSync(absOut);
  return sOut.mtimeMs >= sIn.mtimeMs && sOut.size > 0;
}

module.exports = { generateThumbs, SIZE };

if (require.main === module) {
  var root = path.join(__dirname, '..');
  var force = process.argv.indexOf('--force') !== -1;
  generateThumbs({
    rootDir: root,
    force: force,
    log: function (m) { console.log(m); }
  }).then(function (r) {
    console.log('gen-thumbs done: made=' + r.made + ' skipped=' + r.skipped + ' errors=' + r.errors.length);
    if (r.errors.length) process.exitCode = 1;
  }).catch(function (e) {
    console.error(e);
    process.exit(1);
  });
}
