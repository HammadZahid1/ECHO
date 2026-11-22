import { describe, expect, it } from 'vitest';
import * as barrel from '@/lib/search';
import { buildDocument, buildIndex } from '@/lib/search/indexer';
import { passesFilters, scoreDocument } from '@/lib/search/score';
import { createSearchEngine, DEFAULT_SEARCH_FILTERS, SearchEngine } from '@/lib/search/engine';
import { filterCommands, fuzzyScore, rankSearchResults } from '@/lib/search/fuzzy';
import { highlightSegments } from '@/lib/search/highlight';
import { createGraphData, createNode } from '@/lib/graph/factory';

describe('search barrel exports', () => {
  it('re-exports the indexer helpers', () => {
    expect(barrel.buildDocument).toBe(buildDocument);
    expect(barrel.buildIndex).toBe(buildIndex);
  });

  it('re-exports the scoring helpers', () => {
    expect(barrel.scoreDocument).toBe(scoreDocument);
    expect(barrel.passesFilters).toBe(passesFilters);
  });

  it('re-exports the engine and its defaults', () => {
    expect(barrel.SearchEngine).toBe(SearchEngine);
    expect(barrel.createSearchEngine).toBe(createSearchEngine);
    expect(barrel.DEFAULT_SEARCH_FILTERS).toBe(DEFAULT_SEARCH_FILTERS);
  });

  it('re-exports fuzzy matching and highlighting helpers', () => {
    expect(barrel.fuzzyScore).toBe(fuzzyScore);
    expect(barrel.filterCommands).toBe(filterCommands);
    expect(barrel.rankSearchResults).toBe(rankSearchResults);
    expect(barrel.highlightSegments).toBe(highlightSegments);
  });
});

describe('barrel-only usage', () => {
  it('builds, searches and highlights without reaching outside the local graph', () => {
    const graph = createGraphData();
    graph.nodes.push(createNode({
      id: 'n1',
      title: 'Local Only',
      description: 'offline search',
      tags: ['local'],
      importance: 0,
      createdAt: 0,
      updatedAt: 0,
    }));

    const engine = barrel.createSearchEngine(graph);
    const results = engine.search({ text: 'local', filters: barrel.DEFAULT_SEARCH_FILTERS, limit: 5 });

    expect(results).toHaveLength(1);
    expect(results[0].nodeId).toBe('n1');
    expect(barrel.highlightSegments(results[0].title, 'local')).toEqual([
      { text: 'Local', match: true },
      { text: ' Only', match: false },
    ]);
    expect(barrel.fuzzyScore('local', 'Local')).toBe(100);
  });
});
