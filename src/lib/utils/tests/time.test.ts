import { describe, expect, it } from 'vitest';
import {
  bucketTimestamps,
  formatDate,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  startOfDay,
} from '@/lib/utils/time';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatRelativeTime', () => {
  it('uses fixed boundaries against an explicit now value', () => {
    const now = 1_700_000_000_000;

    expect(formatRelativeTime(now, now)).toBe('just now');
    expect(formatRelativeTime(now - 59_999, now)).toBe('just now');
    expect(formatRelativeTime(now - MINUTE, now)).toBe('1m ago');
    expect(formatRelativeTime(now - 90 * MINUTE, now)).toBe('1h ago');
    expect(formatRelativeTime(now - HOUR, now)).toBe('1h ago');
    expect(formatRelativeTime(now - DAY, now)).toBe('1d ago');
    expect(formatRelativeTime(now - 30 * DAY, now)).toBe('1mo ago');
    expect(formatRelativeTime(now - 365 * DAY, now)).toBe('1y ago');
    expect(formatRelativeTime(now + MINUTE, now)).toBe('just now');
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes, hours and days', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(1_000)).toBe('1s');
    expect(formatDuration(MINUTE)).toBe('1m');
    expect(formatDuration(59 * MINUTE)).toBe('59m');
    expect(formatDuration(90 * MINUTE)).toBe('1h');
    expect(formatDuration(HOUR)).toBe('1h');
    expect(formatDuration(DAY)).toBe('1d');
  });
});

describe('date formatting', () => {
  const timestamp = Date.UTC(2024, 0, 15, 12, 30, 0);

  it('is stable across repeated calls and includes the year', () => {
    expect(formatDate(timestamp)).toBe(formatDate(timestamp));
    expect(formatDate(timestamp)).toContain('2024');
    expect(formatDateTime(timestamp)).toBe(formatDateTime(timestamp));
    expect(formatDateTime(timestamp)).toContain('2024');
    expect(formatDateTime(timestamp).length).toBeGreaterThanOrEqual(formatDate(timestamp).length);
  });
});

describe('startOfDay / bucketTimestamps', () => {
  it('normalizes to local midnight', () => {
    const timestamp = Date.UTC(2024, 5, 10, 18, 45, 0);
    const start = startOfDay(timestamp);

    expect(start).toBe(startOfDay(timestamp));
    expect(new Date(start).getHours()).toBe(0);
    expect(new Date(start).getMinutes()).toBe(0);
    expect(start).toBeLessThanOrEqual(timestamp);
    expect(timestamp - start).toBeLessThan(DAY);
  });

  it('counts timestamps into sorted buckets', () => {
    expect(bucketTimestamps([0, 1, DAY, DAY + 5, 3 * DAY])).toEqual(new Map([
      [0, 2],
      [DAY, 2],
      [3 * DAY, 1],
    ]));
    expect(bucketTimestamps([0, 9, 10], 10)).toEqual(new Map([[0, 2], [10, 1]]));
    expect(bucketTimestamps([])).toEqual(new Map());
    expect(bucketTimestamps([DAY + 1, 1]).size).toBe(2);
  });
});
