// 构建期注入 commit 信息（2026-08-18 移植自 SanYeCao-blog BuildHashBlocks 思路）
// 优先读 CF Pages 构建环境变量，本地构建回退 git rev-parse HEAD。
// 输出到 source/_data/commit.json，footer.ejs 通过 site.data.commit 渲染。
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let sha = '';
try {
    sha = (process.env.CF_PAGES_COMMIT_SHA || '').trim();
} catch (e) {
    /* env 读取不抛异常，占位 */
}
if (!sha) {
    try {
        sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (e) {
        console.warn('[commit-data] git rev-parse 失败，跳过 commit 注入:', e.message);
        process.exit(0);
    }
}
if (!/^[0-9a-f]{40}$/i.test(sha)) {
    console.warn('[commit-data] 非法的 commit sha，跳过注入:', sha);
    process.exit(0);
}

const dataDir = path.join(__dirname, '..', 'source', '_data');
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'commit.json'), JSON.stringify({ sha }));
console.log('[commit-data] sha=' + sha);
