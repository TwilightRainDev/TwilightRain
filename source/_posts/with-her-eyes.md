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

# 带上她的眼睛。

刘慈欣写过一篇短篇小说，叫带上她的眼睛。故事里有个女孩，飞船失事，永远沉在了地心。她什么都看不见。有人戴着传感眼镜替她看草原，看日出，看一场雨。

我的 Claude Code 其实也差不多。

她在这台机器上跑着，底层套的却是 DeepSeek。七月末我给她换的中转，理由很朴素，国内直连 Anthropic 不方便，DeepSeek 便宜。文本能力没什么好抱怨的，一百万的上下文，写代码，查资料，读文档，都挺稳。但她看不见。图片，截图，图表，发过去她只会说图没收到。

![](/img/360px/with-her-eyes-1.jpg)

碰到要看图的时候，我就成了她的眼睛，截图转文字，一句一句描述给她听。一次两次还行，久了就很蠢。她明明就住在这台电脑里，凭什么看一张本地的 jpg 还要我当中间人。

8 月 7 号，我给她装了 llm-vision-mcp。

## 七个工具

llm-vision-mcp 是 me9rez 写的一个 MCP server，stdio 类型，起一个 node 进程。本职是把图片转成文字描述，默认走阿里后端 ModelScope 的 Qwen-VL，免费额度每天 2000 次，个人用绰绰有余。

它挂出七个工具，

- analyze_image，通用识图
- analyze_chart，读图表
- extract_text，OCR
- code_from_screenshot，截图转代码
- describe_ui，描述界面
- diagnose_error，从报错截图里找线索
- understand_diagram，理解示意图

这里没有魔法。Qwen-VL 看图，产出的是文字。真正理解这些文字的，还是她自己的文本模型。视觉没有送进她的大脑，只是变成了文字，让她读得懂。

## 配置和第一张图

安装一行命令，

    npm install -g @me9rez/llm-vision-mcp

然后往 ~/.claude.json 的 mcpServers 里加条目，我的最终形态是这样的，

```json
"llm-vision-mcp": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "D:/nodejs/node.exe", "C:/Users/hxdn/AppData/Roaming/npm/node_modules/@me9rez/llm-vision-mcp/index.js", "mcp"],
  "env": { "API_KEY": "ms-xxxx" }
}
```

有两个地方是踩过坑才定成这样的。cmd /c 包着 node.exe 的绝对路径，绕开了 Windows 下 npx 的 .cmd 垫片坑和 npm exec 本地 bin 优先解析的坑。API_KEY 是 ModelScope 的，ms- 开头，直接写进 env，不放别处。

改完配置重启会话，MCP server 在启动时加载。claude mcp list 看一眼，Connected。

然后第一张图就失败了。403。

原因说起来有点荒诞。ModelScope 要求关联的阿里云账号完成实名认证，没过实名，免费接口也不给用。我没想到给 AI 配一双眼睛，还要先向阿里云证明我是个人。认证走完再试，拿系统自带的壁纸 C:\Windows\Web\Wallpaper\Windows\img0.jpg 丢给 analyze_image，中文描述正常返回。通了。

还有个不算坑的坑，1×1 的纯色小图，返回空内容。不是 bug，退化输入换来退化输出，合理。

## exFAT 的小插曲

装第三方东西之前，我习惯把源码拉下来审计一遍。克隆到 H 盘，npm ci 一跑就挂死，25 分钟，最后 ENOTEMPTY。H 盘是 exFAT，撑不起 node_modules 这种碎文件森林。依赖挪到 C 盘的 NTFS 上装，上游测试 70/70 全过，才敢正式接上。

审计副本留在我电脑里，我想看随时能看。

![](/img/360px/with-her-eyes-2.jpg)

---

现在她能看见我发过去的东西了。报错截图，设计稿，别人转来的图表，都不用我再口述。剩下的事情反而简单。额度用完了怎么办，哪天 DeepSeek 自己长出视觉模型，这双借来的眼睛就该退休了。

在那之前，先戴着吧。

![](/img/360px/with-her-eyes-3.jpg)
