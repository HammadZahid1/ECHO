import { describe, expect, it } from 'vitest';
import { passesFilters, scoreDocument } from '@/lib/search/score';
import type { SearchDocument } from '@/lib/search/indexer';
import type { SearchFilters } from '@/types';

function makeDoc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    nodeId: 'n',
    title: 'Node',
    normalizedTitle: 'node',
    description: '',
    type: 'concept',
    tags: [],
    metadataText: '',
    relationshipText: '',
    searchText: 'node concept',
    tokens: new Set(['node']),
    importance: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

const emptyFilters: SearchFilters = { types: [], tags: [], minImportance: 0 };

describe('scoreDocument', () => {
  it('returns a zero score and no matches for an empty query', () => {
    expect(scoreDocument(makeDoc({ importance: 5 }), '   ')).toEqual({ score: 0, matchedFields: [] });
    expect(scoreDocument(makeDoc(), '')).toEqual({ score: 0, matchedFields: [] });
  });

  it('ranks exact title matches above prefixes and substrings', () => {
    const document = makeDoc({ title: 'Quantum Field', normalizedTitle: 'quantum field' });
    const exact = scoreDocument(document, 'quantum field').score;
    const prefix = scoreDocument(document, 'quan').score;
    const substring = scoreDocument(document, 'uantum').score;

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(0);
  });

  it('applies transparent field weights in title/tag/type/description/relationship/metadata order', () => {
    const title = scoreDocument(makeDoc({ title: 'Alpha', normalizedTitle: 'alpha', searchText: 'alpha' }), 'alpha');
    const tag = scoreDocument(makeDoc({ tags: ['alpha'], searchText: 'alpha' }), 'alpha');
    const type = scoreDocument(makeDoc({ type: 'alpha', searchText: 'alpha' }), 'alpha');
    const description = scoreDocument(makeDoc({ description: 'alpha', searchText: 'alpha' }), 'alpha');
    const relationship = scoreDocument(makeDoc({ relationshipText: 'alpha', searchText: 'alpha' }), 'alpha');
    const metadata = scoreDocument(makeDoc({ metadataText: 'alpha', searchText: 'alpha' }), 'alpha');

    expect(title.score).toBeGreaterThan(tag.score);
    expect(tag.score).toBeGreaterThan(type.score);
    expect(type.score).toBe(description.score);
    expect(description.score).toBeGreaterThan(relationship.score);
    expect(relationship.score).toBeGreaterThan(metadata.score);
    expect(tag.matchedFields).toEqual(['tags']);
    expect(relationship.matchedFields).toEqual(['relationships']);
    expect(metadata.matchedFields).toEqual(['metadata']);
  });

  it('reports every matched field and adds bounded importance/recency boosts', () => {
    const document = makeDoc({
      title: 'Alpha',
      normalizedTitle: 'alpha',
      tags: ['alpha'],
      type: 'alpha',
      description: 'alpha',
      relationshipText: 'alpha',
      metadataText: 'alpha',
      searchText: 'alpha',
      importance: 2,
      updatedAt: Date.now(),
    });
    const result = scoreDocument(document, 'alpha');
    const base = scoreDocument({ ...document, importance: 0, updatedAt: 0 }, 'alpha');

    expect(new Set(result.matchedFields)).toEqual(
      new Set(['title', 'tags', 'type', 'description', 'relationships', 'metadata']),
    );
    expect(result.score).toBeGreaterThan(base.score);
    expect(result.score - base.score).toBeLessThanOrEqual(4.5);
  });

  it('falls back to token prefixes only for terms longer than two characters', () => {
    const document = makeDoc({ searchText: 'unrelated', tokens: new Set(['quantum']) });

    expect(scoreDocument(document, 'quant').score).toBe(1);
    expect(scoreDocument(document, 'quant').matchedFields).toEqual(['title']);
    expect(scoreDocument(document, 'qu').score).toBe(0);
  });
});

describe('passesFilters', () => {
  const document = makeDoc({
    type: 'research',
    tags: ['physics', 'machine learning'],
    importance: 0.7,
    createdAt: 100,
    updatedAt: 200,
    relationshipText: 'supports',
    searchText: 'anything',
  });

  it('accepts empty filters and rejects mismatched types, tags and importance', () => {
    expect(passesFilters(document, emptyFilters)).toBe(true);
    expect(passesFilters(document, { ...emptyFilters, types: ['research'] })).toBe(true);
    expect(passesFilters(document, { ...emptyFilters, types: ['concept'] })).toBe(false);
    expect(passesFilters(document, { ...emptyFilters, tags: ['PHYSICS'] })).toBe(true);
    expect(passesFilters(document, { ...emptyFilters, tags: [' chemistry '] })).toBe(false);
    expect(passesFilters(document, { ...emptyFilters, minImportance: 0.8 })).toBe(false);
    expect(passesFilters(document, { ...emptyFilters, minImportance: 0.7 })).toBe(true);
  });

  it('enforces timestamp cutoffs and connected-only filtering', () => {
    expect(passesFilters(document, { ...emptyFilters, createdAfter: 101 })).toBe(false);
    expect(passesFilters(document, { ...emptyFilters, createdAfter: 100 })).toBe(true);
    expect(passesFilters(document, { ...emptyFilters, modifiedAfter: 201 })).toBe(false);
    expect(passesFilters(document, { ...emptyFilters, modifiedAfter: 200 })).toBe(true);
    expect(passesFilters(document, { ...emptyFilters, onlyConnected: true })).toBe(true);
    expect(passesFilters(makeDoc({ relationshipText: '' }), { ...emptyFilters, onlyConnected: true })).toBe(false);
  });
});
