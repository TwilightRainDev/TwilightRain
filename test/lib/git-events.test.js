'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { parseGitLog, EXCLUDED_PREFIXES } = require('../../scripts/lib/git-events');

const LOG = [
  '2026-09-21\trefactor(admon): 提示块语法收敛为 :::admon[类型 可选标题]',
  '2026-09-21\tdocs: 修正三AI门禁流水线的 excerpt',
  '2026-08-25\tfeat: 新增博客 Flash 中国特供版修复实录',
  '2026-08-21\t推送Hexo源码到Cloudflare Pages',
  '2026-08-17\tchore: bump sharp from 0.35.3 to 0.35.4',
  '',
  'not-a-date\t应被丢弃'
].join('\n');

test('parseGitLog 过滤维护类前缀并剥掉类型前缀', () => {
  const events = parseGitLog(LOG);
  assert.deepStrictEqual(events, [
    { date: '2026-09-21', title: '提示块语法收敛为 :::admon[类型 可选标题]', desc: '' },
    { date: '2026-08-25', title: '新增博客 Flash 中国特供版修复实录', desc: '' },
    { date: '2026-08-21', title: '推送Hexo源码到Cloudflare Pages', desc: '' }
  ]);
});

test('parseGitLog 保留没有类型前缀的历史提交', () => {
  const events = parseGitLog('2026-07-21\t更换主题为 hexo-theme-ink（hoytzhang）');
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].title, '更换主题为 hexo-theme-ink（hoytzhang）');
});

test('parseGitLog 丢弃空行与畸形行', () => {
  assert.deepStrictEqual(parseGitLog('\n\t\n2026-09-21\t'), []);
});

test('parseGitLog 支持自定义排除集', () => {
  const events = parseGitLog('2026-09-21\tfeat: A\n2026-09-21\tdocs: B', { exclude: [] });
  assert.strictEqual(events.length, 2);
});

test('EXCLUDED_PREFIXES 含 docs/chore/style/test', () => {
  assert.deepStrictEqual(EXCLUDED_PREFIXES, ['docs', 'chore', 'style', 'test']);
});
