---
title: 盘插进去了，Windows 说没有
excerpt: 「此电脑」里空着，盘是好的，线是好的。
date: 2026-10-20 21:30:00
tags:
  - 光驱
  - 驱动
  - Windows
  - 排坑
  - WSL
categories:
  - 技术笔记
cover: /img/360px/covers/cover-10.jpg
series: 折腾实录
series_index: 10
---

> 我连了一台外置光驱。
> 盘在里面。
> Windows 说它没看见。

这台笔记本没有内置光驱位。我用的是一台超薄刻录机，套一个 USB 转 SATA 的壳子，靠一根线接进去。壳子里的桥接芯片（Initio 的方案，`VID_13FD`）把它报成 USB 大容量存储设备，所以系统里看到的名字是 `USBSTOR\CDROM&VEN_HL-DT-ST&PROD_DVDRAM_GUD0N`。

名字挺唬人，其实就是台 LG 的 DVD 刻录机。

正常情况下，插上，等两秒，「此电脑」里多出一个光驱盘符，双击就能看内容。这次什么都没多出来。

## 一、先别急着怀疑盘

碰到这种事，第一反应往往是往最坏处想，盘划了？线松了？供电不够推不动马达？

这三个都有可能，但都得花时间验证，换一张盘、换一根线、换一个 USB 口。而有一条路更短，直接问系统「你到底认没认出这台设备」。

我在 WSL 里干活，顺手就能调 Windows 那边的 `powershell.exe`，不用切窗口，

```bash
powershell.exe -NoProfile -Command "Get-CimInstance Win32_CDROMDrive | Format-List Caption,Drive,MediaLoaded,MediaType,Size,Status"
```

回来的东西是，

```
Caption     : HL-DT-ST DVDRAM GUD0N USB Device
Drive       :
MediaLoaded : False
MediaType   : UNKNOWN
Size        :
Status      : Error
```

设备在，驱动说它 Error，盘符是空的。再查一层卷，

```bash
powershell.exe -NoProfile -Command "Get-Volume | Format-Table DriveLetter,FileSystem,DriveType,Size"
```

八个卷，全是 `Fixed`。一个 `CD-ROM` 类型的都没有。

到这一步，事情的性质就变了。原来的问题是「为什么新盘符不出现」，现在的问题清楚了，**光驱这台设备自己没起来**。跟盘里放了什么、盘是不是坏的，都没关系。

## 二、代码 38

Windows 把设备故障编了号，摆在设备管理器里那个黄色感叹号后面。命令行也能拿到，

```bash
powershell.exe -NoProfile -Command "Get-PnpDevice -Class CDROM | Format-List Status,Problem,FriendlyName"
```

```
Status       : Error
Problem      : CM_PROB_DRIVER_FAILED_PRIOR_UNLOAD
FriendlyName : HL-DT-ST DVDRAM GUD0N USB Device
```

`CM_PROB_DRIVER_FAILED_PRIOR_UNLOAD`，界面上的说法是「代码 38，因为设备驱动的前一个实例仍在内存中，Windows 无法加载该设备的驱动程序」。

翻译成人话，上一次那份驱动卸载的时候没退干净，还赖在内存里，新的那份就装不上去。Windows 不会帮你擦屁股，它只会一遍遍重试。

事件日志把重试的过程全记下来了。`Kernel-PnP`，事件 ID 219，

```
19:39:50  加载 \Driver\cdrom 失败。设备，USBSTOR\CdRom&Ven_HL-DT-ST...  状态，0xC000038E
19:43:17  同一台设备，同一行报错
19:44:12  同上
19:44:33  同上
19:48:32  同上
```

从插上到我去查，九分钟里刷了五次。每次都是同一个死结。

顺手排掉一条经典冤枉路。光驱类设备（注册表里叫 `{4D36E965-E325-11CE-BFC1-08002BE10318}`）有个老传统，装过 Daemon Tools、酒精 120%、各种虚拟光驱之后，它们会往这个类的 `UpperFilters` / `LowerFilters` 里塞自己的过滤器驱动，卸载时没清干净，真光驱就再也起不来了。

我查了那两个值，都是空的。不是这条。

:::admon[caution 别在 Code 38 上折腾盘]
网上很多「光驱读不出盘」的教程，一上来就教你换盘、擦光头、拆机清灰。这类办法只对「设备已经正常、但媒介读不出来」的情况有用。设备管理器里还挂着感叹号的时候，动盘是白费功夫，先去把驱动这一层弄干净。
:::

## 三、能动的那一步，和一个要重启的结论

能做的操作有几档，代价从小到大，重新识别这台设备、把它禁用再启用、卸掉重装、重启系统。

我先试了前两档。`pnputil /restart-device` 跑下去，结果挺有意思，

```
正在重启设备: USBSTOR\CdRom&Ven_HL-DT-ST&Prod_DVDRAM_GUD0N...
需要重新启动系统才能完成配置操作!
```

设备管理器里的 `Problem` 跟着变了，从代码 38 变成代码 14，

```
Problem : CM_PROB_NEED_RESTART
```

代码 14 的意思是「配置改完了，但需要重启才生效」。这一档已经没有捷径可走了，Windows 自己把路堵上了。

这期间还翻出一堆幽灵设备。诊断当时就有两个 `Unknown / CM_PROB_PHANTOM` 的条目混在里面，那是我让脚本批量处理时顺手扫到的；重启之后再把这个类从头列一遍，一共六个条目，只有一个是刚才那台 LG，其余五个全是以前插过、现在不在、但系统还记着的东西，

- 两个 `Linux File-CD Gadget USB Device`，序列号还是同一个
- 三个 `Microsoft 基本 DVD-ROM`

`Linux File-CD Gadget` 是 Linux 那边的小把戏，拿一台 Linux 设备（手机、开发板、树莓派）把自己伪装成一块光盘，插到电脑上就变成一个只能读的光驱。这台机器被这么用过两次，插在不同 USB 口，所以留下两个不同父节点的同名设备。

这五个幽灵跟这次的故障没直接关系，但它们正好说明了一件事，Windows 对「来过的东西」记性特别好，插过什么都在里面留个指纹。哪天看到一个从没见过的设备名，多半就是自己以前折腾的痕迹。

## 四、重启之后

重启完，全对上了。

```
Caption     : HL-DT-ST DVDRAM GUD0N USB Device
Drive       : J:
MediaLoaded : True
MediaType   : DVD Writer
Size        : 4706074624
Status      : OK
```

`J:` 出现，文件系统 UDF，容量 4.4 GiB。盘里是几个表格和一个 28 MB 的压缩包。

但「认出来了」和「读得进去」是两件事。我抽了第一个 xlsx，直接读它的前 64 个字节，

```bash
powershell.exe -NoProfile -Command "\$b = [IO.File]::ReadAllBytes('J:\某个表.xlsx')[0..63]; 'read ' + \$b.Length + ' bytes OK'"
```

```
read 64 bytes OK
```

到这儿才算完。前面那些「盘符出来了吗」的检查，只能说明系统认得这台设备；真正读出一段字节，才说明整条链路是通的。

## 五、两个小尾巴

一个是 WSL 那边。重启之后我在 WSL 里敲 `ls /mnt/`，只有 c、d、e、f、g、h、i、l，没有 j。原因很简单，WSL 只在启动那一刻挂载当时存在的盘，`J:` 是后来才冒出来的，它不知道。想用的话手动挂一下，

```bash
sudo mkdir -p /mnt/j && sudo mount -t drvfs J: /mnt/j
```

另一个是那五个幽灵设备。它们不影响任何东西，留着也不占地方，强迫症犯了再去设备管理器里「显示隐藏的设备」慢慢清。

## 六、带走的东西

- **「此电脑」里看不见，不等于系统没认出这台设备。** 这两件事在设备管理器里是两个不同的状态，先看那里，别在盘上瞎试
- **驱动报错的时候，一切跟媒介有关的字段都不可信。** 那台光驱当时报的是 `MediaLoaded: False`，看上去像「托盘是空的」，实际是它压根没资格去问托盘里有没有盘
- **代码 38 和代码 14 都是重启票。** 38 是旧驱动退不掉，14 是改动要重启才生效；两个都在告诉你手动操作到头了
- **光驱类设备起不来，先看那两个过滤器键。** `UpperFilters` / `LowerFilters` 里如果有虚拟光驱软件留下的名字，先把它们清掉再谈别的

从插上线到能读盘，一共一刻钟。前面九分钟，这台设备在后台刷了五次同一个错，我一次都没看见。它从来没说过「我没装好」，它只是反复尝试然后失败，安静得像台好设备。

::series
