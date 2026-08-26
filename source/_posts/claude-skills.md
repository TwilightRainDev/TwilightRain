---
title: 把踩过的坑编译成技能
excerpt: 在特殊环境下，踩坑总结规则，建成技能仓库。
date: 2026-08-13 15:00:00
tags:
  - Claude Code
  - PowerShell
  - 技能
categories:
  - 代码仓库
cover: /img/360px/covers/claude-skills.jpg
---

# 把踩过的坑编译成技能

我在 Windows 上用 Claude Code 干活，环境有点特殊，H 盘是 exFAT，路径里有中文，终端默认 GBK，脚本用 PowerShell 写，核心逻辑扔给 Python 跑。这四个条件凑齐，乱码就是日常，不是事故。

最早几次我还认真排查，编码声明写没写？管道是不是在作怪？后来学乖了，每踩一个坑就把结论写成一条规则，攒多了变成一个技能（skill），让 Claude Code 在需要的时候自己读。

::card{type="github" repo="TwilightRainDev/claude-skills" desc="这个仓库就是攒下来的东西"}


## EncodingGuide，一条铁律，七个陷阱

EncodingGuide 全名"Windows PowerShell 中文编码安全基线"，内容是纯实战。它只有一条铁律。

绝对不要把含中文的内容通过管道传给 `python -c`，也不要用 heredoc 传。

PowerShell 的管道会自己解析 Unicode 和转义符，中文变 `??`、脚本崩溃、JSON 乱码，根源都在这一条。技能围绕它列了七个致命陷阱，挑几个说说。

`Out-File -Encoding UTF8` 会往文件头写 BOM（`EF BB BF`）。TOML 解析器不认这个，直接报 `Invalid statement (at line 1, column 1)`。所以写 pyproject.toml 得用 `[System.IO.File]::WriteAllText` 配 `UTF8Encoding($false)` 写出无 BOM 文件。

`json.dump` 忘写 `ensure_ascii=False`，整个文件变成 `\uXXXX` 地狱。`indent=2` 和末尾换行也别省，git diff 会感谢你。

`-Path` 会做通配符展开，文件名里的 `[1]` 会被吃掉。要用 `-LiteralPath`。

这些规则单独看都不高深，值钱的是它们被写成清单，AI 写脚本时逐条对照，而不是临场发挥。

技能最后一节我尤其喜欢，叫"检查文件内容与元数据时的误判陷阱"。它来自一次真实误判，我用 `head -6 SKILL.md | grep description` 检查技能描述字段，输出看起来是空的，差点判定文件损坏。其实 YAML 的 `|` 是多行块标量指示符，正文在后面的缩进行里，head 把它截掉了。这个教训和技能主题同构，在 Windows 环境里，直觉方法的输出不可轻信，下结论前先怀疑读取方法本身。说"文件坏了"之前，至少用两种独立方式交叉验证。

## CreatePrompts，先问清楚，再原样转录

CreatePrompts 是另一个画风。它不是排坑清单，是流程设计，两阶段，刨根问底，然后生成。

阶段一，苏格拉底式澄清。AI 扮演需求架构师，只提问，不给答案，不评价。六个维度，核心目标、受众、场景、流程、约束、成功标准。规则很硬，每轮一个问题，不超过三十个字。只问开放式问题。不猜测。用户说"没想过"就标记 `[未指定]`，绝不用自己的知识补空白。

阶段二，刚性转录。角色整个翻过来，AI 变成编译器，把确认过的需求快照机械翻译成提示词模板。缺失字段必须写 `[未指定]`。不许出现"建议""可以"这类词。不修饰用户的措辞。输出每句话都要能追溯到快照。

为什么把角色切得这么死？因为我发现同一个模型，澄清阶段共情越到位，生成阶段就越喜欢顺手把没说清的地方补上，补的往往是它自己的猜测而不是你的需求。两阶段的意义就是，先问清楚，再原样转录，中间不让模型发挥。

## 技能和笔记的区别

这两个技能都不大。但技能和笔记的区别在于，笔记要自己翻，技能在合适的时机自己跳出来。踩坑攒成技能，下次 AI 动手之前先被提醒，比事后再查文档省事得多。

仓库是MIT 许可，目录拷进 `~/.claude/skills/` 就能用。后续踩到新坑会继续往里加。
