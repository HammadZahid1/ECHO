import { describe, expect, it } from 'vitest';
import { filterCommands, fuzzyScore, rankSearchResults } from '@/lib/search/fuzzy';
import type { CommandAction, SearchResult } from '@/types';

function command(
  id: string,
  title: string,
  keywords: string[] = [],
  shortcut?: string,
  disabled = false,
): CommandAction {
  return { id, title, group: 'test', keywords, shortcut, disabled, run: () => undefined };
}

function result(nodeId: string, title: string, score: number): SearchResult {
  return { nodeId, title, score, snippet: '', highlights: [], matchedFields: [], nodeType: 'concept' };
}

describe('fuzzyScore', () => {
  it('returns deterministic tiers for exact, prefix, substring and subsequence matches', () => {
    expect(fuzzyScore('', 'anything')).toBe(0);
    expect(fuzzyScore('cafe', 'CAFÉ')).toBe(100);
    expect(fuzzyScore('qua', 'quantum')).toBe(80);
    expect(fuzzyScore('antum', 'quantum')).toBe(60);
    expect(fuzzyScore('xyz', 'quantum')).toBe(0);
  });

  it('scores a non-contiguous subsequence above zero but below contiguous matches', () => {
    const subsequence = fuzzyScore('abc', 'aXbYc');
    const contiguous = fuzzyScore('abc', 'zabcx');

    expect(subsequence).toBeGreaterThan(0);
    expect(subsequence).toBeLessThan(contiguous);
    expect(fuzzyScore('abc', 'abc')).toBeGreaterThan(contiguous);
  });
});

describe('filterCommands', () => {
  const commands = [
    command('title', 'open palette'),
    command('keyword', 'Palette opener', ['open palette']),
    command('shortcut', 'Random', [], 'open'),
    command('miss', 'Unrelated'),
  ];

  it('returns enabled commands in order for an empty query and honors the limit', () => {
    const enabled = [
      command('1', 'Alpha'),
      command('2', 'Beta', [], undefined, true),
      command('3', 'Gamma'),
    ];

    expect(filterCommands(enabled, '   ').map((entry) => entry.id)).toEqual(['1', '3']);
    expect(filterCommands(enabled, '', 1).map((entry) => entry.id)).toEqual(['1']);
  });

  it('weights title over keywords and ignores disabled or unrelated actions', () => {
    expect(filterCommands(commands, 'open palette', 10).map((entry) => entry.id)).toEqual(['title', 'keyword']);
    expect(filterCommands(commands, 'open palette', 1).map((entry) => entry.id)).toEqual(['title']);
  });

  it('still considers shortcut-only matches', () => {
    const shortcutOnly = [command('s', 'Unrelated', [], 'op')];
    expect(filterCommands(shortcutOnly, 'op').map((entry) => entry.id)).toEqual(['s']);
  });
});

describe('rankSearchResults', () => {
  it('applies a bounded fuzzy title bonus and returns a new sorted array', () => {
    const results = [result('z', 'Zebra', 10), result('a', 'Alpha', 10)];
    const ranked = rankSearchResults(results, 'alpha');

    expect(ranked.map((entry) => entry.nodeId)).toEqual(['a', 'z']);
    expect(ranked[0].score).toBe(10);
    expect(results.map((entry) => entry.nodeId)).toEqual(['z', 'a']);
  });

  it('returns the original array untouched for an empty query', () => {
    const results = [result('a', 'Alpha', 1)];
    expect(rankSearchResults(results, '  ')).toBe(results);
  });
});
