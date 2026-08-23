'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var conv = require('../../scripts/lib/av-bv-convert');

var MAX_AID = 1n << 51n;

test('已知 av/BV 对往返', function () {
  var pairs = [
    [170001n, 'BV17x411w7KC'],
    [455017605n, 'BV1Q541167Qg'],
    [305988942n, 'BV1aP411K7it'],
    [643755790n, 'BV1bY4y1j7RA'],
    [1054803170n, 'BV1mH4y1u7UA'],
    [111298867365120n, 'BV1L9Uoa9EUx']
  ];
  pairs.forEach(function (pair) {
    assert.equal(conv.avToBv(pair[0]), pair[1]);
    assert.equal(conv.bvToAv(pair[1]), pair[0]);
  });
});

test('边界 aid 往返', function () {
  [1n, 2n, 170001n, (1n << 31n) - 1n, MAX_AID - 1n].forEach(function (aid) {
    assert.equal(conv.bvToAv(conv.avToBv(aid)), aid);
  });
});

test('normalizeAid 接受数字字符串', function () {
  assert.equal(conv.avToBv('170001'), 'BV17x411w7KC');
});

test('非法输入抛错', function () {
  assert.throws(function () { conv.avToBv(0n); }, RangeError);
  assert.throws(function () { conv.avToBv(MAX_AID); }, RangeError);
  assert.throws(function () { conv.bvToAv('BV17x411w7K0'); }, TypeError);
  assert.throws(function () { conv.bvToAv('BV1FFFFFFFFF'); }, TypeError);
});
