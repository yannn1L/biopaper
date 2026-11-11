/**
 * @file MathLUT.js
 * Section 7.1A: Pre-computed Math Lookup Tables (sinLUT & cosLUT) and Bezier helpers.
 */

const LUT_SIZE = 4096;
const LUT_MASK = LUT_SIZE - 1;
const TWO_PI = Math.PI * 2;
const RAD_TO_INDEX = LUT_SIZE / TWO_PI;

export const sinLUT = new Float32Array(LUT_SIZE);
export const cosLUT = new Float32Array(LUT_SIZE);

let isInitialized = false;

export function initMathLUT() {
  if (isInitialized) return;
  for (let i = 0; i < LUT_SIZE; i++) {
    const angle = (i / LUT_SIZE) * TWO_PI;
    sinLUT[i] = Math.sin(angle);
    cosLUT[i] = Math.cos(angle);
  }
  isInitialized = true;
}

export function fastSin(rad) {
  const idx = ((rad * RAD_TO_INDEX) | 0) & LUT_MASK;
  return sinLUT[idx];
}

export function fastCos(rad) {
  const idx = ((rad * RAD_TO_INDEX) | 0) & LUT_MASK;
  return cosLUT[idx];
}

export function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= TWO_PI;
  while (angle < -Math.PI) angle += TWO_PI;
  return angle;
}

export function lerpAngle(from, to, t) {
  const diff = normalizeAngle(to - from);
  return from + diff * t;
}

/**
 * Quadratic Bezier point evaluation for Gene Stealing & Bombardier trajectories.
 */
export function evalQuadraticBezier(p0x, p0y, p1x, p1y, p2x, p2y, t, out) {
  const invT = 1 - t;
  const a = invT * invT;
  const b = 2 * invT * t;
  const c = t * t;
  out.x = a * p0x + b * p1x + c * p2x;
  out.y = a * p0y + b * p1y + c * p2y;
  return out;
}
