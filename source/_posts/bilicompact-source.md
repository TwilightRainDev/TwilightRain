---
title: BiliCompact 完整源码（MIT 协议，可自由复制使用）
date: 2026-07-21 15:20:00
tags:
  - BiliCompact
  - Tampermonkey
  - JavaScript
  - 源码
categories:
  - 代码仓库
---

> 以下为 BiliCompact 用户脚本的完整源码，MIT 协议，可自由使用、修改、分发。
> 安装方法：复制到 Tampermonkey / Violentmonkey 新建脚本中保存即可。

```javascript
// ==UserScript==
// @name         网页端B站主页精简~ BiliCompact
// @namespace    http://tampermonkey.net/
// @version      2.5.1
// @license MIT
// @description  你是否厌倦了B站网页端极多视频？想要更简要的界面？这个插件将帮助你只显示指定数量的视频，支持多种页面、黑/白名单、配置持久化。非侵入式设计，不在B站页面注入任何UI元素。支持简中，繁中，英语。
// @author       TwilightRain
// @match        https://www.bilibili.com/
// @match        https://www.bilibili.com/?*
// @match        https://www.bilibili.com/index/*
// @match        https://www.bilibili.com/v/popular/*
// @match        https://www.bilibili.com/v/*/*
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

            MenuSettings: 'B站精简设置',
            MenuRefresh: '手动刷新精简',
            MenuToggle: '切换精简状态',
            MenuQuickSet: '快速设数量',
            MenuCommentPurifier: '切换评论净化',

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

            PromptQuickSet: '输入最大显示视频数量（1-100）：',
        },
        zh_TW: {
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

            MenuSettings: 'B站精簡設定',
            MenuRefresh: '手動重新整理精簡',
            MenuToggle: '切換精簡狀態',
            MenuQuickSet: '快速設數量',
            MenuCommentPurifier: '切換評論淨化',

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

            PromptQuickSet: '輸入最大顯示影片數量（1-100）：',
        },
        en_US: {
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

            MenuSettings: 'BiliCompact Settings',
            MenuRefresh: 'Refresh Compact',
            MenuToggle: 'Toggle Compact',
            MenuQuickSet: 'Quick Set Count',
            MenuCommentPurifier: 'Toggle Comment Purifier',

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
            PanelBtnSave: 'Save & Apply',
            PanelBtnClose: 'Close',

            PromptQuickSet: 'Enter max videos to show (1-100):',
        }
    };

    let CurrentLang = 'zh_CN';

    function ResolveLanguage() {
        if (Config.Language && Config.Language !== 'auto') {
            return Config.Language;
        }
        const Nav = (navigator.language || '').toLowerCase();
        if (/^zh-(tw|hk|mo)$/i.test(Nav) || /^zh-(hant)$/i.test(Nav)) return 'zh_TW';
        if (/^zh/i.test(Nav)) return 'zh_CN';
        if (/^en/i.test(Nav)) return 'en_US';
        return 'zh_CN';
    }

    function T(Key, ...Args) {
        const Map = I18N[CurrentLang] || I18N['zh_CN'];
        let Str = Map[Key];
        if (Str === undefined) {
            Str = I18N['zh_CN'][Key];
        }
        if (Str === undefined) return Key;
        for (let I = 0; I < Args.length; I++) {
            Str = Str.replace('{' + I + '}', Args[I]);
        }
        return Str;
    }

    // ======================== 配置 ========================
    const DEFAULTS = {
        MaxVideos: 10,
        ExcludeLive: true,
        ExcludeAd: true,
        ExcludeBangumi: true,
        ExcludePaid: true,
        KeepSpecialUPIDs: [],
        KeepPromoted: false,
        Language: 'auto',
        Debug: false,
        EnableCommentPurifier: false,
        RemovedElements: {},
    };

    let Config = {};
    let IsActive = true;
    let EffectiveSelector = null;
    let VideoListContainer = null;
    let Observer = null;
    let DebounceTimer = null;
    let PurifierStarted = false;
    let PurifierObservers = [];
    let LastRun = 0;
    const THROTTLE_INTERVAL = 200;

    // ======================== 工具函数 ========================
    function Log(...Args) {
        if (Config.Debug) console.log(T('LogPrefix'), ...Args);
    }

    function ErrorLog(...Args) {
        console.error(T('LogPrefix'), ...Args);
    }

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

    // ======================== 评论净化器 ========================
    function purifierHasBlockerInstalled() {
        try {
            const comments = document.querySelector('bili-comments');
            if (!comments?.shadowRoot) return false;
            const threads = comments.shadowRoot.querySelectorAll('bili-comment-thread-renderer');
            if (threads.length === 0) return false;
            return Array.from(threads).some(thread => {
                const comment = thread.shadowRoot?.getElementById('comment');
                if (!comment?.shadowRoot) return false;
                const userInfo = comment.shadowRoot.querySelector('bili-comment-user-info');
                if (!userInfo?.shadowRoot) return false;
                const info = userInfo.shadowRoot.getElementById('info');
                return !!info?.querySelector('button[gz_type]');
            });
        } catch { return false; }
    }

    function purifierGetContentsEl(renderer) {
        try {
            const richText = renderer.shadowRoot.querySelector('bili-rich-text');
            if (richText && richText.shadowRoot) {
                return richText.shadowRoot.getElementById('contents');
            }
        } catch (_) {}
        return null;
    }

    function purifierFindRenderers() {
        const list = [];
        try {
            const comments = document.querySelector('bili-comments');
            if (comments && comments.shadowRoot) {
                const threads = comments.shadowRoot.querySelectorAll('bili-comment-thread-renderer');
                for (const thread of threads) {
                    if (thread.shadowRoot) {
                        thread.shadowRoot.querySelectorAll('bili-comment-renderer').forEach(r => list.push(r));
                    }
                }
            }
        } catch (_) {}
        return list;
    }

    function purifierProcessRenderer(renderer) {
        const doneKey = 'bcPurified';
        if (renderer.dataset[doneKey]) return;
        renderer.dataset[doneKey] = '1';

        const contents = purifierGetContentsEl(renderer);
        if (!contents) return;

        const mentions = contents.querySelectorAll('a[data-type="mention"]');
        for (const m of mentions) {
            m.remove();
        }

        const remaining = contents.textContent.replace(/\s+/g, '').trim();

        if (remaining.length < 5) {
            renderer.style.display = 'none';
            try {
                const threadRenderer = renderer.getRootNode().host;
                if (threadRenderer) threadRenderer.style.display = 'none';
            } catch (_) {}
        }
    }

    function startCommentPurifier() {
        if (!Config.EnableCommentPurifier) return;
        if (PurifierStarted) return;
        PurifierStarted = true;

        let scanTimer = null;

        function scheduleScan() {
            if (scanTimer) clearTimeout(scanTimer);
            scanTimer = setTimeout(() => {
                purifierFindRenderers().forEach(purifierProcessRenderer);
                scanTimer = null;
            }, 800);
        }

        try {
            const comments = document.querySelector('bili-comments');
            if (comments?.shadowRoot) {
                const obs = new MutationObserver(() => scheduleScan());
                obs.observe(comments.shadowRoot, { childList: true, subtree: true });
                PurifierObservers.push(obs);
            }
        } catch (_) {}

        const obsBody = new MutationObserver(() => scheduleScan());
        obsBody.observe(document.body, { childList: true, subtree: true });
        PurifierObservers.push(obsBody);

        purifierFindRenderers().forEach(purifierProcessRenderer);

        const hasBlocker = purifierHasBlockerInstalled();
        Log('评论净化器已启动' + (hasBlocker ? '（检测到 BilibiliBlocker，兼容模式）' : ''));
    }

    function stopCommentPurifier() {
        PurifierStarted = false;
        for (const obs of PurifierObservers) {
            try { obs.disconnect(); } catch (_) {}
        }
        PurifierObservers = [];
        Log('评论净化器已停止');
    }

    function toggleCommentPurifier() {
        Config.EnableCommentPurifier = !Config.EnableCommentPurifier;
        SaveConfig({ EnableCommentPurifier: Config.EnableCommentPurifier });
        if (Config.EnableCommentPurifier) {
            startCommentPurifier();
        } else {
            stopCommentPurifier();
        }
    }

    // ======================== 元素去除预设 ========================
    const ELEMENT_REMOVAL_PRESETS = [
        {
            id: 'carousel', host: 'www.bilibili.com', name: '首页轮播图',
            selectors: [
                '#i_cecream > div.bili-feed4:last-child > main.bili-feed4-layout:nth-child(3) > div.feed2:last-child > div.recommended-container_floor-aside > div.container.is-version8:first-child > div.recommended-swipe.grid-anchor:first-child > div.recommended-swipe-core > div.recommended-swipe-body:last-child > div.carousel-area > div.carousel',
                '#app > div.bili-feed4:last-child > main.bili-feed4-layout:nth-child(2) > div.feed2:last-child > div.recommended-container_floor-aside > div.container.is-version8:first-child > div.recommended-swipe:first-child',
            ]
        },
        {
            id: 'right-channel', host: 'www.bilibili.com', name: '右侧频道导航',
            selectors: [
                '#i_cecream > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__channel:nth-child(3) > div.right-channel-container:last-child',
            ]
        },
        {
            id: 'channel-icons', host: 'www.bilibili.com', name: '频道图标行',
            selectors: [
                '#i_cecream > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__channel:nth-child(3) > div.channel-icons:first-child',
            ]
        },
        {
            id: 'channel-bar', host: 'www.bilibili.com', name: '频道栏（整体）',
            selectors: ['#app > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__channel:last-child']
        },
        {
            id: 'creation-entry', host: 'www.bilibili.com', name: '创作中心入口',
            selectors: ['#i_cecream > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__bar:first-child > ul.left-entry:first-child > li.v-popover-wrap.left-loc-entry:nth-child(8) > div']
        },
        {
            id: 'upload-entry', host: 'www.bilibili.com', name: '投稿入口',
            selectors: ['#i_cecream > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__bar:first-child > ul.left-entry:first-child > li.v-popover-wrap.left-loc-entry:nth-child(9) > div > a.loc-entry.loc-moveclip']
        },
        {
            id: 'live-entry', host: 'www.bilibili.com', name: '直播入口',
            selectors: ['#i_cecream > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__bar:first-child > ul.left-entry:first-child > li.v-popover-wrap:last-child']
        },
        {
            id: 'dynamic-entry', host: 'www.bilibili.com', name: '动态入口',
            selectors: ['#i_cecream > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__bar:first-child > ul.left-entry:first-child > li.v-popover-wrap:nth-child(5)']
        },
        {
            id: 'vip-entry', host: 'www.bilibili.com', name: '大会员VIP',
            selectors: ['#i_cecream > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__bar:first-child > ul.right-entry:last-child > div.vip-wrap:nth-child(2)']
        },
        {
            id: 'adblock-tips', host: 'www.bilibili.com', name: '广告提示条',
            selectors: ['#i_cecream > div.adblock-tips:nth-child(2)']
        },
        {
            id: 'left-entries', host: 'www.bilibili.com', name: '左侧全部入口',
            selectors: ['#app > div.bili-feed4:last-child > div.bili-header.large-header:first-child > div.bili-header__bar:first-child > ul.left-entry:first-child']
        },
        {
            id: 'palette-btn', host: 'www.bilibili.com', name: '调色板浮窗',
            selectors: ['#app > div.bili-feed4:last-child > div.palette-button-outer.palette-feed4:nth-child(4)']
        },
        {
            id: 'space-notif', host: 'space.bilibili.com', name: '空间-消息通知',
            selectors: ['#biliMainHeader > div.bili-header > div.bili-header__bar.mini-header:first-child > ul.left-entry:first-child > li.v-popover-wrap:last-child']
        }
    ];

    let ElementRemovalStates = {};

    function applyElementRemoval() {
        const enabled = Config.RemovedElements || {};
        const host = location.hostname;

        for (const id of Object.keys(ElementRemovalStates)) {
            if (!enabled[id]) {
                ElementRemovalStates[id].element.style.display = ElementRemovalStates[id].originalDisplay;
                delete ElementRemovalStates[id];
            }
        }

        for (const preset of ELEMENT_REMOVAL_PRESETS) {
            if (preset.host !== host) continue;
            if (!enabled[preset.id]) continue;
            if (ElementRemovalStates[preset.id]) continue;

            for (const sel of preset.selectors) {
                try {
                    const el = document.querySelector(sel);
                    if (el) {
                        ElementRemovalStates[preset.id] = {
                            element: el,
                            originalDisplay: el.style.display || ''
                        };
                        el.style.display = 'none';
                        break;
                    }
                } catch (_) {}
            }
        }
    }

    // ======================== 选择器探测 ========================
    function DetectSelector() {
        if (EffectiveSelector) return EffectiveSelector;

        const SpecificCandidates = [
            '.bili-video-card', '.feed-card', '.bili-feed-card',
            '.floor-single-card', '.floor-card', '.video-item', '.feed-item'
        ];

        const BroadCandidates = [
            '[class*="video-card"]', '[class*="bili-video"]',
            '[class*="feed-card"]', '[class*="feed-item"]', '[class*="floor-card"]'
        ];

        const MatchedSelectors = [];

        const DataCandidates = ['[data-video-id]', '[data-aid]'];
        for (const Sel of DataCandidates) {
            const Els = document.querySelectorAll(Sel);
            if (Els.length > 0) {
                for (const El of Els) {
                    const Card = El.closest('.bili-video-card, .feed-card, .bili-feed-card, .video-item, .feed-item, .floor-single-card, .floor-card, [class*="video-card"], [class*="feed-card"], [class*="feed-item"], [class*="floor-card"]');
                    if (Card) {
                        const CardSel = (Card.tagName === El.tagName) ? Sel :
                            Array.from(Card.classList).map(C => '.' + C).join('');
                        if (!MatchedSelectors.includes(CardSel)) {
                            MatchedSelectors.push(CardSel);
                        }
                    }
                }
            }
        }

        for (const Sel of SpecificCandidates) {
            try {
                const Els = document.querySelectorAll(Sel);
                if (Els.length > 0) {
                    if (!MatchedSelectors.includes(Sel)) {
                        MatchedSelectors.push(Sel);
                    }
                }
            } catch (E) {}
        }

        if (MatchedSelectors.length > 0) {
            EffectiveSelector = MatchedSelectors.join(', ');
            Log(T('LogSelectorFound'), EffectiveSelector);
            return EffectiveSelector;
        }

        for (const Sel of BroadCandidates) {
            try {
                const Els = document.querySelectorAll(Sel);
                if (Els.length > 0) {
                    EffectiveSelector = Sel;
                    Log(T('LogSelectorFound'), EffectiveSelector);
                    return EffectiveSelector;
                }
            } catch (E) {}
        }

        const LinkSelectors = ['a[href*="/video/"]', 'a[href*="/bangumi/"]', 'a[href*="live.bilibili.com"]'];
        for (const LinkSel of LinkSelectors) {
            const Links = document.querySelectorAll(LinkSel);
            for (const Link of Links) {
                let Parent = Link.parentElement;
                let Depth = 0;
                while (Parent && Depth < 5) {
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

    function DetectContainer() {
        if (VideoListContainer) return VideoListContainer;
        const Containers = [
            '.bili-feed4', '.bili-feed', '.feed2', '.feed-list',
            '.video-list', '.bili-video-list', '.recommend-container',
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

    // ======================== 卡片显示/隐藏 ========================
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

    function HideCardTree(Card) {
        ApplyHideStyles(Card);
        let Ancestor = Card.parentElement;
        while (Ancestor && Ancestor !== document.body) {
            const Cls = (Ancestor.className || '').toLowerCase();
            let IsWrapper = false;
            for (let W = 0; W < WRAPPER_CLASSES.length; W++) {
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

    function ShowCardTree(Card) {
        ClearHideStyles(Card);
        let Ancestor = Card.parentElement;
        while (Ancestor && Ancestor !== document.body) {
            const Cls = (Ancestor.className || '').toLowerCase();
            let IsWrapper = false;
            for (let W = 0; W < WRAPPER_CLASSES.length; W++) {
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

            let Cards = document.querySelectorAll(Selector);
            if (Cards.length === 0) {
                const LinkSelectors = ['a[href*="/video/"]', 'a[href*="/bangumi/"]', 'a[href*="live.bilibili.com"]'];
                const ParentCards = new Set();
                for (const LinkSel of LinkSelectors) {
                    const Links = document.querySelectorAll(LinkSel);
                    for (const Link of Links) {
                        let Parent = Link.parentElement;
                        let Depth = 0;
                        while (Parent && Depth < 5) {
                            if (Parent.className && (Parent.className.includes('card') || Parent.className.includes('item') || Parent.className.includes('feed') || Parent.className.includes('floor'))) {
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

            const NestedRemoval = new Set();
            for (let I = 0; I < VideoCards.length; I++) {
                for (let J = 0; J < VideoCards.length; J++) {
                    if (I !== J && VideoCards[I].contains(VideoCards[J])) {
                        NestedRemoval.add(I);
                        break;
                    }
                }
            }
            if (NestedRemoval.size > 0) {
                VideoCards = VideoCards.filter((_, Idx) => !NestedRemoval.has(Idx));
            }

            function CardLinksTo(Card, Pattern) {
                const Links = Card.querySelectorAll('a[href]');
                for (const Link of Links) {
                    if (Link.href.indexOf(Pattern) !== -1) return true;
                }
                return false;
            }

            const ExcludedCards = [];
            VideoCards = VideoCards.filter(Card => {
                const Text = (Card.textContent || '').toLowerCase();
                const Cls = (Card.className || '').toLowerCase();
                const FloorTitle = Card.querySelector('.floor-title');
                const FloorTitleText = FloorTitle ? (FloorTitle.textContent || '').toLowerCase() : '';

                let ShouldExclude = false;

                if (Config.ExcludeLive && (
                    Cls.includes('live') ||
                    Text.includes('直播') || Text.includes('正在直播') || Text.includes('直播中') ||
                    FloorTitleText.includes('直播') || FloorTitleText.includes('赛事') ||
                    CardLinksTo(Card, 'live.bilibili.com')
                )) {
                    ShouldExclude = true;
                }
                if (!ShouldExclude && Config.ExcludeAd && (Cls.includes('ad') || Cls.includes('advert') || Text.includes('广告') || Text.includes('sponsor'))) {
                    ShouldExclude = true;
                }
                if (!ShouldExclude && Config.ExcludeBangumi && (
                    Cls.includes('bangumi') ||
                    Text.includes('番剧') || Text.includes('追番') || Text.includes('国创') ||
                    FloorTitleText.includes('番剧') || FloorTitleText.includes('国创') ||
                    CardLinksTo(Card, '/bangumi/')
                )) {
                    ShouldExclude = true;
                }
                if (!ShouldExclude && Config.ExcludePaid && (Text.includes('付费') || Text.includes('课程') || Text.includes('￥') || Text.includes('¥'))) {
                    ShouldExclude = true;
                }

                if (ShouldExclude) {
                    ExcludedCards.push(Card);
                    return false;
                }
                return true;
            });

            if (Config.KeepSpecialUPIDs && Config.KeepSpecialUPIDs.length > 0) {
                const KeepSet = new Set(Config.KeepSpecialUPIDs.map(Id => String(Id)));
                const Kept = [];
                const Rest = [];
                for (const Card of VideoCards) {
                    const UpLink = Card.querySelector('a[href*="/space/"]');
                    let Upid = null;
                    if (UpLink) {
                        const Match = UpLink.href.match(/\/space\/(\d+)/);
                        if (Match) Upid = Match[1];
                    }
                    if (Upid && KeepSet.has(Upid)) {
                        Kept.push(Card);
                    } else {
                        Rest.push(Card);
                    }
                }
                VideoCards = Kept.concat(Rest);
            }

            let PromotedCards = [];
            if (Config.KeepPromoted) {
                PromotedCards = VideoCards.filter(Card => {
                    const Text = (Card.textContent || '').toLowerCase();
                    return Text.includes('推广') || Text.includes('广告') || Text.includes('sponsor');
                });
                VideoCards = VideoCards.filter(Card => !PromotedCards.includes(Card));
            }

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

            const Max = Math.max(1, Number(Config.MaxVideos) || 10);
            const ToShow = VideoCards.slice(0, Max);
            const ToHide = VideoCards.slice(Max);

            ToShow.forEach(Card => { ShowCardTree(Card); });

            const AllToHide = ToHide.concat(ExcludedCards);
            AllToHide.forEach(Card => { HideCardTree(Card); });

            [...PromotedCards, ...TopCards].forEach(Card => { ShowCardTree(Card); });

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

    // ======================== CSS ========================
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

    // ======================== 配置面板 ========================
    function InjectPanelStyles() {
        if (document.getElementById('BiliCompactPanelStyles')) return;
        const StyleEl = document.createElement('style');
        StyleEl.id = 'BiliCompactPanelStyles';
        StyleEl.textContent = `
            .BiliCompactOverlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.4); z-index: 2147483646;
                display: flex; align-items: center; justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 14px;
            }
            .BiliCompactPanel {
                background: #1e1e1e; color: #eee; padding: 24px 30px; border-radius: 16px;
                box-shadow: 0 8px 40px rgba(0,0,0,0.6); min-width: 340px; max-width: 420px;
                border: 1px solid #333; backdrop-filter: blur(8px);
                display: flex; flex-direction: column; gap: 12px; position: relative;
                max-height: 85vh; overflow-y: auto;
            }
            .BiliCompactPanel h3 { margin: 0 0 4px 0; font-weight: 500; color: #fff; font-size: 16px; }
            .BiliCompactPanel label { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #ccc; gap: 8px; }
            .BiliCompactPanel input[type="number"],
            .BiliCompactPanel input[type="text"] { background: #2a2a2a; border: 1px solid #444; color: #fff; padding: 4px 10px; border-radius: 6px; width: 80px; font-size: 14px; font-family: inherit; }
            .BiliCompactPanel input[type="text"] { width: 140px; }
            .BiliCompactPanel select { background: #2a2a2a; border: 1px solid #444; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 14px; font-family: inherit; cursor: pointer; }
            .BiliCompactPanel input[type="checkbox"] { accent-color: #fb7299; width: 18px; height: 18px; cursor: pointer; }
            .BiliCompactPanel .BtnRow { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; flex-wrap: wrap; }
            .BiliCompactPanel button { background: #fb7299; border: none; color: #fff; padding: 6px 18px; border-radius: 20px; cursor: pointer; font-size: 14px; font-family: inherit; transition: background 0.2s; }
            .BiliCompactPanel button.Secondary { background: #444; }
            .BiliCompactPanel button:hover { background: #ff85a8; }
            .BiliCompactPanel button.Secondary:hover { background: #555; }
            .BiliCompactPanel .Hint { font-size: 12px; color: #888; margin-top: -4px; line-height: 1.4; }
            .BiliCompactPanel .StatusRow { display: flex; align-items: center; justify-content: space-between; font-size: 14px; color: #ccc; }
            .BiliCompactPanel .StatusBadge { background: #fb7299; color: #fff; border-radius: 12px; padding: 2px 12px; font-size: 12px; font-weight: bold; }
            .BiliCompactPanel .StatusBadge.Off { background: #666; }
        `;
        document.head.appendChild(StyleEl);
    }

    let PanelDestroyFn = null;

    function OpenConfigPanel() {
        if (PanelDestroyFn) { PanelDestroyFn(); PanelDestroyFn = null; }

        InjectPanelStyles();

        const Overlay = document.createElement('div');
        Overlay.className = 'BiliCompactOverlay';

        const Panel = document.createElement('div');
        Panel.className = 'BiliCompactPanel';

        const LangOptions = [
            { Value: 'auto',  Label: T('PanelLanguageAuto') },
            { Value: 'zh_CN', Label: '简体中文' },
            { Value: 'zh_TW', Label: '繁體中文' },
            { Value: 'en_US', Label: 'English' },
        ];
        const LangSelectHTML = LangOptions.map(Opt =>
            `<option value="${Opt.Value}" ${Config.Language === Opt.Value ? 'selected' : ''}>${Opt.Label}</option>`
        ).join('');

        Panel.innerHTML = `
            <h3>${T('PanelTitle')}</h3>
            <div class="StatusRow">
                <span>${T('PanelStatusLabel')}</span>
                <span class="StatusBadge ${IsActive ? '' : 'Off'}" id="CfgStatusBadge">${IsActive ? T('PanelStatusActive') : T('PanelStatusPaused')}</span>
            </div>
            <label>${T('PanelMaxVideos')} <input type="number" id="CfgMax" value="${Config.MaxVideos}" min="1" max="100"></label>
            <label>${T('PanelExcludeLive')} <input type="checkbox" id="CfgExcludeLive" ${Config.ExcludeLive ? 'checked' : ''}></label>
            <label>${T('PanelExcludeAd')} <input type="checkbox" id="CfgExcludeAd" ${Config.ExcludeAd ? 'checked' : ''}></label>
            <label>${T('PanelExcludeBangumi')} <input type="checkbox" id="CfgExcludeBangumi" ${Config.ExcludeBangumi ? 'checked' : ''}></label>
            <label>${T('PanelExcludePaid')} <input type="checkbox" id="CfgExcludePaid" ${Config.ExcludePaid ? 'checked' : ''}></label>
            <label>${T('PanelKeepPromoted')} <input type="checkbox" id="CfgKeepPromoted" ${Config.KeepPromoted ? 'checked' : ''}></label>
            <label>${T('PanelDebug')} <input type="checkbox" id="CfgDebug" ${Config.Debug ? 'checked' : ''}></label>
            <label>${T('PanelEnableCommentPurifier')} <input type="checkbox" id="CfgEnablePurifier" ${Config.EnableCommentPurifier ? 'checked' : ''}></label>
            <label>${T('PanelLanguage')} <select id="CfgLanguage">${LangSelectHTML}</select></label>
            <label>${T('PanelKeepUpids')} <input type="text" id="CfgKeepUids" value="${(Config.KeepSpecialUPIDs || []).join(',')}"></label>
            <hr style="margin:8px 0;border:none;border-top:1px solid #333">
            <h4 style="margin:4px 0 8px;font-size:13px;color:#fb7299">去除元素</h4>
            ${ELEMENT_REMOVAL_PRESETS.map(function(P) {
                return '<label><span style="flex:1">' + P.name + '</span> <input type="checkbox" id="CfgRm_' + P.id + '" ' + ((Config.RemovedElements || {})[P.id] ? 'checked' : '') + '></label>';
            }).join('')}
            <div class="BtnRow">
                <button class="Secondary" id="CfgToggle">${IsActive ? T('PanelBtnPause') : T('PanelBtnResume')}</button>
                <button class="Secondary" id="CfgReset">${T('PanelBtnReset')}</button>
                <button id="CfgSave">${T('PanelBtnSave')}</button>
            </div>
        `;

        Overlay.appendChild(Panel);
        document.body.appendChild(Overlay);

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
                KeepSpecialUPIDs: document.getElementById('CfgKeepUids').value.split(',').map(S => S.trim()).filter(Boolean).map(Number),
                Debug: document.getElementById('CfgDebug').checked,
                EnableCommentPurifier: document.getElementById('CfgEnablePurifier').checked,
                RemovedElements: (function() {
                    var obj = {};
                    for (var I = 0; I < ELEMENT_REMOVAL_PRESETS.length; I++) {
                        var cb = document.getElementById('CfgRm_' + ELEMENT_REMOVAL_PRESETS[I].id);
                        if (cb) obj[ELEMENT_REMOVAL_PRESETS[I].id] = cb.checked;
                    }
                    return obj;
                })()
            };
            Object.assign(Config, NewConfig);
            SaveConfig(Config);

            if (LangChanged) { CurrentLang = ResolveLanguage(); }

            DestroyPanel();
            LimitVideos();
            applyElementRemoval();

            if (NewConfig.EnableCommentPurifier) { startCommentPurifier(); }
            else { stopCommentPurifier(); }

            if (LangChanged) { setTimeout(() => OpenConfigPanel(), 100); }
        });

        document.getElementById('CfgReset').addEventListener('click', function() {
            Object.assign(Config, DEFAULTS);
            SaveConfig(Config);
            CurrentLang = ResolveLanguage();
            document.getElementById('CfgMax').value = Config.MaxVideos;
            document.getElementById('CfgExcludeLive').checked = Config.ExcludeLive;
            document.getElementById('CfgExcludeAd').checked = Config.ExcludeAd;
            document.getElementById('CfgExcludeBangumi').checked = Config.ExcludeBangumi;
            document.getElementById('CfgExcludePaid').checked = Config.ExcludePaid;
            document.getElementById('CfgKeepPromoted').checked = Config.KeepPromoted;
            document.getElementById('CfgDebug').checked = Config.Debug;
            document.getElementById("CfgEnablePurifier").checked = false;
            document.getElementById('CfgKeepUids').value = '';
            for (var I = 0; I < ELEMENT_REMOVAL_PRESETS.length; I++) {
                var cb = document.getElementById('CfgRm_' + ELEMENT_REMOVAL_PRESETS[I].id);
                if (cb) cb.checked = false;
            }
            stopCommentPurifier();
            LimitVideos();
            applyElementRemoval();
        });

        document.getElementById('CfgToggle').addEventListener('click', function() {
            IsActive = !IsActive;
            if (IsActive) { LimitVideos(); }
            else { RestoreAllVideos(); }
            const Badge = document.getElementById('CfgStatusBadge');
            if (Badge) {
                Badge.textContent = IsActive ? T('PanelStatusActive') : T('PanelStatusPaused');
                Badge.className = 'StatusBadge' + (IsActive ? '' : ' Off');
            }
            this.textContent = IsActive ? T('PanelBtnPause') : T('PanelBtnResume');
        });

        Overlay.addEventListener('click', function(E) {
            if (E.target === Overlay) { DestroyPanel(); }
        });

        function OnKeyDown(E) { if (E.key === 'Escape') { DestroyPanel(); } }
        document.addEventListener('keydown', OnKeyDown);

        function DestroyPanel() {
            document.removeEventListener('keydown', OnKeyDown);
            if (Overlay.parentNode) { Overlay.parentNode.removeChild(Overlay); }
            PanelDestroyFn = null;
        }
        PanelDestroyFn = DestroyPanel;
    }

    // ======================== MutationObserver ========================
    function InitObserver() {
        if (Observer) { Observer.disconnect(); Observer = null; }

        const Container = DetectContainer();
        if (!Container) return;

        Observer = new MutationObserver(function(Mutations) {
            let ShouldProcess = false;
            for (const Mutation of Mutations) {
                if (Mutation.type === 'childList' && (Mutation.addedNodes.length > 0 || Mutation.removedNodes.length > 0)) {
                    for (const Node of Mutation.addedNodes) {
                        if (Node.nodeType === 1) {
                            const Sel = DetectSelector();
                            if (Sel && (Node.matches(Sel) || Node.querySelector(Sel))) {
                                ShouldProcess = true;
                                break;
                            }
                        }
                    }
                    if (!ShouldProcess) {
                        for (const Node of Mutation.removedNodes) {
                            if (Node.nodeType === 1) {
                                const Sel = DetectSelector();
                                if (Sel && (Node.matches(Sel) || Node.querySelector(Sel))) {
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
                if (Now - LastRun < THROTTLE_INTERVAL) {
                    clearTimeout(DebounceTimer);
                    DebounceTimer = setTimeout(() => { LastRun = Date.now(); LimitVideos(); }, 300);
                } else {
                    LastRun = Now;
                    LimitVideos();
                }
            }
        });

        Observer.observe(Container, { childList: true, subtree: true, attributes: false });
        Log(T('LogObserverStarted'), Container);
    }

    // ======================== 路由变化监听 ========================
    function WatchUrlChange() {
        let LastUrl = location.href;
        setInterval(() => {
            if (location.href !== LastUrl) {
                LastUrl = location.href;
                Log(T('LogUrlChanged'), LastUrl);
                EffectiveSelector = null;
                VideoListContainer = null;
                setTimeout(() => {
                    DetectSelector();
                    DetectContainer();
                    LimitVideos();
                    applyElementRemoval();
                }, 500);
            }
        }, 1000);
    }

    // ======================== 菜单命令 ========================
    function RegisterMenu() {
        GM_registerMenuCommand(T('MenuSettings'), function() { OpenConfigPanel(); });
        GM_registerMenuCommand(T('MenuRefresh'), function() {
            EffectiveSelector = null;
            VideoListContainer = null;
            LimitVideos();
        });
        GM_registerMenuCommand(T('MenuToggle'), function() {
            IsActive = !IsActive;
            if (IsActive) { LimitVideos(); }
            else { RestoreAllVideos(); }
            Log(T('LogStatus'), IsActive ? T('LogStatusOn') : T('LogStatusOff'));
        });
        GM_registerMenuCommand(T('MenuCommentPurifier'), function() { toggleCommentPurifier(); });
        GM_registerMenuCommand(T('MenuQuickSet'), function() {
            const Num = prompt(T('PromptQuickSet'), Config.MaxVideos);
            if (Num !== null) {
                const N = parseInt(Num);
                if (N >= 1 && N <= 100) {
                    Config.MaxVideos = N;
                    SaveConfig({ MaxVideos: N });
                    if (!IsActive) { IsActive = true; }
                    LimitVideos();
                    Log(T('LogQuickSet'), N);
                }
            }
        });
    }

    // ======================== 初始化 ========================
    function Init() {
        try {
            Config = GetConfig();
            CurrentLang = ResolveLanguage();
            Log(T('LogConfigLoaded'), Config);
            InjectStyles();
            RegisterMenu();
            startCommentPurifier();
            InitObserver();
            WatchUrlChange();
            setTimeout(() => {
                DetectSelector();
                DetectContainer();
                LimitVideos();
                applyElementRemoval();
            }, 500);

            setInterval(() => {
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
                        if (VisibleCount > Config.MaxVideos) {
                            Log(T('LogTimerRetry'));
                            LimitVideos();
                        }
                    }
                }
                applyElementRemoval();
            }, 5000);

            Log(T('LogInitDone'), Config);
        } catch (E) {
            ErrorLog(T('LogInitError'), E);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Init);
    } else {
        Init();
    }

})();
```
