# ADR-0009：IndexNow 密钥文件保留并登记归属

## 状态

已实施（2026-09-25）

## 背景

`source/7facecda-3b42-4e79-ac12-ccddb9a0270e.txt`（37 字节，内容即文件名那串 UUID）
长期来历不明：`_config.yml` 的 `skip_render` 没登记它，文档里也没有归属说明，
每一轮代码扫描都会把它当异常文件捞出来。

2026-09-25 用 git 追查确定：该文件由 `4a9964f feat: 站点收录优化——canonical、robots.txt、IndexNow key`
（2026-08-17 17:09）引入，与 `robots.txt` 同一分钟写入。它是 **IndexNow 的密钥文件**，
格式为「文件名是 key、内容是同一个 key、放在站点根」。

而 `EXCLUDED.md` 已拍板排除「IndexNow 提交」环节（理由：SEO 辅助，与主题无关，要做应走独立 CI）。
即：密钥在，但它服务的提交环节从未实现。

## 决策

保留密钥文件并登记归属：

- 加入 `_config.yml` 的 `skip_render`，与 `BingSiteAuth.xml` 同等对待
- `EXCLUDED.md` 的 IndexNow 条目改写为「密钥已就位，提交环节未做」
- 提交环节本身进 `BACKLOG.md`，明确不在 Hexo 构建链路里实现

## 后果

- 密钥文件不再是「来历不明」项，后续扫描跳过
- 站点根继续输出该文件（此前已输出，行为不变）
