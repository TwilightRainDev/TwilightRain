/**
 * 把 `git log --date=short --pretty=format:%ad<TAB>%s` 的输出解析为时间线事件。
 * 纯函数，无 IO，可单测。
 *
 * 口径（2026-09-25 拍板）：除维护类前缀之外全部算事件。
 * 不用「feat 才算」，因为本轮最大的功能变化（提示块语法收敛）提交类型是 refactor，
 * 按 feat 白名单会漏掉；放宽后仍要滤掉 docs/chore/style/test 这类噪音。
 */
'use strict';

var EXCLUDED_PREFIXES = ['docs', 'chore', 'style', 'test'];

// `feat:` / `feat(scope):` / `feat!:` 都剥成同一形状
var PREFIX_RE = /^([a-z]+)(?:\([^)]*\))?!?:\s*/;
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {string} stdout
 * @param {{ exclude?: string[] }} [opts]
 * @returns {{ date: string, title: string, desc: string }[]}
 */
function parseGitLog(stdout, opts) {
  var excluded = (opts && opts.exclude) || EXCLUDED_PREFIXES;
  var out = [];
  var lines = String(stdout || '').split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.trim()) continue;
    var tab = line.indexOf('\t');
    if (tab === -1) continue;
    var date = line.slice(0, tab).trim();
    var subject = line.slice(tab + 1).trim();
    if (!DATE_RE.test(date) || !subject) continue;

    var m = subject.match(PREFIX_RE);
    if (m) {
      if (excluded.indexOf(m[1]) !== -1) continue;
      subject = subject.slice(m[0].length);
    }
    if (!subject) continue;
    out.push({ date: date, title: subject, desc: '' });
  }
  return out;
}

module.exports = {
  parseGitLog: parseGitLog,
  EXCLUDED_PREFIXES: EXCLUDED_PREFIXES
};
