import { describe, expect, it } from 'vitest';
import {
  addVec,
  clamp,
  distance,
  hashString,
  lengthVec,
  lerp,
  mean,
  median,
  normalizeVec,
  round,
  scaleVec,
  seededRandom,
  subVec,
  vec,
} from '@/lib/utils/math';

describe('scalar helpers', () => {
  it('clamps values to inclusive bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('interpolates and rounds deterministically', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5);
    expect(lerp(4, 4, 0.7)).toBe(4);
    expect(round(3.14159, 3)).toBe(3.142);
    expect(round(2.6)).toBe(2.6);
  });

  it('computes median and mean with empty input guards', () => {
    expect(median([])).toBe(0);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(mean([])).toBe(0);
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('vector helpers', () => {
  it('creates and combines vectors without mutating inputs', () => {
    const a = vec(1, 2, 3);
    const b = vec(4, -5, 6);

    expect(vec()).toEqual({ x: 0, y: 0, z: 0 });
    expect(addVec(a, b)).toEqual({ x: 5, y: -3, z: 9 });
    expect(subVec(a, b)).toEqual({ x: -3, y: 7, z: -3 });
    expect(scaleVec(a, 2)).toEqual({ x: 2, y: 4, z: 6 });
    expect(a).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('computes lengths, distances and normalized directions', () => {
    expect(lengthVec(vec(3, 4, 0))).toBe(5);
    expect(distance(vec(0, 0, 0), vec(0, 0, 9))).toBe(9);
    expect(normalizeVec(vec(0, 0, 0))).toEqual({ x: 0, y: 0, z: 0 });
    expect(normalizeVec(vec(0, 5, 0))).toEqual({ x: 0, y: 1, z: 0 });
    expect(lengthVec(normalizeVec(vec(1, 2, 3)))).toBeCloseTo(1, 10);
  });
});

describe('seededRandom / hashString', () => {
  it('reproduces a sequence for the same seed', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const first = Array.from({ length: 5 }, () => a());
    const second = Array.from({ length: 5 }, () => b());

    expect(first).toEqual(second);
    expect(first.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });

  it('hashes strings deterministically into unsigned integers', () => {
    expect(hashString('alpha')).toBe(hashString('alpha'));
    expect(hashString('alpha')).not.toBe(hashString('beta'));
    expect(Number.isInteger(hashString('echo'))).toBe(true);
    expect(hashString('echo')).toBeGreaterThanOrEqual(0);
    expect(hashString('echo')).toBeLessThanOrEqual(0xffffffff);
  });
});
