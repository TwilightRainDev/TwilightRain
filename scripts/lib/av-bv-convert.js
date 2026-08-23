'use strict';

/**
 * B 站 av 号 ↔ BV 号互转（算法自 A:\work_zone\Resources\AvBvConvert.js，博客侧 canonical 副本）。
 * 仅导出纯函数，加载时无副作用。
 */

var XOR_CODE = 23442827791579n;
var MAX_AID = 1n << 51n;
var MASK_CODE = MAX_AID - 1n;
var ALPHABET = 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf';
var BASE = BigInt(ALPHABET.length);
var PREFIX = 'BV1';
var BV_LENGTH = 12;

var CHAR_TO_VALUE = new Map(
  [...ALPHABET].map(function (char, value) {
    return [char, BigInt(value)];
  })
);

function normalizeAid(value) {
  var aid = value;

  if (typeof aid === 'string') {
    if (!/^\d+$/.test(aid)) {
      throw new TypeError('aid 字符串必须是十进制数字');
    }
    aid = BigInt(aid);
  }

  if (typeof aid === 'number') {
    if (!Number.isSafeInteger(aid)) {
      throw new TypeError('Number 类型的 aid 必须是安全整数');
    }
    aid = BigInt(aid);
  }

  if (typeof aid !== 'bigint') {
    throw new TypeError('aid 必须是 Number 或 BigInt 整数');
  }
  if (aid <= 0n || aid >= MAX_AID) {
    throw new RangeError('aid 必须满足 0 < aid < ' + MAX_AID);
  }

  return aid;
}

function avToBv(value) {
  var aid = normalizeAid(value);
  var tmp = (aid | MAX_AID) ^ XOR_CODE;
  var chars = [...(PREFIX + '0'.repeat(9))];

  for (var index = BV_LENGTH - 1; index >= PREFIX.length; index -= 1) {
    var digit = tmp % BASE;
    tmp /= BASE;
    chars[index] = ALPHABET[Number(digit)];
  }

  if (tmp !== 0n) {
    throw new RangeError('aid 超出 9 位 BV 载荷可表示的范围');
  }

  var swap = chars[3];
  chars[3] = chars[9];
  chars[9] = swap;
  swap = chars[4];
  chars[4] = chars[7];
  chars[7] = swap;
  return chars.join('');
}

function bvToAv(bvid) {
  if (typeof bvid !== 'string') {
    throw new TypeError('bvid 必须是字符串');
  }
  if (bvid.length !== BV_LENGTH || !bvid.startsWith(PREFIX)) {
    throw new TypeError('bvid 必须是以 BV1 开头的 12 位字符串');
  }
  if ([...bvid.slice(3)].some(function (char) { return !CHAR_TO_VALUE.has(char); })) {
    throw new TypeError('bvid 含有不在自定义 Base58 字母表中的字符');
  }

  var chars = [...bvid];
  var swap = chars[3];
  chars[3] = chars[9];
  chars[9] = swap;
  swap = chars[4];
  chars[4] = chars[7];
  chars[7] = swap;

  var tmp = 0n;
  for (var i = 0; i < chars.slice(3).length; i += 1) {
    tmp = tmp * BASE + CHAR_TO_VALUE.get(chars[3 + i]);
  }

  var aid = (tmp & MASK_CODE) ^ XOR_CODE;
  if (aid <= 0n || aid >= MAX_AID || avToBv(aid) !== bvid) {
    throw new TypeError('这不是规范的 BV 编码');
  }

  return aid;
}

module.exports = {
  avToBv: avToBv,
  bvToAv: bvToAv,
  normalizeAid: normalizeAid
};
