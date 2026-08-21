---
title: BiliCompact 完整源码（v2.6.0）
excerpt: BiliCompact 用户脚本 v2.6.0 完整源码，MIT 协议；复制到 Tampermonkey / Violentmonkey 新建脚本保存即可使用。
date: 2026-07-22 12:00:00
tags:
  - BiliCompact
  - Tampermonkey
  - JavaScript
  - 源码
categories:
  - 代码仓库
cover: /img/360px/covers/bilicompact-source-v2.jpg
---

> 以下为 BiliCompact 用户脚本 v2.6.0 的完整源码，MIT 协议，可自由使用、修改、分发。
> 安装方法：复制到 Tampermonkey / Violentmonkey 新建脚本中保存即可。

::github{repo="TwilightRainDev/TwilightRainBiliCompact" desc="BiliCompact 官方仓库：完整源码、版本发布与 issue 追踪"}

```javascript
// ==UserScript==
// @name         网页端B站主页精简~ BiliCompact
// @namespace    http://tampermonkey.net/
// @version      2.6.0
// @license MIT
// @description  你是否厌倦了B站网页端极多视频？想要更简要的界面？这个插件将帮助你只显示指定数量的视频，支持多种页面、黑/白名单、配置持久化。非侵入式设计，不在B站页面注入任何UI元素。支持简中，繁中，英语。
// @author       TwilightRain
// @match        https://www.bilibili.com/
// @match        https://www.bilibili.com/?*
// @match        https://www.bilibili.com/index/*
// @match        https://www.bilibili.com/v/popular/*
// @match        https://www.bilibili.com/v/*/*
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/dynamic*
// @match        https://www.bilibili.com/search*
// @match        https://www.bilibili.com/anime/*
// @match        https://www.bilibili.com/guochuang/*
// @match        https://www.bilibili.com/music/*
// @match        https://www.bilibili.com/dance/*
// @match        https://www.bilibili.com/game/*
// @match        https://www.bilibili.com/technology/*
// @match        https://www.bilibili.com/life/*
// @match        https://www.bilibili.com/food/*
// @match        https://www.bilibili.com/car/*
// @match        https://www.bilibili.com/animal/*
// @match        https://www.bilibili.com/kichiku/*
// @match        https://www.bilibili.com/fashion/*
// @match        https://www.bilibili.com/ent/*
// @match        https://www.bilibili.com/cinephile/*
// @match        https://www.bilibili.com/popular/*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_log
// @icon         https://www.bilibili.com/favicon.ico
// @downloadURL https://update.greasyfork.org/scripts/585777/%E7%BD%91%E9%A1%B5%E7%AB%AFB%E7%AB%99%E4%B8%BB%E9%A1%B5%E7%B2%BE%E7%AE%80~%20BiliCompact.user.js
// @updateURL https://update.greasyfork.org/scripts/585777/%E7%BD%91%E9%A1%B5%E7%AB%AFB%E7%AB%99%E4%B8%BB%E9%A1%B5%E7%B2%BE%E7%AE%80~%20BiliCompact.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // ======================== 国际化 (i18n) ========================
    const I18N = {
        zh_CN: {
            // Log
            LogPrefix: '[B站精简]',
            LogSelectorData: '通过data属性探测到选择器:',
            LogSelectorFound: '探测到选择器:',
            LogSelectorFallback: '通过链接回退探测到选择器:',
            LogNoCards: '未找到视频卡片，跳过',
            LogStillNoCards: '仍未找到视频卡片',
            LogProcessed: '已处理: 总视频 {0}, 显示 {1}, 隐藏 {2}',
            LogErrorLimit: 'limitVideos 出错:',
            LogContainerFound: '探测到容器:',
            LogConfigLoaded: '配置加载完成:',
            LogStatus: '精简状态: {0}',
            LogStatusOn: '已开启',
            LogStatusOff: '已关闭',
            LogQuickSet: '已设置最大数量:',
            LogTimerRetry: '定时器检测到可见视频过多，重新执行限制',
            LogInitDone: '脚本初始化完成，当前配置:',
            LogInitError: '初始化失败:',
            LogObserverStarted: 'MutationObserver 已启动，监听容器:',
            LogUrlChanged: 'URL变化:',

            // Menu
            MenuSettings: 'B站精简设置',
            MenuRefresh: '手动刷新精简',
            MenuToggle: '切换精简状态',
            MenuQuickSet: '快速设数量',
            MenuCommentPurifier: '切换评论净化',

            // Panel
            PanelTitle: 'B站精简设置',
            PanelStatusLabel: '当前状态',
            PanelStatusActive: '精简中',
            PanelStatusPaused: '已暂停',
            PanelMaxVideos: '最大显示数量',
            PanelExcludeLive: '排除直播',
            PanelExcludeAd: '排除广告',
            PanelExcludeBangumi: '排除番剧',
            PanelExcludePaid: '排除付费课程',
            PanelKeepPromoted: '保留推广位',
            PanelKeepUpids: '保留UP主ID（逗号分隔）',
            PanelDebug: '调试模式',
            PanelEnableCommentPurifier: '启用评论净化（删除@提及，隐藏短评论）',
            PanelLanguage: '界面语言 / Language',
            PanelLanguageAuto: '自动 (Auto)',
            PanelBtnPause: '暂停精简',
            PanelBtnResume: '启用精简',
            PanelBtnReset: '恢复默认',
            PanelBtnSave: '保存并应用',
            PanelBtnClose: '关闭',
            PanelColorMode: '颜色模式',
            PanelColorAuto: '跟随系统',
            PanelColorDark: '深色',
            PanelColorLight: '浅色',

            // Prompt
            PromptQuickSet: '输入最大显示视频数量（1-100）：',
        },
        zh_TW: {
            // Log
            LogPrefix: '[B站精簡]',
            LogSelectorData: '透過data屬性探測到選擇器:',
            LogSelectorFound: '探測到選擇器:',
            LogSelectorFallback: '透過連結回退探測到選擇器:',
            LogNoCards: '未找到影片卡片，跳過',
            LogStillNoCards: '仍未找到影片卡片',
            LogProcessed: '已處理: 總影片 {0}, 顯示 {1}, 隱藏 {2}',
            LogErrorLimit: 'limitVideos 出錯:',
            LogContainerFound: '探測到容器:',
            LogConfigLoaded: '設定載入完成:',
            LogStatus: '精簡狀態: {0}',
            LogStatusOn: '已開啟',
            LogStatusOff: '已關閉',
            LogQuickSet: '已設定最大數量:',
            LogTimerRetry: '定時器偵測到可見影片過多，重新執行限制',
            LogInitDone: '指令碼初始化完成（非侵入式），目前設定:',
            LogInitError: '初始化失敗:',
            LogObserverStarted: 'MutationObserver 已啟動，監聽容器:',
            LogUrlChanged: 'URL變化:',

            // Menu
            MenuSettings: 'B站精簡設定',
            MenuRefresh: '手動重新整理精簡',
            MenuToggle: '切換精簡狀態',
            MenuQuickSet: '快速設數量',
            MenuCommentPurifier: '切換評論淨化',

            // Panel
            PanelTitle: 'B站精簡設定',
            PanelStatusLabel: '目前狀態',
            PanelStatusActive: '精簡中',
            PanelStatusPaused: '已暫停',
            PanelMaxVideos: '最大顯示數量',
            PanelExcludeLive: '排除直播',
            PanelExcludeAd: '排除廣告',
            PanelExcludeBangumi: '排除番劇',
            PanelExcludePaid: '排除付費課程',
            PanelKeepPromoted: '保留推廣位',
            PanelKeepUpids: '保留UP主ID（逗號分隔）',
            PanelDebug: '除錯模式',
            PanelEnableCommentPurifier: '啟用評論淨化（刪除@提及，隱藏短評論）',
            PanelLanguage: '介面語言 / Language',
            PanelLanguageAuto: '自動 (Auto)',
            PanelBtnPause: '暫停精簡',
            PanelBtnResume: '啟用精簡',
            PanelBtnReset: '回復預設',
            PanelBtnSave: '儲存並套用',
            PanelBtnClose: '關閉',
            PanelColorMode: '顏色模式',
            PanelColorAuto: '跟隨系統',
            PanelColorDark: '深色',
            PanelColorLight: '淺色',

            // Prompt
            PromptQuickSet: '輸入最大顯示影片數量（1-100）：',
        },
        en_US: {
            // Log
            LogPrefix: '[BiliCompact]',
            LogSelectorData: 'Selector detected via data attribute:',
            LogSelectorFound: 'Selector detected:',
            LogSelectorFallback: 'Selector detected via link fallback:',
            LogNoCards: 'No video cards found, skipping',
            LogStillNoCards: 'Still no video cards found',
            LogProcessed: 'Processed: total {0}, shown {1}, hidden {2}',
            LogErrorLimit: 'limitVideos error:',
            LogContainerFound: 'Container detected:',
            LogConfigLoaded: 'Config loaded:',
            LogStatus: 'Compact status: {0}',
            LogStatusOn: 'Enabled',
            LogStatusOff: 'Disabled',
            LogQuickSet: 'Max videos set to:',
            LogTimerRetry: 'Timer detected too many visible videos, re-running limit',
            LogInitDone: 'BiliCompact initialized (non-invasive), config:',
            LogInitError: 'Initialization failed:',
            LogObserverStarted: 'MutationObserver started, watching container:',
            LogUrlChanged: 'URL changed:',

            // Menu
            MenuSettings: 'BiliCompact Settings',
            MenuRefresh: 'Refresh Compact',
            MenuToggle: 'Toggle Compact',
            MenuQuickSet: 'Quick Set Count',
            MenuCommentPurifier: 'Toggle Comment Purifier',

            // Panel
            PanelTitle: 'BiliCompact Settings',
            PanelStatusLabel: 'Status',
            PanelStatusActive: 'Active',
            PanelStatusPaused: 'Paused',
            PanelMaxVideos: 'Max videos',
            PanelExcludeLive: 'Exclude live streams',
            PanelExcludeAd: 'Exclude ads',
            PanelExcludeBangumi: 'Exclude bangumi',
            PanelExcludePaid: 'Exclude paid courses',
            PanelKeepPromoted: 'Keep promoted items',
            PanelKeepUpids: 'Whitelist UP IDs (comma-separated)',
            PanelDebug: 'Debug mode',
            PanelEnableCommentPurifier: 'Enable comment purifier (remove @mentions, hide short comments)',
            PanelLanguage: 'Language / 語言',
            PanelLanguageAuto: 'Auto',
            PanelBtnPause: 'Pause',
            PanelBtnResume: 'Resume',
            PanelBtnReset: 'Reset Defaults',
            PanelBtnSave: 'Save &amp; Apply',
            PanelBtnClose: 'Close',
            PanelColorMode: 'Color Mode',
            PanelColorAuto: 'Auto (System)',
            PanelColorDark: 'Dark',
            PanelColorLight: 'Light',

            // Prompt
            PromptQuickSet: 'Enter max videos to show (1-100):',
        }
    };

    // 当前生效的语言
    let CurrentLang = 'zh_CN';

    function ResolveLanguage() {
        if (Config.Language &amp;&amp; Config.Language !== 'auto') {
            return Config.Language;
        }
        const Nav = (navigator.language || '').toLowerCase();
        if (/^zh-(tw|hk|mo)$/i.test(Nav) || /^zh-(hant)$/i.test(Nav)) return 'zh_TW';
        if (/^zh/i.test(Nav)) return 'zh_CN';
        if (/^en/i.test(Nav)) return 'en_US';
        return 'zh_CN'; // fallback
    }

    function T(Key, ...Args) {
        const Map = I18N[CurrentLang] || I18N['zh_CN'];
        let Str = Map[Key];
        if (Str === undefined) {
            // Fallback to zh_CN if key missing in current locale
            Str = I18N['zh_CN'][Key];
        }
        if (Str === undefined) return Key; // ultimate fallback: show the key itself
        // Replace placeholders {0}, {1}, {2}...
        for (let I = 0; I &lt; Args.length; I++) {
            Str = Str.replace('{' + I + '}', Args[I]);
        }
        return Str;
    }

    // ======================== 配置（默认值，会从GM存储读取） ========================
    const DEFAULTS = {
        MaxVideos: 10,                 // 最大显示数量
        ExcludeLive: true,             // 排除直播
        ExcludeAd: true,              // 排除广告
        ExcludeBangumi: true,         // 排除番剧
        ExcludePaid: true,            // 排除付费课程
        KeepSpecialUPIDs: [],         // 保留的UP主ID列表（数字）
        KeepPromoted: false,          // 保留推广位（不计入数量）
        Language: 'auto',             // 界面语言: auto | zh_CN | zh_TW | en_US
        Debug: false,                 // 调试模式
        EnableCommentPurifier: false, // 评论净化器 (删除@提及，隐藏短评论)
        RemovedElements: {},          // 元素去除: { presetId: true/false }
        ColorMode: 'auto',            // 颜色模式: auto | dark | light
    };

    // ======================== 状态 ========================
    let Config = {};
    let IsActive = true;               // 是否启用精简（切换开关）
    let EffectiveSelector = null;      // 缓存的有效选择器
    let VideoListContainer = null;     // 缓存的列表容器
    let Observer = null;
    let DebounceTimer = null;
    let PurifierStarted = false;         // 评论净化器是否已启动
    let PurifierObservers = [];          // 评论净化器的 MutationObserver 列表
    let LastRun = 0;
    const THROTTLE_INTERVAL = 200;     // 节流间隔（ms）

    // ======================== 工具函数 ========================
    function Log(...Args) {
        if (Config.Debug) console.log(T('LogPrefix'), ...Args);
    }

    function ErrorLog(...Args) {
        console.error(T('LogPrefix'), ...Args);
    }

    // 安全获取存储
    function GetConfig() {
        const Cfg = {};
        for (const [Key, Def] of Object.entries(DEFAULTS)) {
            try {
                const Val = GM_getValue(Key, Def);
                Cfg[Key] = Val;
            } catch (E) {
                Cfg[Key] = Def;
            }
        }
        return Cfg;
    }

    function SaveConfig(Cfg) {
        for (const [Key, Val] of Object.entries(Cfg)) {
            try {
                GM_setValue(Key, Val);
            } catch (E) {}
        }
    }

    // ======================== 评论净化器 (Comment Purifier) ========================

    /**
     * 检查页面中是否存在 BilibiliBlocker 的标记
     * Blocker 会在 bili-comment-user-info 的 shadowRoot 中插入 button[gz_type]
     * 一次同步检测，不做任何等待；没装就是没装，直接跳过协调。
     */
    function purifierHasBlockerInstalled() {
        try {
            const comments = document.querySelector('bili-comments');
            if (!comments?.shadowRoot) return false;
            const threads = comments.shadowRoot.querySelectorAll('bili-comment-thread-renderer');
            if (threads.length === 0) return false;
            return Array.from(threads).some(thread =&gt; {
                const comment = thread.shadowRoot?.getElementById('comment');
                if (!comment?.shadowRoot) return false;
                const userInfo = comment.shadowRoot.querySelector('bili-comment-user-info');
                if (!userInfo?.shadowRoot) return false;
                const info = userInfo.shadowRoot.getElementById('info');
                return !!info?.querySelector('button[gz_type]');
            });
        } catch { return false; }
    }

    /**
     * 从 bili-comment-renderer 内部获取 #contents 容器
     * 穿透 2 层 Shadow DOM: bili-comment-renderer -&gt; bili-rich-text
     */
    function purifierGetContentsEl(renderer) {
        try {
            const richText = renderer.shadowRoot.querySelector('bili-rich-text');
            if (richText &amp;&amp; richText.shadowRoot) {
                return richText.shadowRoot.getElementById('contents');
            }
        } catch (_) {}
        return null;
    }

    /**
     * 查找页面上所有 &lt;bili-comment-renderer&gt;
     * 从 &lt;bili-comments&gt; 开始穿透 Shadow DOM
     */
    function purifierFindRenderers() {
        const list = [];
        try {
            const comments = document.querySelector('bili-comments');
            if (comments &amp;&amp; comments.shadowRoot) {
                const threads = comments.shadowRoot.querySelectorAll('bili-comment-thread-renderer');
                for (const thread of threads) {
                    if (thread.shadowRoot) {
                        thread.shadowRoot.querySelectorAll('bili-comment-renderer').forEach(r =&gt; list.push(r));
                    }
                }
            }
        } catch (_) {}
        return list;
    }

    /**
     * 处理单条评论：
     *   a. 删除所有 @提及 &lt;a data-type="mention"&gt;
     *   b. 清理后有效字符 &lt; 5 -&gt; 隐藏整条评论
     */
    function purifierProcessRenderer(renderer) {
        const doneKey = 'bcPurified';
        if (renderer.dataset[doneKey]) return;
        renderer.dataset[doneKey] = '1';

        const contents = purifierGetContentsEl(renderer);
        if (!contents) return;

        // 删除所有 @提及标签
        const mentions = contents.querySelectorAll('a[data-type="mention"]');
        for (const m of mentions) {
            m.remove();
        }

        // 计算剩余有效字符
        const remaining = contents.textContent.replace(/\s+/g, '').trim();

        // 不足5字 -&gt; 隐藏整条评论
        if (remaining.length &lt; 5) {
            renderer.style.display = 'none';
            try {
                const threadRenderer = renderer.getRootNode().host;
                if (threadRenderer) threadRenderer.style.display = 'none';
            } catch (_) {}
        }
    }

    /**
     * 启动评论净化器
     * - 监听评论区动态加载，自动处理新增评论
     * - 首次扫描零延迟；检测到 Blocker 只在日志中标记，不影响流程
     */
    function startCommentPurifier() {
        if (!Config.EnableCommentPurifier) return;
        if (PurifierStarted) return;
        PurifierStarted = true;

        let scanTimer = null;

        function scheduleScan() {
            if (scanTimer) clearTimeout(scanTimer);
            scanTimer = setTimeout(() =&gt; {
                purifierFindRenderers().forEach(purifierProcessRenderer);
                scanTimer = null;
            }, 800);
        }

        // MutationObserver 监听 bili-comments 的 shadowRoot
        try {
            const comments = document.querySelector('bili-comments');
            if (comments?.shadowRoot) {
                const obs = new MutationObserver(() =&gt; scheduleScan());
                obs.observe(comments.shadowRoot, { childList: true, subtree: true });
                PurifierObservers.push(obs);
            }
        } catch (_) {}

        // MutationObserver 监听 document.body（兜底）
        const obsBody = new MutationObserver(() =&gt; scheduleScan());
        obsBody.observe(document.body, { childList: true, subtree: true });
        PurifierObservers.push(obsBody);

        // 首次扫描——不等待、不轮询，直接执行
        purifierFindRenderers().forEach(purifierProcessRenderer);

        const hasBlocker = purifierHasBlockerInstalled();
        Log('评论净化器已启动' + (hasBlocker ? '（检测到 BilibiliBlocker，兼容模式）' : ''));
    }

    /**
     * 停止评论净化器
     * - 断开所有 MutationObserver
     * - 已处理的评论保持状态不变
     */
    function stopCommentPurifier() {
        PurifierStarted = false;
        for (const obs of PurifierObservers) {
            try { obs.disconnect(); } catch (_) {}
        }
        PurifierObservers = [];
        Log('评论净化器已停止');
    }

    /**
     * 切换评论净化器（供 TM 菜单命令调用）
     * 同时保存配置变更
     */
    function toggleCommentPurifier() {
        Config.EnableCommentPurifier = !Config.EnableCommentPurifier;
        SaveConfig({ EnableCommentPurifier: Config.EnableCommentPurifier });
        if (Config.EnableCommentPurifier) {
            startCommentPurifier();
        } else {
            stopCommentPurifier();
        }
    }

    // ======================== 元素去除 (Element Removal) ========================

    /**
     * 可去除的元素预设列表
     * 每条包含：唯一 id、适用域名 host、显示名称 name、CSS选择器列表 selectors（多版本兼容）
     */
    const ELEMENT_REMOVAL_PRESETS = [
        {
            id: 'carousel',
            host: 'www.bilibili.com',
            name: '首页轮播图',
            selectors: [
                '#i_cecream &gt; div.bili-feed4:last-child &gt; main.bili-feed4-layout:nth-child(3) &gt; div.feed2:last-child &gt; div.recommended-container_floor-aside &gt; div.container.is-version8:first-child &gt; div.recommended-swipe.grid-anchor:first-child &gt; div.recommended-swipe-core &gt; div.recommended-swipe-body:last-child &gt; div.carousel-area &gt; div.carousel',
                '#app &gt; div.bili-feed4:last-child &gt; main.bili-feed4-layout:nth-child(2) &gt; div.feed2:last-child &gt; div.recommended-container_floor-aside &gt; div.container.is-version8:first-child &gt; div.recommended-swipe:first-child',
                '#app &gt; div.bili-feed4:last-child &gt; main.bili-feed4-layout:nth-child(3) &gt; div.feed2:last-child &gt; div.recommended-container_floor-aside &gt; div.container.is-version8:first-child &gt; div.recommended-swipe:first-child'
            ]
        },
        {
            id: 'right-channel',
            host: 'www.bilibili.com',
            name: '右侧频道导航',
            selectors: [
                '#i_cecream &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__channel:nth-child(3) &gt; div.right-channel-container:last-child',
                '#app &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__channel:last-child &gt; div.right-channel-container:last-child'
            ]
        },
        {
            id: 'channel-icons',
            host: 'www.bilibili.com',
            name: '频道图标行',
            selectors: [
                '#i_cecream &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__channel:nth-child(3) &gt; div.channel-icons:first-child',
                '#app &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__channel:last-child &gt; div.channel-icons:first-child'
            ]
        },
        {
            id: 'channel-bar',
            host: 'www.bilibili.com',
            name: '频道栏（整体）',
            selectors: [
                '#app &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__channel:last-child'
            ]
        },
        {
            id: 'creation-entry',
            host: 'www.bilibili.com',
            name: '创作中心入口',
            selectors: [
                '#i_cecream &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__bar:first-child &gt; ul.left-entry:first-child &gt; li.v-popover-wrap.left-loc-entry:nth-child(8) &gt; div'
            ]
        },
        {
            id: 'upload-entry',
            host: 'www.bilibili.com',
            name: '投稿入口',
            selectors: [
                '#i_cecream &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__bar:first-child &gt; ul.left-entry:first-child &gt; li.v-popover-wrap.left-loc-entry:nth-child(9) &gt; div &gt; a.loc-entry.loc-moveclip'
            ]
        },
        {
            id: 'live-entry',
            host: 'www.bilibili.com',
            name: '直播入口',
            selectors: [
                '#i_cecream &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__bar:first-child &gt; ul.left-entry:first-child &gt; li.v-popover-wrap:last-child'
            ]
        },
        {
            id: 'dynamic-entry',
            host: 'www.bilibili.com',
            name: '动态入口',
            selectors: [
                '#i_cecream &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__bar:first-child &gt; ul.left-entry:first-child &gt; li.v-popover-wrap:nth-child(5)'
            ]
        },
        {
            id: 'vip-entry',
            host: 'www.bilibili.com',
            name: '大会员VIP',
            selectors: [
                '#i_cecream &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__bar:first-child &gt; ul.right-entry:last-child &gt; div.vip-wrap:nth-child(2)'
            ]
        },
        {
            id: 'adblock-tips',
            host: 'www.bilibili.com',
            name: '广告提示条',
            selectors: [
                '#i_cecream &gt; div.adblock-tips:nth-child(2)'
            ]
        },
        {
            id: 'left-entries',
            host: 'www.bilibili.com',
            name: '左侧全部入口',
            selectors: [
                '#app &gt; div.bili-feed4:last-child &gt; div.bili-header.large-header:first-child &gt; div.bili-header__bar:first-child &gt; ul.left-entry:first-child'
            ]
        },
        {
            id: 'palette-btn',
            host: 'www.bilibili.com',
            name: '调色板浮窗',
            selectors: [
                '#app &gt; div.bili-feed4:last-child &gt; div.palette-button-outer.palette-feed4:nth-child(4)'
            ]
        },
        {
            id: 'space-notif',
            host: 'space.bilibili.com',
            name: '空间-消息通知',
            selectors: [
                '#biliMainHeader &gt; div.bili-header &gt; div.bili-header__bar.mini-header:first-child &gt; ul.left-entry:first-child &gt; li.v-popover-wrap:last-child'
            ]
        }
    ];

    let ElementRemovalStates = {};  // { presetId: { element, originalDisplay } }

    /**
     * 应用/恢复元素去除
     * 按配置隐藏勾选的元素，恢复取消勾选的元素
     */
    function applyElementRemoval() {
        const enabled = Config.RemovedElements || {};
        const host = location.hostname;

        // 先恢复已取消勾选的元素
        for (const id of Object.keys(ElementRemovalStates)) {
            if (!enabled[id]) {
                ElementRemovalStates[id].element.style.display = ElementRemovalStates[id].originalDisplay;
                delete ElementRemovalStates[id];
            }
        }

        // 再应用新勾选的元素
        for (const preset of ELEMENT_REMOVAL_PRESETS) {
            if (preset.host !== host) continue;
            if (!enabled[preset.id]) continue;
            if (ElementRemovalStates[preset.id]) continue; // 已隐藏

            for (const sel of preset.selectors) {
                try {
                    const el = document.querySelector(sel);
                    if (el) {
                        ElementRemovalStates[preset.id] = {
                            element: el,
                            originalDisplay: el.style.display || ''
                        };
                        el.style.display = 'none';
                        break; // 找到一个版本即隐藏，不再试其他
                    }
                } catch (_) {}
            }
        }
    }

    // ======================== 选择器探测与缓存 ========================
    function DetectSelector() {
        if (EffectiveSelector) return EffectiveSelector;

        // 第一梯队：具体选择器（优先使用，构建联合选择器）
        const SpecificCandidates = [
            '.bili-video-card',
            '.feed-card',
            '.bili-feed-card',
            '.floor-single-card',
            '.floor-card',
            '.video-item',
            '.feed-item'
        ];

        // 第二梯队：宽泛选择器（仅在具体选择器全部失败时使用）
        const BroadCandidates = [
            '[class*="video-card"]',
            '[class*="bili-video"]',
            '[class*="feed-card"]',
            '[class*="feed-item"]',
            '[class*="floor-card"]'
        ];

        // 收集所有能匹配到元素的具体选择器，构建联合选择器
        const MatchedSelectors = [];

        // 首先尝试通过 data 属性查找
        const DataCandidates = [
            '[data-video-id]',
            '[data-aid]'
        ];
        for (const Sel of DataCandidates) {
            const Els = document.querySelectorAll(Sel);
            if (Els.length &gt; 0) {
                for (const El of Els) {
                    const Card = El.closest('.bili-video-card, .feed-card, .bili-feed-card, .video-item, .feed-item, .floor-single-card, .floor-card, [class*="video-card"], [class*="feed-card"], [class*="feed-item"], [class*="floor-card"]');
                    if (Card) {
                        const CardSel = (Card.tagName === El.tagName) ? Sel :
                            Array.from(Card.classList).map(C =&gt; '.' + C).join('');
                        if (!MatchedSelectors.includes(CardSel)) {
                            MatchedSelectors.push(CardSel);
                        }
                    }
                }
            }
        }

        // 遍历具体候选选择器，收集所有匹配到的
        for (const Sel of SpecificCandidates) {
            try {
                const Els = document.querySelectorAll(Sel);
                if (Els.length &gt; 0) {
                    if (!MatchedSelectors.includes(Sel)) {
                        MatchedSelectors.push(Sel);
                    }
                }
            } catch (E) {
                // 跳过无效选择器
            }
        }

        if (MatchedSelectors.length &gt; 0) {
            EffectiveSelector = MatchedSelectors.join(', ');
            Log(T('LogSelectorFound'), EffectiveSelector);
            return EffectiveSelector;
        }

        // 具体选择器全部失败时，尝试宽泛选择器（仅取第一个匹配的）
        for (const Sel of BroadCandidates) {
            try {
                const Els = document.querySelectorAll(Sel);
                if (Els.length &gt; 0) {
                    EffectiveSelector = Sel;
                    Log(T('LogSelectorFound'), EffectiveSelector);
                    return EffectiveSelector;
                }
            } catch (E) {
                // 跳过无效选择器
            }
        }

        // 最后回退：查找包含 /video/, /bangumi/ 或 live.bilibili.com 链接的父级卡片
        const LinkSelectors = [
            'a[href*="/video/"]',
            'a[href*="/bangumi/"]',
            'a[href*="live.bilibili.com"]'
        ];
        for (const LinkSel of LinkSelectors) {
            const Links = document.querySelectorAll(LinkSel);
            for (const Link of Links) {
                let Parent = Link.parentElement;
                let Depth = 0;
                while (Parent &amp;&amp; Depth &lt; 5) {
                    const Cls = Parent.className || '';
                    if (Cls.includes('card') || Cls.includes('item') || Cls.includes('feed') || Cls.includes('video') || Cls.includes('floor')) {
                        EffectiveSelector = '.' + Cls.split(' ').join('.');
                        Log(T('LogSelectorFallback'), EffectiveSelector);
                        return EffectiveSelector;
                    }
                    Parent = Parent.parentElement;
                    Depth++;
                }
            }
        }

        return null;
    }

    // 获取视频列表容器（缩小观察范围）
    function DetectContainer() {
        if (VideoListContainer) return VideoListContainer;
        const Containers = [
            '.bili-feed4',
            '.bili-feed',
            '.feed2',
            '.feed-list',
            '.video-list',
            '.bili-video-list',
            '.recommend-container',
            '.recommended-container_floor-aside'
        ];
        for (const Sel of Containers) {
            const El = document.querySelector(Sel);
            if (El) {
                VideoListContainer = El;
                Log(T('LogContainerFound'), Sel);
                return El;
            }
        }
        VideoListContainer = document.body;
        return VideoListContainer;
    }

    // ======================== 卡片显示/隐藏辅助函数 ========================
    // 需要同时隐藏的祖先包装器类名（解决 B站 CSS Grid 单元格不塌陷问题）
    const WRAPPER_CLASSES = ['bili-feed-card', 'feed-card'];

    function ApplyHideStyles(El) {
        El.classList.add('BiliLimitedHide');
        El.style.display = 'none';
        El.style.visibility = 'hidden';
        El.style.opacity = '0';
        El.style.height = '0';
        El.style.margin = '0';
        El.style.padding = '0';
        El.style.overflow = 'hidden';
        El.style.flex = '0 0 0';
        El.style.position = 'absolute';
    }

    function ClearHideStyles(El) {
        El.classList.remove('BiliLimitedHide');
        El.style.display = '';
        El.style.visibility = '';
        El.style.opacity = '';
        El.style.height = '';
        El.style.margin = '';
        El.style.padding = '';
        El.style.overflow = '';
        El.style.position = '';
        El.style.flex = '';
    }

    // 隐藏卡片及其祖先包装器（.bili-feed-card, .feed-card）
    function HideCardTree(Card) {
        ApplyHideStyles(Card);
        let Ancestor = Card.parentElement;
        while (Ancestor &amp;&amp; Ancestor !== document.body) {
            const Cls = (Ancestor.className || '').toLowerCase();
            let IsWrapper = false;
            for (let W = 0; W &lt; WRAPPER_CLASSES.length; W++) {
                if (Cls.indexOf(WRAPPER_CLASSES[W]) !== -1) {
                    IsWrapper = true;
                    break;
                }
            }
            if (IsWrapper) {
                ApplyHideStyles(Ancestor);
            }
            Ancestor = Ancestor.parentElement;
        }
    }

    // 显示卡片及其祖先包装器
    function ShowCardTree(Card) {
        ClearHideStyles(Card);
        let Ancestor = Card.parentElement;
        while (Ancestor &amp;&amp; Ancestor !== document.body) {
            const Cls = (Ancestor.className || '').toLowerCase();
            let IsWrapper = false;
            for (let W = 0; W &lt; WRAPPER_CLASSES.length; W++) {
                if (Cls.indexOf(WRAPPER_CLASSES[W]) !== -1) {
                    IsWrapper = true;
                    break;
                }
            }
            if (IsWrapper) {
                ClearHideStyles(Ancestor);
            }
            Ancestor = Ancestor.parentElement;
        }
    }

    // ======================== 核心过滤逻辑 ========================
    function LimitVideos() {
        if (!IsActive) {
            RestoreAllVideos();
            return;
        }

        try {
            const Selector = DetectSelector();
            if (!Selector) {
                Log(T('LogNoCards'));
                return;
            }

            // 获取所有卡片
            let Cards = document.querySelectorAll(Selector);
            if (Cards.length === 0) {
                // 扩展回退：同时查找 /video/, /bangumi/ 和 live.bilibili.com 链接
                const LinkSelectors = [
                    'a[href*="/video/"]',
                    'a[href*="/bangumi/"]',
                    'a[href*="live.bilibili.com"]'
                ];
                const ParentCards = new Set();
                for (const LinkSel of LinkSelectors) {
                    const Links = document.querySelectorAll(LinkSel);
                    for (const Link of Links) {
                        let Parent = Link.parentElement;
                        let Depth = 0;
                        while (Parent &amp;&amp; Depth &lt; 5) {
                            if (Parent.className &amp;&amp; (Parent.className.includes('card') || Parent.className.includes('item') || Parent.className.includes('feed') || Parent.className.includes('floor'))) {
                                ParentCards.add(Parent);
                                break;
                            }
                            Parent = Parent.parentElement;
                            Depth++;
                        }
                    }
                }
                Cards = Array.from(ParentCards);
                if (Cards.length === 0) {
                    Log(T('LogStillNoCards'));
                    return;
                }
            }

            let VideoCards = Array.from(Cards);

            // 去重：移除嵌套包装器，只保留最内层卡片（bili-video-card &gt; 其他包装器）
            // 避免同一个卡片被多次计数
            const NestedRemoval = new Set();
            for (let I = 0; I &lt; VideoCards.length; I++) {
                for (let J = 0; J &lt; VideoCards.length; J++) {
                    if (I !== J &amp;&amp; VideoCards[I].contains(VideoCards[J])) {
                        // VideoCards[I] 是 VideoCards[J] 的祖先 → 移除祖先
                        NestedRemoval.add(I);
                        break;
                    }
                }
            }
            if (NestedRemoval.size &gt; 0) {
                VideoCards = VideoCards.filter((_, Idx) =&gt; !NestedRemoval.has(Idx));
            }

            // 辅助函数：检查卡片链接是否指向特定域名/路径
            function CardLinksTo(Card, Pattern) {
                const Links = Card.querySelectorAll('a[href]');
                for (const Link of Links) {
                    if (Link.href.indexOf(Pattern) !== -1) return true;
                }
                return false;
            }

            // 过滤非视频内容 —— 收集被排除的卡片，稍后统一隐藏
            const ExcludedCards = [];
            VideoCards = VideoCards.filter(Card =&gt; {
                const Text = (Card.textContent || '').toLowerCase();
                const Cls = (Card.className || '').toLowerCase();
                // 检查 floor-title 标签（B站新版卡片分类标签）
                const FloorTitle = Card.querySelector('.floor-title');
                const FloorTitleText = FloorTitle ? (FloorTitle.textContent || '').toLowerCase() : '';

                let ShouldExclude = false;

                if (Config.ExcludeLive &amp;&amp; (
                    Cls.includes('live') ||
                    Text.includes('直播') || Text.includes('正在直播') || Text.includes('直播中') ||
                    FloorTitleText.includes('直播') || FloorTitleText.includes('赛事') ||
                    CardLinksTo(Card, 'live.bilibili.com')
                )) {
                    ShouldExclude = true;
                }
                if (!ShouldExclude &amp;&amp; Config.ExcludeAd &amp;&amp; (Cls.includes('ad') || Cls.includes('advert') || Text.includes('广告') || Text.includes('sponsor'))) {
                    ShouldExclude = true;
                }
                if (!ShouldExclude &amp;&amp; Config.ExcludeBangumi &amp;&amp; (
                    Cls.includes('bangumi') ||
                    Text.includes('番剧') || Text.includes('追番') ||
                    Text.includes('国创') ||
                    FloorTitleText.includes('番剧') || FloorTitleText.includes('国创') ||
                    CardLinksTo(Card, '/bangumi/')
                )) {
                    ShouldExclude = true;
                }
                if (!ShouldExclude &amp;&amp; Config.ExcludePaid &amp;&amp; (Text.includes('付费') || Text.includes('课程') || Text.includes('￥') || Text.includes('¥'))) {
                    ShouldExclude = true;
                }

                if (ShouldExclude) {
                    ExcludedCards.push(Card);
                    return false;
                }
                return true;
            });

            // 处理特殊保留（UP主ID）
            if (Config.KeepSpecialUPIDs &amp;&amp; Config.KeepSpecialUPIDs.length &gt; 0) {
                const KeepSet = new Set(Config.KeepSpecialUPIDs.map(Id =&gt; String(Id)));
                const Kept = [];
                const Rest = [];
                for (const Card of VideoCards) {
                    const UpLink = Card.querySelector('a[href*="/space/"]');
                    let Upid = null;
                    if (UpLink) {
                        const Match = UpLink.href.match(/\/space\/(\d+)/);
                        if (Match) Upid = Match[1];
                    }
                    if (Upid &amp;&amp; KeepSet.has(Upid)) {
                        Kept.push(Card);
                    } else {
                        Rest.push(Card);
                    }
                }
                VideoCards = Kept.concat(Rest);
            }

            // 保留推广位
            let PromotedCards = [];
            if (Config.KeepPromoted) {
                PromotedCards = VideoCards.filter(Card =&gt; {
                    const Text = (Card.textContent || '').toLowerCase();
                    return Text.includes('推广') || Text.includes('广告') || Text.includes('sponsor');
                });
                VideoCards = VideoCards.filter(Card =&gt; !PromotedCards.includes(Card));
            }

            // 处理置顶/推荐卡片
            const TopSelectors = ['.bili-feed__banner', '.bili-feed__top', '.top-banner', '.recommend-banner'];
            let TopCards = [];
            for (const Sel of TopSelectors) {
                const Tops = document.querySelectorAll(Sel);
                for (const Top of Tops) {
                    const InnerCards = Top.querySelectorAll(Selector);
                    for (const Card of InnerCards) {
                        if (VideoCards.includes(Card)) {
                            TopCards.push(Card);
                            const Idx = VideoCards.indexOf(Card);
                            if (Idx !== -1) VideoCards.splice(Idx, 1);
                        }
                    }
                }
            }

            // 限制数量
            const Max = Math.max(1, Number(Config.MaxVideos) || 10);
            const ToShow = VideoCards.slice(0, Max);
            const ToHide = VideoCards.slice(Max);

            // 显示前max个
            ToShow.forEach(Card =&gt; { ShowCardTree(Card); });

            // 隐藏超出限制的卡片 以及 被过滤规则排除的卡片
            const AllToHide = ToHide.concat(ExcludedCards);
            AllToHide.forEach(Card =&gt; { HideCardTree(Card); });

            // 确保推广位和置顶卡片可见
            [...PromotedCards, ...TopCards].forEach(Card =&gt; { ShowCardTree(Card); });

            const Total = VideoCards.length + ExcludedCards.length + PromotedCards.length + TopCards.length;
            const Shown = ToShow.length + PromotedCards.length + TopCards.length;
            Log(T('LogProcessed', Total, Shown, ToHide.length + ExcludedCards.length));

        } catch (E) {
            ErrorLog(T('LogErrorLimit'), E);
        }
    }

    function RestoreAllVideos() {
        const Selector = DetectSelector();
        if (!Selector) return;
        const Cards = document.querySelectorAll(Selector);
        for (const Card of Cards) {
            ShowCardTree(Card);
        }
    }

    // ======================== CSS 样式（仅过滤类和动态配置面板） ========================
    function InjectStyles() {
        GM_addStyle(`
            .BiliLimitedHide {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                flex: 0 0 0 !important;
                position: absolute !important;
                pointer-events: none !important;
            }
        `);
    }

    // ======================== 配置面板（非侵入式：按需创建/销毁） ========================
    function InjectPanelStyles() {
        if (document.getElementById('BiliCompactPanelStyles')) return;
        const StyleEl = document.createElement('style');
        StyleEl.id = 'BiliCompactPanelStyles';
        StyleEl.textContent = `
            .BiliCompactOverlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.4);
                z-index: 2147483646;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 14px;
            }
            .BiliCompactPanel {
                /* Dark theme (default) variables */
                --bg: #1e1e1e;
                --text: #eee;
                --text-secondary: #ccc;
                --text-heading: #fff;
                --input-bg: #2a2a2a;
                --border: #333;
                --border-light: #444;
                --hr: #333;
                --accent: #fb7299;
                --accent-hover: #ff85a8;
                --badge-off: #666;
                --btn-secondary-bg: #444;
                --btn-secondary-hover: #555;
                --btn-secondary-text: #fff;
                --collapse-hover: #333;

                background: var(--bg);
                color: var(--text);
                padding: 24px 30px;
                border-radius: 16px;
                box-shadow: 0 8px 40px rgba(0,0,0,0.6);
                min-width: 340px;
                max-width: 420px;
                border: 1px solid var(--border);
                display: flex;
                flex-direction: column;
                gap: 12px;
                position: relative;
                max-height: 85vh;
                overflow-y: auto;
            }
            .BiliCompactPanel.light-mode {
                --bg: #ffffff;
                --text: #333;
                --text-secondary: #555;
                --text-heading: #111;
                --input-bg: #f5f5f5;
                --border: #ddd;
                --border-light: #e0e0e0;
                --hr: #eee;
                --accent: #00AEEC;
                --accent-hover: #33c0f0;
                --badge-off: #bbb;
                --btn-secondary-bg: #eee;
                --btn-secondary-hover: #ddd;
                --btn-secondary-text: #333;
                --collapse-hover: #eee;
                box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            }
            .BiliCompactPanel h3 {
                margin: 0 0 4px 0;
                font-weight: 500;
                color: var(--text-heading);
                font-size: 16px;
            }
            .BiliCompactPanel label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                color: var(--text-secondary);
                gap: 8px;
            }
            .BiliCompactPanel input[type="number"],
            .BiliCompactPanel input[type="text"] {
                background: var(--input-bg);
                border: 1px solid var(--border-light);
                color: var(--text);
                padding: 4px 10px;
                border-radius: 6px;
                width: 80px;
                font-size: 14px;
                font-family: inherit;
            }
            .BiliCompactPanel input[type="text"] {
                width: 140px;
            }
            .BiliCompactPanel select {
                background: var(--input-bg);
                border: 1px solid var(--border-light);
                color: var(--text);
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 14px;
                font-family: inherit;
                cursor: pointer;
            }
            .BiliCompactPanel input[type="checkbox"] {
                accent-color: var(--accent);
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            .BiliCompactPanel .BtnRow {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 6px;
                flex-wrap: wrap;
            }
            .BiliCompactPanel button {
                background: var(--accent);
                border: none;
                color: #fff;
                padding: 6px 18px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                font-family: inherit;
                transition: background 0.2s;
            }
            .BiliCompactPanel button.Secondary {
                background: var(--btn-secondary-bg);
                color: var(--btn-secondary-text);
            }
            .BiliCompactPanel button:hover {
                background: var(--accent-hover);
            }
            .BiliCompactPanel button.Secondary:hover {
                background: var(--btn-secondary-hover);
            }
            .BiliCompactPanel .Hint {
                font-size: 12px;
                color: #888;
                margin-top: -4px;
                line-height: 1.4;
            }
            .BiliCompactPanel .StatusRow {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 14px;
                color: var(--text-secondary);
            }
            .BiliCompactPanel .StatusBadge {
                background: var(--accent);
                color: #fff;
                border-radius: 12px;
                padding: 2px 12px;
                font-size: 12px;
                font-weight: bold;
            }
            .BiliCompactPanel .StatusBadge.Off {
                background: var(--badge-off);
            }
            /* Collapsible section */
            .BiliCompactPanel .CollapseHeader {
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                padding: 6px 8px;
                border-radius: 6px;
                user-select: none;
                font-size: 13px;
                color: var(--accent);
                font-weight: 500;
                transition: background 0.15s;
            }
            .BiliCompactPanel .CollapseHeader:hover {
                background: var(--collapse-hover);
            }
            .BiliCompactPanel .CollapseArrow {
                transition: transform 0.2s;
                font-size: 12px;
                line-height: 1;
            }
            .BiliCompactPanel .CollapseArrow.open {
                transform: rotate(90deg);
            }
            .BiliCompactPanel .CollapseContent {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .BiliCompactPanel .CollapseContent.collapsed {
                display: none;
            }
        `;
        document.head.appendChild(StyleEl);
    }

    let PanelDestroyFn = null;

    function OpenConfigPanel() {
        if (PanelDestroyFn) {
            PanelDestroyFn();
            PanelDestroyFn = null;
        }

        InjectPanelStyles();

        const Overlay = document.createElement('div');
        Overlay.className = 'BiliCompactOverlay';

        const Panel = document.createElement('div');
        Panel.className = 'BiliCompactPanel';

        // 应用颜色模式
        const effectiveColorMode = (Config.ColorMode || 'auto') === 'auto'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : Config.ColorMode;
        if (effectiveColorMode === 'light') {
            Panel.classList.add('light-mode');
        }

        // 语言选项
        const LangOptions = [
            { Value: 'auto',  Label: T('PanelLanguageAuto') },
            { Value: 'zh_CN', Label: '简体中文' },
            { Value: 'zh_TW', Label: '繁體中文' },
            { Value: 'en_US', Label: 'English' },
        ];
        const LangSelectHTML = LangOptions.map(Opt =&gt;
            `&lt;option value="${Opt.Value}" ${Config.Language === Opt.Value ? 'selected' : ''}&gt;${Opt.Label}&lt;/option&gt;`
        ).join('');

        Panel.innerHTML = `
            &lt;h3&gt;${T('PanelTitle')}&lt;/h3&gt;
            &lt;div class="StatusRow"&gt;
                &lt;span&gt;${T('PanelStatusLabel')}&lt;/span&gt;
                &lt;span class="StatusBadge ${IsActive ? '' : 'Off'}" id="CfgStatusBadge"&gt;${IsActive ? T('PanelStatusActive') : T('PanelStatusPaused')}&lt;/span&gt;
            &lt;/div&gt;
            &lt;label&gt;${T('PanelMaxVideos')} &lt;input type="number" id="CfgMax" value="${Config.MaxVideos}" min="1" max="100"&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelExcludeLive')} &lt;input type="checkbox" id="CfgExcludeLive" ${Config.ExcludeLive ? 'checked' : ''}&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelExcludeAd')} &lt;input type="checkbox" id="CfgExcludeAd" ${Config.ExcludeAd ? 'checked' : ''}&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelExcludeBangumi')} &lt;input type="checkbox" id="CfgExcludeBangumi" ${Config.ExcludeBangumi ? 'checked' : ''}&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelExcludePaid')} &lt;input type="checkbox" id="CfgExcludePaid" ${Config.ExcludePaid ? 'checked' : ''}&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelKeepPromoted')} &lt;input type="checkbox" id="CfgKeepPromoted" ${Config.KeepPromoted ? 'checked' : ''}&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelDebug')} &lt;input type="checkbox" id="CfgDebug" ${Config.Debug ? 'checked' : ''}&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelEnableCommentPurifier')} &lt;input type="checkbox" id="CfgEnablePurifier" ${Config.EnableCommentPurifier ? 'checked' : ''}&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelLanguage')} &lt;select id="CfgLanguage"&gt;${LangSelectHTML}&lt;/select&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelColorMode')} &lt;select id="CfgColorMode"&gt;
                &lt;option value="auto" ${(Config.ColorMode || 'auto') === 'auto' ? 'selected' : ''}&gt;${T('PanelColorAuto')}&lt;/option&gt;
                &lt;option value="dark" ${Config.ColorMode === 'dark' ? 'selected' : ''}&gt;${T('PanelColorDark')}&lt;/option&gt;
                &lt;option value="light" ${Config.ColorMode === 'light' ? 'selected' : ''}&gt;${T('PanelColorLight')}&lt;/option&gt;
            &lt;/select&gt;&lt;/label&gt;
            &lt;label&gt;${T('PanelKeepUpids')} &lt;input type="text" id="CfgKeepUids" value="${(Config.KeepSpecialUPIDs || []).join(',')}"&gt;&lt;/label&gt;
            &lt;hr style="margin:8px 0;border:none;border-top:1px solid var(--hr, #333)"&gt;
            &lt;div class="CollapseHeader" id="CfgCollapseRm"&gt;
                &lt;span class="CollapseArrow" id="CfgCollapseRmArrow"&gt;▸&lt;/span&gt;
                &lt;span&gt;${'去除元素'}&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class="CollapseContent collapsed" id="CfgCollapseRmContent"&gt;
            ${ELEMENT_REMOVAL_PRESETS.map(function(P) {
                return '&lt;label&gt;&lt;span style="flex:1"&gt;' + P.name + '&lt;/span&gt; &lt;input type="checkbox" id="CfgRm_' + P.id + '" ' + ((Config.RemovedElements || {})[P.id] ? 'checked' : '') + '&gt;&lt;/label&gt;';
            }).join('')}
            &lt;/div&gt;
            &lt;div class="BtnRow"&gt;
                &lt;button class="Secondary" id="CfgToggle"&gt;${IsActive ? T('PanelBtnPause') : T('PanelBtnResume')}&lt;/button&gt;
                &lt;button class="Secondary" id="CfgReset"&gt;${T('PanelBtnReset')}&lt;/button&gt;
                &lt;button id="CfgSave"&gt;${T('PanelBtnSave')}&lt;/button&gt;
            &lt;/div&gt;
        `;

        Overlay.appendChild(Panel);
        document.body.appendChild(Overlay);

        // —— 事件绑定 ——

        document.getElementById('CfgSave').addEventListener('click', function() {
            const Max = parseInt(document.getElementById('CfgMax').value) || 10;
            const NewLang = document.getElementById('CfgLanguage').value;
            const LangChanged = NewLang !== Config.Language;

            const NewConfig = {
                MaxVideos: Max,
                ExcludeLive: document.getElementById('CfgExcludeLive').checked,
                ExcludeAd: document.getElementById('CfgExcludeAd').checked,
                ExcludeBangumi: document.getElementById('CfgExcludeBangumi').checked,
                ExcludePaid: document.getElementById('CfgExcludePaid').checked,
                KeepPromoted: document.getElementById('CfgKeepPromoted').checked,
                Language: NewLang,
                ColorMode: document.getElementById('CfgColorMode').value,
                KeepSpecialUPIDs: document.getElementById('CfgKeepUids').value.split(',').map(S =&gt; S.trim()).filter(Boolean).map(Number),
                Debug: document.getElementById('CfgDebug').checked,
                EnableCommentPurifier: document.getElementById('CfgEnablePurifier').checked,
                RemovedElements: (function() {
                    var obj = {};
                    for (var I = 0; I &lt; ELEMENT_REMOVAL_PRESETS.length; I++) {
                        var cb = document.getElementById('CfgRm_' + ELEMENT_REMOVAL_PRESETS[I].id);
                        if (cb) obj[ELEMENT_REMOVAL_PRESETS[I].id] = cb.checked;
                    }
                    return obj;
                })()
            };
            Object.assign(Config, NewConfig);
            SaveConfig(Config);

            // 语言变更时立即生效
            if (LangChanged) {
                CurrentLang = ResolveLanguage();
            }

            DestroyPanel();
            LimitVideos();
            applyElementRemoval();

            // 评论净化器开关变更后立即启停
            if (NewConfig.EnableCommentPurifier) {
                startCommentPurifier();
            } else {
                stopCommentPurifier();
            }

            // 语言变更后重新打开面板（让用户看到新语言）
            if (LangChanged) {
                setTimeout(() =&gt; OpenConfigPanel(), 100);
            }
        });

        document.getElementById('CfgReset').addEventListener('click', function() {
            Object.assign(Config, DEFAULTS);
            SaveConfig(Config);
            CurrentLang = ResolveLanguage();
            // 刷新面板输入
            document.getElementById('CfgMax').value = Config.MaxVideos;
            document.getElementById('CfgExcludeLive').checked = Config.ExcludeLive;
            document.getElementById('CfgExcludeAd').checked = Config.ExcludeAd;
            document.getElementById('CfgExcludeBangumi').checked = Config.ExcludeBangumi;
            document.getElementById('CfgExcludePaid').checked = Config.ExcludePaid;
            document.getElementById('CfgKeepPromoted').checked = Config.KeepPromoted;
            document.getElementById('CfgDebug').checked = Config.Debug;
            document.getElementById("CfgEnablePurifier").checked = false;
            document.getElementById('CfgColorMode').value = Config.ColorMode || 'auto';
            document.getElementById('CfgKeepUids').value = '';
            for (var I = 0; I &lt; ELEMENT_REMOVAL_PRESETS.length; I++) {
                var cb = document.getElementById('CfgRm_' + ELEMENT_REMOVAL_PRESETS[I].id);
                if (cb) cb.checked = false;
            }
            stopCommentPurifier();
            // 重置后重新应用颜色模式主题
            const resetPanel = document.querySelector('.BiliCompactPanel');
            if (resetPanel) {
                const resetMode = (Config.ColorMode || 'auto') === 'auto'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : Config.ColorMode;
                resetPanel.classList.toggle('light-mode', resetMode === 'light');
            }
            LimitVideos();
            applyElementRemoval();
        });

        document.getElementById('CfgToggle').addEventListener('click', function() {
            IsActive = !IsActive;
            if (IsActive) {
                LimitVideos();
            } else {
                RestoreAllVideos();
            }
            const Badge = document.getElementById('CfgStatusBadge');
            if (Badge) {
                Badge.textContent = IsActive ? T('PanelStatusActive') : T('PanelStatusPaused');
                Badge.className = 'StatusBadge' + (IsActive ? '' : ' Off');
            }
            this.textContent = IsActive ? T('PanelBtnPause') : T('PanelBtnResume');
        });

        // 去除元素折叠切换
        document.getElementById('CfgCollapseRm').addEventListener('click', function() {
            const content = document.getElementById('CfgCollapseRmContent');
            const arrow = document.getElementById('CfgCollapseRmArrow');
            const isCollapsed = content.classList.contains('collapsed');
            if (isCollapsed) {
                content.classList.remove('collapsed');
                arrow.classList.add('open');
            } else {
                content.classList.add('collapsed');
                arrow.classList.remove('open');
            }
        });

        Overlay.addEventListener('click', function(E) {
            if (E.target === Overlay) {
                DestroyPanel();
            }
        });

        function OnKeyDown(E) {
            if (E.key === 'Escape') {
                DestroyPanel();
            }
        }
        document.addEventListener('keydown', OnKeyDown);

        function DestroyPanel() {
            document.removeEventListener('keydown', OnKeyDown);
            if (Overlay.parentNode) {
                Overlay.parentNode.removeChild(Overlay);
            }
            PanelDestroyFn = null;
        }

        PanelDestroyFn = DestroyPanel;
    }

    function CloseConfigPanel() {
        if (PanelDestroyFn) {
            PanelDestroyFn();
            PanelDestroyFn = null;
        }
    }


    // ======================== 观察者 ========================
    function InitObserver() {
        if (Observer) {
            Observer.disconnect();
            Observer = null;
        }

        const Container = DetectContainer();
        if (!Container) return;

        Observer = new MutationObserver(function(Mutations) {
            let ShouldProcess = false;
            for (const Mutation of Mutations) {
                if (Mutation.type === 'childList' &amp;&amp; (Mutation.addedNodes.length &gt; 0 || Mutation.removedNodes.length &gt; 0)) {
                    for (const Node of Mutation.addedNodes) {
                        if (Node.nodeType === 1) {
                            const Sel = DetectSelector();
                            if (Sel &amp;&amp; (Node.matches(Sel) || Node.querySelector(Sel))) {
                                ShouldProcess = true;
                                break;
                            }
                        }
                    }
                    if (!ShouldProcess) {
                        for (const Node of Mutation.removedNodes) {
                            if (Node.nodeType === 1) {
                                const Sel = DetectSelector();
                                if (Sel &amp;&amp; (Node.matches(Sel) || Node.querySelector(Sel))) {
                                    ShouldProcess = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (ShouldProcess) break;
            }

            if (ShouldProcess) {
                const Now = Date.now();
                if (Now - LastRun &lt; THROTTLE_INTERVAL) {
                    clearTimeout(DebounceTimer);
                    DebounceTimer = setTimeout(() =&gt; {
                        LastRun = Date.now();
                        LimitVideos();
                    }, 300);
                } else {
                    LastRun = Now;
                    LimitVideos();
                }
            }
        });

        Observer.observe(Container, {
            childList: true,
            subtree: true,
            attributes: false
        });

        Log(T('LogObserverStarted'), Container);
    }

    // ======================== 路由变化监听 ========================
    function WatchUrlChange() {
        let LastUrl = location.href;
        setInterval(() =&gt; {
            if (location.href !== LastUrl) {
                LastUrl = location.href;
                Log(T('LogUrlChanged'), LastUrl);
                EffectiveSelector = null;
                VideoListContainer = null;
                setTimeout(() =&gt; {
                    DetectSelector();
                    DetectContainer();
                    LimitVideos();
                    applyElementRemoval();
                }, 500);
            }
        }, 1000);
    }

    // ======================== 菜单命令（唯一入口，在语言解析后注册） ========================
    function RegisterMenu() {
        GM_registerMenuCommand(T('MenuSettings'), function() {
            OpenConfigPanel();
        });
        GM_registerMenuCommand(T('MenuRefresh'), function() {
            EffectiveSelector = null;
            VideoListContainer = null;
            LimitVideos();
        });
        GM_registerMenuCommand(T('MenuToggle'), function() {
            IsActive = !IsActive;
            if (IsActive) {
                LimitVideos();
            } else {
                RestoreAllVideos();
            }
            Log(T('LogStatus'), IsActive ? T('LogStatusOn') : T('LogStatusOff'));
        });
        GM_registerMenuCommand(T('MenuCommentPurifier'), function() {
            toggleCommentPurifier();
        });
        GM_registerMenuCommand(T('MenuQuickSet'), function() {
            const Num = prompt(T('PromptQuickSet'), Config.MaxVideos);
            if (Num !== null) {
                const N = parseInt(Num);
                if (N &gt;= 1 &amp;&amp; N &lt;= 100) {
                    Config.MaxVideos = N;
                    SaveConfig({ MaxVideos: N });
                    if (!IsActive) {
                        IsActive = true;
                    }
                    LimitVideos();
                    Log(T('LogQuickSet'), N);
                }
            }
        });
    }

    // ======================== 初始化 ========================
    function Init() {
        try {
            // 加载配置
            Config = GetConfig();

            // 解析语言（必须在任何 T() 调用之前）
            CurrentLang = ResolveLanguage();

            Log(T('LogConfigLoaded'), Config);

            // 注入样式（仅过滤类，不注入任何UI节点）
            InjectStyles();

            // 注册菜单（TM菜单是唯一入口，不在页面注入UI）
            RegisterMenu();

            // 启动评论净化器（如果启用）
            startCommentPurifier();

            // 启动观察
            InitObserver();

            // 路由监听
            WatchUrlChange();

            // 初次执行
            setTimeout(() =&gt; {
                DetectSelector();
                DetectContainer();
                LimitVideos();
                applyElementRemoval();
            }, 500);

            // 定时后备检查
            setInterval(() =&gt; {
                if (IsActive) {
                    const Selector = DetectSelector();
                    if (Selector) {
                        const Cards = document.querySelectorAll(Selector);
                        let VisibleCount = 0;
                        for (const Card of Cards) {
                            if (!(Card.style.display === 'none' || Card.classList.contains('BiliLimitedHide'))) {
                                VisibleCount++;
                            }
                        }
                        if (VisibleCount &gt; Config.MaxVideos) {
                            Log(T('LogTimerRetry'));
                            LimitVideos();
                        }
                    }
                }
                // 定时重试元素去除（B站SPA可能动态替换DOM）
                applyElementRemoval();
            }, 5000);

            Log(T('LogInitDone'), Config);

        } catch (E) {
            ErrorLog(T('LogInitError'), E);
        }
    }

    // 页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Init);
    } else {
        Init();
    }

})();

```

---

## 一键安装

<span class="install-badge">推荐</span>

### 方式一：Greasyfork 直接安装（推荐）

点击下方按钮，一键安装到 Tampermonkey / Violentmonkey：

<div class="install-block">
    <a class="install-btn" href="https://greasyfork.org/scripts/585777" target="_blank" rel="noopener">
        从 Greasyfork 安装
    </a>
    <p class="install-hint">已上架 Greasyfork，自动更新，省心省力。</p>
</div>

### 方式二：复制源码，手动创建

如果你想审查每一行代码再安装，也可以复制上面的源码，在 Tampermonkey 中新建脚本，粘贴保存即可。

```bash
1. 打开浏览器的 Tampermonkey / Violentmonkey 扩展
2. 点击「新建脚本」
3. 删除默认内容，粘贴上方源码
4. Ctrl+S 保存
```

两种方式效果完全一致，推荐方式一，后续新版本会自动推送更新。

---

<!-- ============================================================
     复制按钮组件（自包含）
     功能：在页面中定位 BiliCompact 源码块，添加一键复制按钮
     用法：直接粘贴到文章 HTML 中即可，样式和脚本全部内联
     ============================================================ -->

<div id="bili-compact-copy-section">
    <!-- 工具栏：标题 + 复制按钮 -->
    <div class="bcc-toolbar">
        <span class="bcc-title">
            <span class="bcc-icon">复制</span>
            BiliCompact v2.6.0 完整源码
        </span>
        <button class="bcc-btn" id="bcc-copy-btn" title="点击复制全部源码">
            <span class="bcc-btn-icon">复制</span>
            <span class="bcc-btn-text">复制代码</span>
        </button>
    </div>

    <!-- 复制成功提示（浮窗） -->
    <div class="bcc-toast" id="bcc-toast"> 已复制到剪贴板！</div>
</div>

<style>
    /* ===== 组件容器 ===== */
    #bili-compact-copy-section {
        position: relative;
        margin: 1.5rem 0 0.5rem 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        /* 默认跟随系统深色模式，也可通过 .bcc-dark / .bcc-light 覆盖 */;
    }

    /* ===== 工具栏 ===== */
    .bcc-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px 16px;
        padding: 12px 20px;
        border-radius: 12px 12px 0 0;
        background: var(--bcc-bg, #1e1e1e);
        border-bottom: 1px solid var(--bcc-border, #333);
        transition: background 0.25s, border-color 0.25s;
        /* 跟随系统深色/浅色 */;
    }

    /* 标题 */
    .bcc-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        color: var(--bcc-text, #eee);
        font-size: 15px;
        letter-spacing: 0.3px;
        user-select: none;
    }
    .bcc-icon {
        font-size: 18px;
        line-height: 1;
    }

    /* ===== 复制按钮 ===== */
    .bcc-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 18px 6px 14px;
        border: none;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        background: var(--bcc-accent, #fb7299);
        color: #fff;
        transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
        box-shadow: 0 2px 8px rgba(251, 114, 153, 0.25);
        white-space: nowrap;
    }
    .bcc-btn:hover {
        background: var(--bcc-accent-hover, #ff85a8);
        box-shadow: 0 4px 14px rgba(251, 114, 153, 0.35);
        transform: translateY(-1px);
    }
    .bcc-btn:active {
        transform: translateY(0px) scale(0.97);
        box-shadow: 0 1px 4px rgba(251, 114, 153, 0.2);
    }
    .bcc-btn:focus-visible {
        outline: 2px solid var(--bcc-accent, #fb7299);
        outline-offset: 2px;
    }
    /* 复制成功状态 */
    .bcc-btn.copied {
        background: #2ea043;
        box-shadow: 0 2px 8px rgba(46, 160, 67, 0.3);
    }
    .bcc-btn.copied:hover {
        background: #3fb950;
    }
    .bcc-btn-icon {
        font-size: 16px;
        line-height: 1;
    }
    .bcc-btn-text {
        line-height: 1.4;
    }

    /* ===== Toast 提示 ===== */
    .bcc-toast {
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        padding: 10px 28px;
        border-radius: 12px;
        background: rgba(30, 30, 30, 0.92);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        font-family: inherit;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.08);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 2147483647;
        white-space: nowrap;
    }
    .bcc-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0px);
    }

    /* ===== 深色 / 浅色 自适应（通过 prefers-color-scheme） ===== */
    /* 深色（默认） */
    #bili-compact-copy-section {
        --bcc-bg: #1e1e1e;
        --bcc-border: #333;
        --bcc-text: #eee;
        --bcc-accent: #fb7299;
        --bcc-accent-hover: #ff85a8;
    }
    /* 浅色模式覆盖 */
    @media (prefers-color-scheme: light) {
        #bili-compact-copy-section {
            --bcc-bg: #f6f6f6;
            --bcc-border: #e0e0e0;
            --bcc-text: #222;
            --bcc-accent: #00aeec;
            --bcc-accent-hover: #33c0f0;
        }
        .bcc-btn {
            box-shadow: 0 2px 8px rgba(0, 174, 236, 0.2);
        }
        .bcc-btn:hover {
            box-shadow: 0 4px 14px rgba(0, 174, 236, 0.3);
        }
        .bcc-toast {
            background: rgba(255, 255, 255, 0.95);
            color: #222;
            border: 1px solid rgba(0, 0, 0, 0.06);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }
    }

    /* ===== 响应式 ===== */
    @media (max-width: 480px) {
        .bcc-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px 16px;
        }
        .bcc-title {
            font-size: 14px;
        }
        .bcc-btn {
            justify-content: center;
            padding: 8px 16px;
            font-size: 14px;
        }
        .bcc-toast {
            font-size: 13px;
            padding: 8px 20px;
            white-space: normal;
            max-width: 90vw;
        }
    }

    /* ===== 与页面已有代码块无缝衔接 ===== */
    /* 让工具栏紧贴代码块上方，无多余间距 */
    figure.highlight {
        margin-top: 0 !important;
        border-radius: 0 0 12px 12px !important;
    }
    /* 如果 figure 有上边距，覆盖掉 */
    .highlight {
        margin-top: 0 !important;
    }
    /* 修复可能的滚动容器样式 */
    .highlight table {
        border-radius: 0 !important;
    }
</style>

<script>
    (function() {
        'use strict';

        // ----- 配置 -----
        const CONFIG = {
            // 源码块选择器（精确匹配 BiliCompact 的 JS 代码块）
            codeBlockSelector: 'figure.highlight.javascript .code pre',
            // 备选选择器（如果主选择器匹配不到，尝试更宽泛的）
            fallbackSelector: '.highlight.javascript .code pre',
            // 按钮和 Toast 的 ID
            btnId: 'bcc-copy-btn',
            toastId: 'bcc-toast',
            // 复制成功时按钮文字
            successText: '已复制！',
            // 复制成功提示持续时间（ms）
            toastDuration: 2200,
            // 按钮恢复文字的时间（ms）
            btnResetDelay: 2000,
        };

        // ----- DOM 引用 -----
        let btn = null;
        let toast = null;
        let resetTimer = null;
        let toastTimer = null;

        // ----- 工具：获取源码文本 -----
        function getSourceCode() {
            // 尝试主选择器
            let pre = document.querySelector(CONFIG.codeBlockSelector);
            // 如果失败，尝试备选
            if (!pre) {
                pre = document.querySelector(CONFIG.fallbackSelector);
            }
            if (!pre) {
                console.warn('[BCCopy] 未找到源码块，请检查选择器');
                return null;
            }
            // 提取文本内容（保留换行和缩进）
            return pre.textContent || '';
        }

        // ----- 复制到剪贴板 -----
        async function copyToClipboard(text) {
            if (!text) return false;
            try {
                // 优先使用 Clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    return true;
                }
                // 降级方案：使用 document.execCommand
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                ta.style.top = '-9999px';
                ta.style.width = '1px';
                ta.style.height = '1px';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(ta);
                return ok;
            } catch (err) {
                console.error('[BCCopy] 复制失败:', err);
                return false;
            }
        }

        // ----- 显示 Toast -----
        function showToast(message) {
            if (!toast) return;
            // 清除之前的定时器
            if (toastTimer) {
                clearTimeout(toastTimer);
                toastTimer = null;
            }
            toast.textContent = message || ' 已复制到剪贴板！';
            toast.classList.add('show');
            toastTimer = setTimeout(function() {
                toast.classList.remove('show');
                toastTimer = null;
            }, CONFIG.toastDuration);
        }

        // ----- 按钮点击处理 -----
        async function handleCopy() {
            if (!btn) return;

            // 如果按钮处于"已复制"状态，重置后再执行
            if (btn.classList.contains('copied')) {
                // 但允许再次点击，重置状态
                resetButton();
            }

            // 获取源码
            const code = getSourceCode();
            if (code === null || code.trim() === '') {
                showToast(' 未找到源码，请检查页面结构');
                return;
            }

            // 执行复制
            const ok = await copyToClipboard(code);
            if (ok) {
                // 成功：按钮变绿，显示成功文字
                btn.classList.add('copied');
                const originalText = btn.querySelector('.bcc-btn-text');
                if (originalText) {
                    originalText.textContent = CONFIG.successText;
                }
                showToast(' 已复制到剪贴板！');

                // 定时恢复按钮文字
                if (resetTimer) {
                    clearTimeout(resetTimer);
                    resetTimer = null;
                }
                resetTimer = setTimeout(function() {
                    resetButton();
                }, CONFIG.btnResetDelay);
            } else {
                showToast(' 复制失败，请手动选择复制');
            }
        }

        // ----- 恢复按钮原始状态 -----
        function resetButton() {
            if (!btn) return;
            btn.classList.remove('copied');
            const textEl = btn.querySelector('.bcc-btn-text');
            if (textEl) {
                // 从 data 属性恢复原始文字，或使用默认
                const orig = textEl.dataset.originalText || '复制代码';
                textEl.textContent = orig;
            }
            if (resetTimer) {
                clearTimeout(resetTimer);
                resetTimer = null;
            }
        }

        // ----- 保存按钮原始文字 -----
        function preserveButtonText() {
            if (!btn) return;
            const textEl = btn.querySelector('.bcc-btn-text');
            if (textEl && !textEl.dataset.originalText) {
                textEl.dataset.originalText = textEl.textContent || '复制代码';
            }
        }

        // ----- 初始化组件 -----
        function init() {
            // 获取按钮和 Toast
            btn = document.getElementById(CONFIG.btnId);
            toast = document.getElementById(CONFIG.toastId);

            if (!btn) {
                console.warn('[BCCopy] 未找到复制按钮，请检查 ID');
                return;
            }

            // 保存按钮原始文字
            preserveButtonText();

            // 绑定点击事件
            btn.addEventListener('click', handleCopy);

            // 键盘支持：回车/空格触发
            btn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCopy();
                }
            });

            // 初始状态：确保按钮文字正确
            resetButton();

            // 小延迟后检查是否需要适配深色/浅色模式
            // （页面可能动态切换主题，但我们的组件使用 prefers-color-scheme，自动适配）
            console.log('[BCCopy] 复制按钮已就绪 ');
        }

        // ----- 启动时机 -----
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            // DOM 已就绪，立即执行
            // 但为了确保所有元素都已渲染，使用微任务或短延迟
            if (document.readyState === 'complete') {
                init();
            } else {
                // interactive 状态，等待一帧
                requestAnimationFrame(init);
            }
        }
    })();
</script>
