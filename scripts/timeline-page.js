/**
 * 站点展柜 /timeline/：事件来自构建期解析的 git 日志。
 *
 * 数据源优先级：
 *   1. git 日志（构建环境有完整历史时）
 *   2. front matter 的 items（浅克隆、无 git、解析为空时兜底）
 *
 * 渲染仍走共享渲染器 lib/timeline-renderer.js（ADR-0005），类名不变。
 */
'use strict';

var execFileSync = require('child_process').execFileSync;
var renderPageTimeline = require('./lib/timeline-renderer').renderPageTimeline;
var parseGitLog = require('./lib/git-events').parseGitLog;

var cachedEvents = null;

function readGitEvents() {
  try {
    var shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: hexo.base_dir,
      encoding: 'utf8'
    }).trim();
    if (shallow === 'true') {
      hexo.log.warn(
        'timeline: 当前为浅克隆，git 日志不完整，改用 front matter 兜底列表。' +
        '请在 Cloudflare Pages 构建命令前置 `git fetch --unshallow`。'
      );
      return [];
    }
  } catch (e) {
    hexo.log.warn('timeline: 无法判断克隆深度，继续尝试读取 git 日志');
  }

  try {
    var stdout = execFileSync(
      'git',
      ['log', '--date=short', '--pretty=format:%ad\t%s'],
      { cwd: hexo.base_dir, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
    );
    return parseGitLog(stdout);
  } catch (e) {
    hexo.log.warn('timeline: 读取 git 日志失败，改用 front matter 兜底列表：' + e.message);
    return [];
  }
}

hexo.extend.filter.register('before_generate', function () {
  cachedEvents = readGitEvents();
  if (cachedEvents.length) {
    hexo.log.info('timeline: 从 git 日志取到 ' + cachedEvents.length + ' 条事件');
  }
});

/**
 * @param {{ date?: string, title?: string, desc?: string }[]} [fallbackItems]
 * @returns {string}
 */
hexo.extend.helper.register('timeline_page_html', function (fallbackItems) {
  var items = (cachedEvents && cachedEvents.length) ? cachedEvents : fallbackItems;
  return renderPageTimeline(items);
});
