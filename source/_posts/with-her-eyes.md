---
title: 带上她的眼睛。
excerpt: Claude Code 底层套着 DeepSeek，看得见代码却看不见图。8 月 7 号给她装上 llm-vision-mcp，让她有了眼睛。
date: 2026-08-13 11:10:00
tags:
  - AI
  - MCP
  - Claude Code
categories:
  - 技术笔记
cover: /img/360px/covers/with-her-eyes.jpg
---

# 带上她的眼睛

咳咳，众所粥知。刘慈欣这个老不死的电工（手动狗头），写了个短篇，叫带上她的眼睛。里面那妹子飞船怼进地心，黑得伸手不见五指，得靠别人戴传感眼镜替她看草原。

咱寻思，咱养在本地这台破电脑里的Claude Code，不也一个德性？

她没沉在地心，就住在咱C盘角落里瑟瑟发抖，底层套的是DeepSeek。咱给她换了中转，原因很朴素，国内直连Anthropic卡成PPT，还天天封号，谁能遭得住呐。DeepSeek便宜，文本能力没什么好抱怨的，一百万上下文，写代码查资料，稳如老狗。但她看不见，就一睁眼瞎。我甩截图，设计稿，报错弹窗，她只会乖乖回一句：“图我没收到。”（脑补无口萝莉脸好趴）

![](/img/360px/with-her-eyes-1.jpg)

所以遇到要看图的时候，咱就得充当她的眼睛，截图转文字，一句一句描述喂给她。一次两次还挺浪漫，多了就觉得咱像给盲人指路的傻叉（狗头）。她明明就在这台电脑里，凭什么看一张本地的 jpg 还要咱人肉中转？咱受不了了，给她装了github的`me9rez/llm-vision-mcp`。自己动手，丰衣足食。

::card{type="github" repo="me9rez/llm-vision-mcp" desc="Github链接"}

:::admon[important]
得装node依赖！有依赖洁癖的尽快邪灵退散，否则我一个一个退治了！（红白认真脸）
:::

## 七种姿势

这玩意是一个 MCP 服务器，背后起node进程，得把node的依赖加上才成。它的本职是把图片转成文字描述，默认走阿里后端 ModelScope 的 Qwen-VL，免费额度每天 2000 次，对咱这种懒狗来说量大管饱。

它一口气挂了七个龙珠出来，

- analyze_image，通用看图说话，啥都能唠
- analyze_chart，专治各种折线柱状饼图，金融狗狂喜
- extract_text，OCR，抠字眼比律师还准
- code_from_screenshot，截图直接变前端代码，这个咱直接社保
- describe_ui，描述界面长什么样，UI仔末日
- diagnose_error，从报错截图里找线索，debug不用瞪眼
- understand_diagram，理解流程图之类，脑内渲染终结者

听着挺唬人，其实没有魔法。Qwen-VL看图产的是文字，真正理解这些文字的，还是DeepSeek的傻白甜文本模型。视觉信号并没有直接灌进她的大脑，只是变成了文字，让她读得懂。就像给盲人姑娘摸盲文，只不过这次是AI念给AI听。

## 装上，第一张图就跪了

安装一行命令，

```bash
npm install -g @me9rez/llm-vision-mcp
```

然后往 ~/.claude.json 的 mcpServers 里加蜜汁酱料，最终形态是这样的，

```json
"llm-vision-mcp": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "D:/nodejs/node.exe", "C:/Users/hxdn/AppData/Roaming/npm/node_modules/@me9rez/llm-vision-mcp/index.js", "mcp"],
  "env": { "API_KEY": "ms-xxxx" }
}
```

这里面两个坑，Win老狗都懂。一是 cmd /c 套 node.exe 绝对路径，绕开 npx 那破`.cmd`垫片。另一个是 npm exec 本地 bin 优先解析的玄学。折腾得我差点砸键盘，最后试出这个写法，我直接对着屏幕比了个中指（并没有）。

改完配置重启会话，MCP server启动时加载。咱敲了句 claude mcp list，看一眼，看到Connected那一刻，仿佛听见她说了句，欢迎回家，主人。

呐，咱自觉枪毙去了。（元首：七万个嫂夫人挨个Biu！）

然后第一张图就失败了。直接给咱返回 403 。

查了半天，原因荒唐得让咱想笑，ModelScope 要求关联的阿里云账号完成实名认证。没过实名，连免费接口都不给用。咱万万没想到，给 AI 配一双眼睛，还得先向阿里云证明“咱是个人，不是狗”。虽然我确实是条单身狗。
认证完再试，终于通了。拿系统自带的壁纸C:\Windows\Web\Wallpaper\Windows\img0.jpg 丢给 analyze_image，中文描述正常返回。那一刻，我差点泪目，蛇了。

还有个不算坑的小事，1×1的纯色小图，模型啥也没认出来，返回空内容。想了想也算合理，你给朋友看个像素点，朋友回你个白眼，不把你打一顿，说“我涩图呢？”都算好的了。嘛，礼尚往来。

现在她能看见咱发过去的东西了。报错截图，设计稿，别人转来的图表，咱直接扔过去，她就能说出个子丑寅卯，不用咱再对着屏幕口述半天。剩下的事情反而简单。哪天 DeepSeek 自己长出视觉模型，这双借来的眼睛就该退休了。在那之前，先戴着吧。

## exFAT 的小插曲

装第三方东西之前，咱习惯把源码拉下来扫一眼，确认没藏奇奇怪怪的挖矿脚本。克隆到 H 盘，npm ci 一跑就死，25 分钟，最后报 ENOTEMPTY。咱愣了半天才反应过来 H 盘是 exFAT 格式，根本撑不起 node_modules 这种碎文件森林，跟往豆腐渣里插牙签似的。只好把依赖挪到 C 盘的 NTFS 上装，上游测试 70/70 全过，才敢正式接上。审计副本留在咱电脑里，咱想看随时能看，毕竟防人之心不可无。

![](/img/360px/with-her-eyes-2.jpg)

![](/img/360px/with-her-eyes-3.jpg)
