import { describe, expect, it } from 'vitest';
import {
  bigramSimilarity,
  escapeRegExp,
  findMatches,
  normalizeText,
  slugify,
  tokenSimilarity,
  tokenize,
  truncate,
  uniqueTokens,
  wordCount,
} from '@/lib/utils/text';

describe('normalization and tokens', () => {
  it('normalizes accents, case and surrounding whitespace', () => {
    expect(normalizeText('  Café  ')).toBe('cafe');
    expect(normalizeText('HeLLo')).toBe('hello');
    expect(normalizeText('   ')).toBe('');
  });

  it('drops stop words and one-character tokens', () => {
    expect(tokenize('The quick brown fox and the dog')).toEqual(['quick', 'brown', 'fox', 'dog']);
    expect(tokenize('a I cat 42')).toEqual(['cat', '42']);
  });

  it('returns tokens in first-seen order without duplicates', () => {
    expect(uniqueTokens('alpha beta alpha gamma beta')).toEqual(['alpha', 'beta', 'gamma']);
    expect(uniqueTokens('the and')).toEqual([]);
  });
});

describe('formatting helpers', () => {
  it('slugifies to stable lowercase kebab-case with a fallback', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('Café au Lait')).toBe('cafe-au-lait');
    expect(slugify('---')).toBe('item');
  });

  it('truncates long strings with a single ellipsis and preserves short ones', () => {
    expect(truncate('short', 10)).toBe('short');
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
    expect(truncate('abcdefghij', 5)).toHaveLength(5);
  });

  it('counts whitespace-separated words', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount('   ')).toBe(0);
    expect(wordCount('  one  two\nthree ')).toBe(3);
  });
});

describe('similarity helpers', () => {
  it('computes dice similarity over normalized character bigrams', () => {
    expect(bigramSimilarity('Night', 'night')).toBe(1);
    expect(bigramSimilarity('night', 'nacht')).toBeCloseTo(0.25, 6);
    expect(bigramSimilarity('alpha', 'omega')).toBe(0);
    expect(bigramSimilarity('a', 'b')).toBe(0);
  });

  it('computes jaccard overlap over token sets', () => {
    expect(tokenSimilarity('alpha beta', 'alpha beta')).toBe(1);
    expect(tokenSimilarity('alpha beta', 'gamma delta')).toBe(0);
    expect(tokenSimilarity('alpha beta', 'alpha gamma')).toBeCloseTo(1 / 3, 6);
    expect(tokenSimilarity('the and', 'but or')).toBe(0);
  });
});

describe('search helpers', () => {
  it('escapes regular expression metacharacters', () => {
    expect(escapeRegExp('a.b*')).toBe('a\\.b\\*');
    expect(new RegExp(escapeRegExp('a.b*')).test('a.b*')).toBe(true);
    expect(new RegExp(escapeRegExp('a.b*')).test('axb')).toBe(false);
  });

  it('finds every case-insensitive match with inclusive start and exclusive end', () => {
    expect(findMatches('Alpha alpha ALPHA', 'alpha')).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 11 },
      { start: 12, end: 17 },
    ]);
    expect(findMatches('abc', '   ')).toEqual([]);
    expect(findMatches('abc', 'z')).toEqual([]);
  });
});
