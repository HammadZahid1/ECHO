import { describe, expect, it } from 'vitest';
import {
  ECHO_PALETTE,
  colorForString,
  contrastRatio,
  hexToRgb,
  isValidHex,
  mixColors,
  readableTextColor,
  relativeLuminance,
  rgbToHex,
  withAlpha,
} from '@/lib/utils/color';

describe('hexToRgb / rgbToHex', () => {
  it('parses long, short and unprefixed hex values', () => {
    expect(hexToRgb('#4fd8e8')).toEqual({ r: 79, g: 216, b: 232 });
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
    expect(hexToRgb('f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('falls back to white for unparseable input', () => {
    expect(hexToRgb('#zzz')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('nonsense')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('formats and clamps rgb values to two-digit hex', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 128 })).toBe('#ff0080');
    expect(rgbToHex({ r: 300, g: -5, b: 128.6 })).toBe('#ff0081');
    expect(rgbToHex(hexToRgb('#4fd8e8'))).toBe('#4fd8e8');
  });
});

describe('luminance and contrast', () => {
  it('gives black and white their expected luminance', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 6);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 6);
    expect(relativeLuminance('#4fd8e8')).toBeGreaterThan(0);
    expect(relativeLuminance('#4fd8e8')).toBeLessThan(1);
  });

  it('computes symmetric contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 6);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 6);
  });

  it('selects readable text colours from a fixed luminance threshold', () => {
    expect(readableTextColor('#000000')).toBe('#f2f4f7');
    expect(readableTextColor('#ffffff')).toBe('#08090b');
    expect(readableTextColor('#4fd8e8')).toBe('#08090b');
  });
});

describe('palette helpers', () => {
  it('maps a string deterministically into the palette', () => {
    expect(colorForString('alpha')).toBe(colorForString('alpha'));
    expect(ECHO_PALETTE).toContain(colorForString('alpha'));
    expect(ECHO_PALETTE).toContain(colorForString('beta'));
    expect(new Set(['alpha', 'beta', 'gamma', 'delta', 'epsilon'].map(colorForString)).size).toBeGreaterThan(1);
  });

  it('builds rgba and interpolated hex strings with stable formatting', () => {
    expect(withAlpha('#4fd8e8', 0.5)).toBe('rgba(79, 216, 232, 0.5)');
    expect(mixColors('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColors('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  it('validates only three- or six-digit hex strings', () => {
    expect(isValidHex('#abc')).toBe(true);
    expect(isValidHex('#ABCDEF')).toBe(true);
    expect(isValidHex('abcdef')).toBe(false);
    expect(isValidHex('#abcd')).toBe(false);
    expect(isValidHex('#gggggg')).toBe(false);
    expect(isValidHex(123)).toBe(false);
  });
});
