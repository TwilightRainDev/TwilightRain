---
title: Flash的中国？！特供！？版。
excerpt: flash.cn 最新特供版的版本过旧弹窗和闪退，UAC静默之谜。
date: 2026-08-26 12:30:00
tags:
  - Flash
  - 浏览器
  - hosts
  - 排坑
  - 逆向
categories:
  - 技术笔记
---

> 2020 年 12 月 31 日，Adobe 官方停止支持 Flash。中国大陆除外，因为"代理"还在用 flash.cn 续命，给你弹广告、弹"版本过旧"、弹闪退。

最近玩 Flash 小游戏，Flash 酱一反常态地暴躁。游戏加载到一半，弹窗"您的 Flash 版本过旧，请升级"，点掉之后直接闪退。而且这待遇是**中国 IP 限定**的，症状集中指向 flash.cn 特供版。

## 一、实锤，本机装的是 flash.cn 特供版 34.0.0.282

查安装日志 `C:\Windows\SysWOW64\Macromed\Flash\FlashInstall32.log`，

```
=M/M/34.0.0.282 2023-05-20+09-46-41.993=
```

34.0.0.282？Adobe 官方最后一版是 **32.0.0.465**（2020 年 12 月）。
这个34.x是谁编出来的？flash.cn代理商在官方停更后继续"维护"的版本号比官方还高两代，里面塞了自己的更新检查逻辑，连上自家服务器（flash.cn 域名），就通知你"版本过旧"，顺手弹广告。什么叫做最新版版本过旧？！！！！！！（官方正版受害者233）

你走吧，太老了。（Flash酱的不屑）

本机 hosts 里原本已有 Adobe 官方域名的屏蔽（`geo2.adobe.com`、`fpdownload.macromedia.com`），但漏了 flash.cn 自家的域名。

## 二、Resources 里的纪念版方案

::card{type="link" url="https://tieba.baidu.com/p/8576795029" title="贴吧链接" desc="教程灵感来源"}
::card{type="link" url="https://wwa.lanzoub.com/iIaLi16w3bxc" title="贴吧对应的网盘" desc="网盘包来源"}


`A:\work_zone\Resources` 下有两个包，

1. **Flash_Player_v32.0.0.465 三件套**，官方最终版（ActiveX / NPAPI / PPAPI），README 说"最好全装"
2. **文件夹内文件拖入C盘覆盖**，一个 0 字节的 `settings.sol` + 一份 hosts 模板

原理很直白，flash.cn 版的行为状态被写进 Flash 的全局设置（settings.sol），同时它连自家服务器判断要不要弹窗。把 settings.sol 清空 + hosts 屏蔽域名，双管齐下。

## 三、动手，备份、清空、补屏蔽

备份放到 `A:\work_zone\Temp\FlashFix_backup_20260826`（原 hosts + 整个 Flash Player 设置目录）。

### settings.sol 清空

两个位置，

- `%APPDATA%\Macromedia\Flash Player\macromedia.com\support\flashplayer\sys\settings.sol`
- 同目录下 `#local\settings.sol`

用包里的 0 字节文件覆盖。注意同级的 `#SharedObjects` 目录是**游戏存档**（相当于 localStorage），不能动，README 那句"用 Everything 删掉所有 settings.sol"是有坑的，照做会连游戏进度一起清掉。

### hosts 只补一行

包里的 hosts 是纯净模板，但本机 hosts 有 Pixiv、Docker、Steam 的条目（才不告诉你我劫持这些主机用来干什么呢！），**不能整包覆盖**。只追加，`127.0.0.1 flash.cn`

结果当场翻车，原文件末尾没有换行符，`Add-Content` 追加把内容拼进了上一行，变成 `# Adobe End127.0.0.1 flash.cn`，整行是注释，屏蔽无效。用正则把行拆开才修好。

:::admon[caution 教训]
改 hosts 先看文件末尾有没有换行符。追加内容被拼进注释行就是静默失效，比没改还隐蔽。
:::

## 四、三件套安装，两个顺利，一个装了个寂寞

- **ActiveX**，SFX 后台运行，自己提权装好了（Flash.ocx 32/64 位 + 注册表 32.0.0.465）
- **PPAPI**，提权脚本一次成功（pepflashplayer.dll 32/64 + manifest.json）
- **NPAPI**，两次"运行完成"，什么都没装

NPAPI 那个安装器跑了 45 秒显示完成，但 NPSWF.dll 没落地、注册表没有 FlashPlayerPlugin 键。勾起了我的好奇。

## 五、解包取证，批处理第一行就是答案

安装器是 7-Zip 自解压包（SFX），里面藏着安装批处理。解包过程，

1. Python 的 py7zr 能读到档案列表，但里面的 DLL 用了 BCJ2 过滤器，解不出来
2. 本机有 msys2，`pacman -S p7zip` 一条命令装好
3. `7z x` 直接解带 PE 头的 exe，7z 会自动跳过 stub

看到批处理第一行，一切豁然开朗，

```bat
@ECHO OFF&(PUSHD "%~DP0")&(REG QUERY "HKU\S-1-5-19">NUL 2>&1)||(
powershell -Command "Start-Process '%~sdpnx0' -Verb RunAs"&&EXIT)
```

它检测自己是否跑在管理员上下文（`HKU\S-1-5-19` 是系统账户的注册表 hive），不是就 `Start-Process -Verb RunAs` 提权重启自己。**UAC 弹窗没人点 → 静默 EXIT**。之前两次失败都卡在这一环，安装器自己提权重启，UAC 没被确认，安装流程就悄悄结束了。

:::admon[important 真相]
"安装器运行了但什么都没装"，大概率是安装器内部有提权重启逻辑，UAC 被忽略就静默退出。看文件、看注册表，别信安装器自己报的"完成"。
:::

## 六、手动安装 NPAPI

包已经解开，直接手动装，

- `x64files\NPSWF.dll` → `System32\Macromed\Flash\`
- `x32files\NPSWF.dll` + `FlashPlayerPlugin.exe` + `flashplayer.xpt` → `SysWOW64\Macromed\Flash\`
- 注册表，`Macromedia\FlashPlayerPlugin` 和 `MozillaPlugins\@adobe.com/FlashPlayer`（含 Wow6432Node 32 位视图），Version = 32.0.0.465、PlayerPath、XPTPath

提权跑一遍脚本，验证通过。

## 七、最终状态

| 项目 | 状态 |
|---|---|
| ActiveX | Flash.ocx 32/64 + 注册表 32.0.0.465 |
| NPAPI | NPSWF.dll 32/64 + FlashPlayerPlugin 注册表 |
| PPAPI | pepflashplayer.dll 32/64 + 注册表 32.0.0.465 |
| hosts | flash.cn 已屏蔽，原有条目全部保留 |
| settings.sol | 0 字节（sys\ 与 #local\） |
| mms.cfg | AutoUpdateDisable=1、DisableAnalytics=1 |
| 备份 | A:\work_zone\Temp\FlashFix_backup_20260826 |

## 经验

- **中国特供版续命软件的原罪**，版本号比官方高、弹窗、更新检查全都自己说了算。能用官方版就不用代理版。（代理商全家活暗暗了）
- **安装器"完成"不等于装上**。文件落没落地、注册表有没有键，才是真相。
- **SFX 自解压包可以解包看源码**。7z 直接解 exe。py7zr 遇到 BCJ2 就换 p7zip（msys2 一个 pacman 搞定）。
- **改 hosts 只补不盖**。先备份，注意末尾换行。
- **settings.sol 清空是合法的**，但同目录的 #SharedObjects 是游戏存档，删了就是进度清零。

## 尾声

Flash 酱安静下来了。版本 32.0.0.465，官方最终版，不再有"版本过旧"的问候，也不再有闪退的告别。

玩你的臭游戏去吧。（什么狗公主，粉红兔子，羔羊，lostlife，才没有听说过呢，笑）
