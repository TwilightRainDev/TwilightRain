'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var externalLinks = require('../../scripts/lib/external-links');

test('外链 rel 升级为 noopener noreferrer', function () {
  var html = '<a href="https://example.com" target="_blank" rel="noopener">链</a>';
  var out = externalLinks.processExternalLinks(html);
  assert.match(out, /rel="noopener noreferrer"/);
});

test('已有 noreferrer 不重复追加', function () {
  var html = '<a href="https://example.com" rel="noopener noreferrer">链</a>';
  var out = externalLinks.processExternalLinks(html);
  assert.equal((out.match(/noreferrer/g) || []).length, 1);
});

test('站内链接不改动', function () {
  var html = '<a href="/about/">关于</a>';
  assert.equal(externalLinks.processExternalLinks(html), html);
});

test('mailto 实体编码', function () {
  var html = '<a href="mailto:hello@example.com">hello@example.com</a>';
  var out = externalLinks.processExternalLinks(html);
  assert.match(out, /href="mailto:hello&#64;example&#46;com"/);
  assert.match(out, /hello&#64;example&#46;com<\/a>/);
});
