# hexo-theme-ink

一个简单简约好用的主题。

## 缩略图

> 可能和hexo官网样式不一致，你可以clone到本地之后，回滚到这次提交使用官网样式: [1c03f0333b37921b70c37bdbe0415e977f501cc0](https://github.com/hoytzhang/hexo-theme-ink/commit/1c03f0333b37921b70c37bdbe0415e977f501cc0)

![](https://hoytzhang.github.io/hexo-theme-ink/img/screenshot.png)

## 在线预览

[https://hoytzhang.github.io/hexo-theme-ink/](https://hoytzhang.github.io/hexo-theme-ink/)

## 使用方法

```plaintext
git clone https://github.com/hoytzhang/hexo-theme-ink.git themes/ink
```

```yaml
# _config.yml
theme: ink
```

## 特色

* 采用了`霞鹜文楷屏幕阅读版`字体，当然你可以随意修改为你喜欢的字体
* 结构简单易修改
* 你可以直接复制bearblog任何主题代码到 `source/css/style.min.css` 文件内，基本都可以适配
* 首页的 文章Cover 和 文章内的图片的会自动采集颜色，设置为 文章标题 和 图片标题的背景，当你没有设置图片时，会使用随机图像
* 添加了一个相册页面，照片页面使用了fancybox，其他页面不会引用	。如果不想使用相册模板可以直接删掉gallery.ejs文件即可。使用方法如下

	1. 添加页面，在页面顶部的`Front-matter`代码块中添加`layout: "gallery"`即可
	2. 添加照片的方法：同样在顶部添加，完整格式如下

	```yaml
	---
	title: 相册
	date: 2024-12-02 10:27:21
	layout: "gallery"
	photos:
	  - title: "照片一的标题"
	    date: "这里是时间，也可以写成副标题"
	    src: "/img/gallery/2024/photo1.jpg"
	  - title: "照片二的标题"
	    date: "这里是时间，也可以写成副标题"
	    src: "/img/gallery/2024/photo2.jpg"
    ---
    ```

## 推荐

如果你恰好需要，可以尝试一下完全免费的一站式前端解决方案——🎩帽子云

https://www.maoziyun.com/

 [![帽子云](https://hexo-theme-ink.vercel.app/img/mzy.webp)](https://www.maoziyun.com/)
