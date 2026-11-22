import { describe, expect, it } from 'vitest';
import { highlightSegments } from '@/lib/search/highlight';

describe('highlightSegments', () => {
  it('returns the untouched text as one unmatched segment for an empty query', () => {
    expect(highlightSegments('Quantum Field', '   ')).toEqual([{ text: 'Quantum Field', match: false }]);
    expect(highlightSegments('', '')).toEqual([{ text: '', match: false }]);
  });

  it('returns a single unmatched segment when nothing matches', () => {
    expect(highlightSegments('Quantum Field', 'chess')).toEqual([{ text: 'Quantum Field', match: false }]);
  });

  it('splits around a single match and preserves original characters', () => {
    expect(highlightSegments('Quantum Field', 'field')).toEqual([
      { text: 'Quantum ', match: false },
      { text: 'Field', match: true },
    ]);
  });

  it('highlights every occurrence with alternating segments', () => {
    const segments = highlightSegments('Alpha alpha ALPHA', 'alpha');

    expect(segments).toEqual([
      { text: 'Alpha', match: true },
      { text: ' ', match: false },
      { text: 'alpha', match: true },
      { text: ' ', match: false },
      { text: 'ALPHA', match: true },
    ]);
    expect(segments.map((segment) => segment.text).join('')).toBe('Alpha alpha ALPHA');
  });

  it('trims the query and matches case-insensitively', () => {
    expect(highlightSegments('Hello World', ' WORLD ')).toEqual([
      { text: 'Hello ', match: false },
      { text: 'World', match: true },
    ]);
  });
});
