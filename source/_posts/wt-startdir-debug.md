---
title: Windows Terminal酱的暴走！打开目录的连环物语。
excerpt: %CD%这个伪神欺骗了所有人，我查遍注册表视图，然后用VBS脚本把窗口送进了虚数之海。
date: 2026-08-25 22:45:00
tags:
  - Windows
  - Windows Terminal
  - 调试
categories:
  - 技术笔记
---

> 你所生活的世界，不过是cmd.exe的一场梦。  
> —— 某位戴着红领巾的Lain（不是）

那一天，人类终于回想起了，被**C:\Windows\system32**支配的恐惧。

说人话，最近 Windows Terminal 酱抽风了。无论从开始菜单、资源管理器地址栏敲 `wt`，还是在终端里敲 `wt`，新窗口一律落在 `C:\Windows\system32`。这一定，是世界的意志吧！（并不是）
让Claude帮忙排查，过程比想象中曲折，中间还翻了一次车，差点被它写的脚本卡到干不了活，气晕233。

## 一，偽物是 settings.json 里的 %__CD__%

第一嫌疑就潜伏在**settings.json**的深处。

```json
"defaults": { "startingDirectory": "%__CD__%" }
```

文件修改时间是当天 22:05，和「终端开始暴走」对得上。

`%__CD__%` 是 cmd.exe 的动态伪变量，展开结果是"当前目录加反斜杠"。
这类伪变量只活在 cmd 自己的展开逻辑里，不是真实环境变量。
Windows Terminal酱试图从自己的进程环境块（Process Environment Block）中读取这个变量，理所当然地，就会有。

:::admon[caution 失败]
**NUL**！！！
:::

解析失败就回退，回退目标的先知之地是 `C:\Windows\System32`，所以无论从哪个入口打开，都落在 system32，wt酱的蜜汁宽容呢（笑）。

最迷惑人的一步出现在验证环节。

我在PowerShell里执行 `echo $env:__CD__`，居然能打出当前目录，看起来这变量是真的。
「什么嘛，这不是有吗——！」
我兴奋地把cmd、bash、python、甚至node.js都拉出来测了一圈。  
注册表HKCU、HKLM，两个根键翻了个底朝天。  
全部！！！**查询失败**。

:::admon[important 真相只有一个]
 `$env:__CD__` 属于 PowerShell 自己提供的伪动态值，环境块里根本没有这条。
网上流传的「用 `%__CD__%` 让WT跟随当前目录」的说法，八成是哪个萌新在PowerShell里试了一下，「哦！！！！有值！」然后就发帖了www。
**信了你就输了。**
:::

删掉这行之后，落点变成 `C:\Users\hxdn`，不再回退 system32。system32的噩梦，第一阶段，**解除**了哟。

## 二，WT 1.24 根本不继承调用方目录

WT 1.24の掟～ 受け継がれぬディレクトリ

Claude说，「地址栏敲`wt`什么的，应该会继承当前目录吧？」

测了。**错的。** （Claude酱尼在干神魔鸭！！！）

Windows Terminal 1.24.11911.0 的行为是。

- 不设 startingDirectory 时，一律落在 `%USERPROFILE%`，从终端敲 `wt` 也一样，不会继承调用方的当前目录。
- 地址栏也没救。`wt.exe` 是应用执行别名（App Execution Alias），从资源管理器启动时，当前目录在别名转发那一步就丢了。

Windows Terminal酱根本不知道你在哪个文件夹。  
她只是一如既往地，回到初始の地。想就地打开，只能显式传目录：`wt -d .`。

> 就像你不能指望绫波丽对你笑一样。那是设定（什么？！）。

## 三，顺手修了 Win+X 的空"起始位置"

Win+X 菜单里 `01 - Command Prompt.lnk` 和 `01a - Windows PowerShell.lnk` 的"起始位置"，**空っぽ**（笑）。
从那里打开cmd或PowerShell会像被世界遗忘的孩子，孤独地落在system32。
我流着泪，把它们改成了 `%HOMEDRIVE%%HOMEPATH%`，和另外两个（02 和 02a）保持一致。

## 四，右键菜单查漏了注册表视图，白装了一个重复项

为了让资源管理器里「就地打开」可靠，先检查了右键菜单是否已装。
Claude检查时只看了 `Directory\shell` 这类 shell 动词。

- 没有查 `shellex\MenuHandler`。
- 没有查 `ContextMenuHandlers`
- 没有查 WOW6432Node 32 位视图
- 没有查 AppX 包清单

得出"未安装"的结论。（Claude酱尼又在干神魔鸭！！！）

「没装呢。」Claude酱微笑着装了自己的「Open in Windows Terminal here」。（你为什么要笑啊！！！）

结果右键菜单里出现了两个终端条目。Windows 10 22H2系统内置的「在终端中打开（T）」一直都在。
温柔地，安静地被Claude漏看了。（悲）最后我把加的三个注册表键全部删掉，保留系统项。

> 教训：查注册表菜单，要从动词、扩展处理器、32位视图到包清单全部过一遍。  
> 漏一个，就是命运的岔路。（别TM中二了好吗！！）

## 五，双击 .cmd 的坑：脚本把窗口藏起来了

修双击 `.cmd` 文件的问题时，我写了VBS辅助脚本，`sh.Run cmdline, 0, False`
0这个数字，带着圣洁的「安静启动」光环，在我脑海中浮现。（我想掐死半个小时前的自己）
那是**？！SW_HIDE！？**。
0号窗口样式居然是完全隐藏启动进程的主窗口，我的大脑仿佛是离开了地面的猩猩。（离开了Claude酱的人类已经无法生活自理，确信）

双击 `test.cmd`。无反应。  
任务管理器里，「Windows Terminal」进程却在后台，安静地小脑宕机。  
屏幕空空如也。我当时**急得像碇真嗣看到使徒从海面升起。**（什么狗屁比喻233……）

查文档得到`WScript.Shell.Run` 第二个参数，0到11，每个数字都有明确含义。  
0是隐藏，1是显示。改成 `1`。  窗口出现了。  落地位置正确。  世界恢复色彩。

> VBS是老了。（确信）

## 六，最终状态和经验

| 项目 | 状态 |
|---|---|
| 双击 .cmd / .bat | 在文件所在目录打开，窗口保持 |
| 右键菜单 | 只剩系统内置"在终端中打开（T）" |
| settings.json | 无 startingDirectory（`%__CD__%` 已删） |
| Win+X 01 / 01a | 起始位置 = `%HOMEDRIVE%%HOMEPATH%` |

几条经验。

- 伪变量不是环境变量。某个 shell 里"看起来有值"（`$env:__CD__` 会骗人），不等于进程环境里有。
- Windows 的当前目录继承有三道坑。应用执行别名丢目录、UAC 提权重置目录、Explorer 家族启动回退 `%USERPROFILE%`。
- 排查时留意文件修改时间，`settings.json` 的 22:05 直接指向"最近改动"。
- 一次改一处，备份先行，改错了立刻还原。
- 人卡住的时候，先给一条立刻能用的命令，再慢慢修。
