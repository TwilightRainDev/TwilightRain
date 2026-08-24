'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var imageReferrer = require('../../scripts/lib/image-referrerpolicy');

test('外链 img 补 referrerpolicy', function () {
  var html = '<img src="https://example.com/a.png" alt="">';
  var out = imageReferrer.processExternalImages(html);
  assert.match(out, /referrerpolicy="no-referrer"/);
});

test('站内与相对路径不加', function () {
  var local = '<img src="/img/360px/a.jpg" alt="">';
  var rel = '<img src="images/a.jpg" alt="">';
  assert.equal(imageReferrer.processExternalImages(local), local);
  assert.equal(imageReferrer.processExternalImages(rel), rel);
});

test('已有 referrerpolicy 不覆盖', function () {
  var html = '<img src="https://example.com/a.png" referrerpolicy="origin">';
  assert.equal(imageReferrer.processExternalImages(html), html);
});
