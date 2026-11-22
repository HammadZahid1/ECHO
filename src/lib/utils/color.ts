import { hashString } from './math';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const ECHO_PALETTE = [
  '#4fd8e8', '#9d7bf5', '#5b8def', '#58c9a0', '#e3b35c', '#e46d70',
  '#e88fb8', '#7fd4a6', '#8ca3f7', '#d1a3f5', '#6cc4d8', '#d9c47a',
] as const;

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '').trim();
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const parsed = Number.parseInt(value, 16);
  if (Number.isNaN(parsed)) return { r: 255, g: 255, b: 255 };
  return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (value: number): string => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number): number => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function readableTextColor(background: string): string {
  return relativeLuminance(background) > 0.4 ? '#08090b' : '#f2f4f7';
}

export function colorForString(value: string): string {
  return ECHO_PALETTE[hashString(value) % ECHO_PALETTE.length];
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixColors(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

export function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}
