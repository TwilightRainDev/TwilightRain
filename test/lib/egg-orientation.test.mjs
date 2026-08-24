import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PITCH_LIMIT,
  EULER_ORDER,
  shortestAngleDiff,
  wrapAngle,
  clampPitchFromDeltaY,
  nextOrcaFacing
} from '../../source/egg/orientation.mjs';

test('shortestAngleDiff 走劣弧而非绕过 0', function () {
  var d = shortestAngleDiff(3.0, -3.0);
  assert.ok(Math.abs(d) < 1, '3.0 到 -3.0 的劣弧应小于 1 rad，实际 ' + d);
  assert.ok(d > 0, '应从 3.0 向 +PI 再绕到 -3.0，差分为正');
});

test('wrapAngle 把累计 yaw 收进 (-PI, PI]', function () {
  assert.ok(Math.abs(wrapAngle(Math.PI * 3) - Math.PI) < 1e-10);
  assert.ok(Math.abs(wrapAngle(-Math.PI * 3) + Math.PI) < 1e-10);
});

test('clampPitchFromDeltaY 不超过 PITCH_LIMIT', function () {
  assert.equal(clampPitchFromDeltaY(10, 0.35), PITCH_LIMIT);
  assert.equal(clampPitchFromDeltaY(-10, 0.35), -PITCH_LIMIT);
  assert.equal(clampPitchFromDeltaY(0.1, 0.35), 0.1 * 0.35);
});

test('nextOrcaFacing 使用 YXZ 且跨 ±PI 不跳变', function () {
  var next = nextOrcaFacing(
    { yaw: 3.0, pitch: 0, roll: 0 },
    { targetYaw: -3.0, pitchTarget: 0.5, rollTarget: 0 },
    { yawLerp: 1, pitchLerp: 1, rollLerp: 1 }
  );
  assert.equal(next.order, 'YXZ');
  assert.equal(EULER_ORDER, 'YXZ');
  assert.ok(Math.abs(next.yaw - wrapAngle(-3.0)) < 1e-10);
  assert.equal(next.pitch, PITCH_LIMIT);
});
