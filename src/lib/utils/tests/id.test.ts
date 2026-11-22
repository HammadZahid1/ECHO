import { describe, expect, it } from 'vitest';
import { createId, isIdLike, stableId } from '@/lib/utils/id';
import { hashString } from '@/lib/utils/math';

describe('stableId', () => {
  it('is deterministic for the same prefix and value', () => {
    expect(stableId('node', 'alpha')).toBe(stableId('node', 'alpha'));
    expect(stableId('node', 'alpha')).toBe(`node_${hashString('alpha').toString(36)}`);
    expect(stableId('node', 'alpha')).toMatch(/^node_[0-9a-z]+$/);
  });

  it('changes with the prefix and the value', () => {
    expect(stableId('node', 'alpha')).not.toBe(stableId('edge', 'alpha'));
    expect(stableId('node', 'alpha')).not.toBe(stableId('node', 'beta'));
    expect(stableId('p', '')).toBe(`p_${hashString('').toString(36)}`);
  });
});

describe('createId', () => {
  it('uses the prefix and generates unique values', () => {
    const ids = Array.from({ length: 40 }, () => createId('node'));

    expect(new Set(ids).size).toBe(40);
    expect(ids.every((id) => id.startsWith('node_'))).toBe(true);
    expect(ids.every((id) => id.length > 'node_'.length)).toBe(true);
    expect(createId('custom').startsWith('custom_')).toBe(true);
    expect(createId().startsWith('id_')).toBe(true);
  });
});

describe('isIdLike', () => {
  it('accepts trimmed non-empty identifiers up to 128 characters', () => {
    expect(isIdLike('a')).toBe(true);
    expect(isIdLike('  spaced id  ')).toBe(true);
    expect(isIdLike('x'.repeat(128))).toBe(true);
  });

  it('rejects empty, oversized and non-string values', () => {
    expect(isIdLike('')).toBe(false);
    expect(isIdLike('   ')).toBe(false);
    expect(isIdLike('x'.repeat(129))).toBe(false);
    expect(isIdLike(7)).toBe(false);
    expect(isIdLike(undefined)).toBe(false);
  });
});
