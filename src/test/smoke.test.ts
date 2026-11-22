import { describe, expect, it } from 'vitest';

describe('test environment', () => {
  it('runs deterministic unit tests', () => {
    expect(1 + 1).toBe(2);
  });
});
