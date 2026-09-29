'use strict';

/**
 * 主题客户端脚本的装载冒烟。
 *
 * 做法：读 js/ink.js 入口，按它声明的顺序，在同一个最小 DOM 桩上、
 * 以严格模式执行每个模块的顶层代码。模块在浏览器里是 type="module"
 * 加载的，模块代码恒为严格模式——用桩跑一遍是唯一能在本机拿到的
 * 运行时证据（本机无浏览器）。
 *
 * 覆盖：
 *   - 每个模块可解析、顶层代码不抛（含严格模式下的未声明赋值）
 *   - 入口 import 与 js/ink/ 下的文件一一对应（无悬空 import、无孤儿模块）
 *   - 顶层确实执行到了建 DOM 的那几行（防桩过松导致空跑通过）
 *
 * 不覆盖：
 *   - DOMContentLoaded 之后的交互逻辑——桩不发事件，也没有真实 DOM
 *   - 选择器匹配、样式、键盘/触摸等浏览器行为
 * 所以本测试通过不等于页面交互正常，它挡的是「装载期就炸」这一类。
 */

var assert = require('node:assert/strict');
var test = require('node:test');
var fs = require('node:fs');
var path = require('node:path');
var vm = require('node:vm');

var root = path.join(__dirname, '..', '..');
var JSDIR = path.join(root, 'themes', 'ink', 'source', 'js');
var MODDIR = path.join(JSDIR, 'ink');

function moduleNames() {
  var entry = fs.readFileSync(path.join(JSDIR, 'ink.js'), 'utf8');
  return Array.from(entry.matchAll(/^import '\.\/ink\/([^']+)';$/gm), function (m) { return m[1]; });
}

function makeNode(tagName) {
  return {
    tagName: String(tagName || '').toUpperCase(),
    style: { setProperty: function () {}, removeProperty: function () {} },
    dataset: {},
    attributes: {},
    childNodes: [],
    textContent: '',
    hidden: false,
    open: false,
    classList: {
      add: function () {},
      remove: function () {},
      toggle: function () { return false; },
      contains: function () { return false; }
    },
    appendChild: function (c) { this.childNodes.push(c); return c; },
    insertBefore: function (c) { this.childNodes.push(c); return c; },
    removeChild: function () {},
    remove: function () {},
    replaceWith: function () {},
    setAttribute: function (k, v) { this.attributes[k] = String(v); },
    getAttribute: function (k) { return k in this.attributes ? this.attributes[k] : null; },
    removeAttribute: function (k) { delete this.attributes[k]; },
    hasAttribute: function (k) { return k in this.attributes; },
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () { return true; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    closest: function () { return null; },
    contains: function () { return false; },
    focus: function () {},
    cloneNode: function () { return makeNode(tagName); },
    getBoundingClientRect: function () {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
  };
}

function makeContext() {
  var body = makeNode('body');
  var storage = {};
  var ctx = {
    document: {
      documentElement: makeNode('html'),
      body: body,
      head: makeNode('head'),
      readyState: 'complete',
      createElement: makeNode,
      createTextNode: function (t) { return { nodeType: 3, textContent: String(t) }; },
      getElementById: function () { return null; },
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; },
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () { return true; }
    },
    console: console,
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
      setItem: function (k, v) { storage[k] = String(v); },
      removeItem: function (k) { delete storage[k]; }
    },
    // 计时器不真跑：桩不发事件，真跑只会让进程挂住
    setTimeout: function () { return 0; },
    clearTimeout: function () {},
    setInterval: function () { return 0; },
    clearInterval: function () {},
    CustomEvent: function (type, init) { this.type = type; this.detail = init && init.detail; },
    IntersectionObserver: function () { this.observe = function () {}; this.unobserve = function () {}; },
    ResizeObserver: function () { this.observe = function () {}; },
    Image: function () {},
    fetch: function () { return Promise.resolve(); },
    navigator: { clipboard: null },
    history: { state: null, pushState: function () {}, back: function () {} }
  };
  ctx.window = ctx;
  ctx.matchMedia = function () { return { matches: false }; };
  ctx.addEventListener = function () {};
  ctx.removeEventListener = function () {};
  ctx.scrollTo = function () {};
  ctx.scrollY = 0;
  ctx.innerWidth = 1024;
  ctx.innerHeight = 768;
  return { context: vm.createContext(ctx), body: body };
}

test('入口 import 与 js/ink/ 下的模块一一对应', function () {
  var declared = moduleNames();
  assert.ok(declared.length > 0, '入口没有任何 import');
  var onDisk = fs.readdirSync(MODDIR).filter(function (f) { return f.endsWith('.js'); }).sort();
  assert.deepStrictEqual(declared.slice().sort(), onDisk,
    '入口 import 与 js/ink/ 下的文件不一致（悬空 import 或孤儿模块）');
});

test('各模块在严格模式下顶层执行不抛，且确实建出了 DOM', function () {
  var names = moduleNames();
  var made = makeContext();

  for (var i = 0; i < names.length; i++) {
    var file = path.join(MODDIR, names[i]);
    var code = fs.readFileSync(file, 'utf8');
    // 模块恒为严格模式；未声明就赋值的写法在这里会抛 ReferenceError
    assert.doesNotThrow(function () {
      vm.runInContext("'use strict';\n" + code, made.context, { filename: file });
    }, names[i] + ' 顶层执行抛出');
  }

  // 空跑防线：桩若过松（例如每个块都在首个选择器处提前 return），
  // 上面那句照样通过。返回顶部与阅读进度条是无条件建节点的两块，
  // 它们出现即证明顶层代码真的跑到了操作 DOM 的位置。
  var ids = made.body.childNodes.map(function (n) { return n.id; });
  assert.ok(ids.indexOf('back-to-top') !== -1,
    '未观察到返回顶部按钮，模块可能整体空跑；已建节点：' + JSON.stringify(ids));
});
