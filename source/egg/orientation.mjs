/**
 * egg 页虎鲸朝向：YXZ 欧拉（先偏航再俯仰再滚转），避免默认 XYZ 把三轴当成独立插值。
 * 浏览器 main.js 与 Node 单测共用。
 */
export var POLAR_MIN = 0.12;
export var POLAR_MAX = Math.PI - 0.12;
export var PITCH_LIMIT = 0.22;
export var EULER_ORDER = 'YXZ';

export function shortestAngleDiff(from, to) {
  var d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function wrapAngle(a) {
  var x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

export function clampPitchFromDeltaY(deltaY, scale, limit) {
  var lim = limit == null ? PITCH_LIMIT : limit;
  var v = deltaY * scale;
  if (v > lim) return lim;
  if (v < -lim) return -lim;
  return v;
}

export function nextOrcaFacing(state, target, lerp) {
  var yaw = wrapAngle(
    state.yaw + shortestAngleDiff(state.yaw, target.targetYaw) * lerp.yawLerp
  );
  var pitchRaw = state.pitch + (target.pitchTarget - state.pitch) * lerp.pitchLerp;
  var pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitchRaw));
  var roll = state.roll + (target.rollTarget - state.roll) * lerp.rollLerp;
  return { yaw: yaw, pitch: pitch, roll: roll, order: EULER_ORDER };
}
