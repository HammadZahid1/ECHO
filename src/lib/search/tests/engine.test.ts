import { describe, expect, it } from 'vitest';
import { createSearchEngine, DEFAULT_SEARCH_FILTERS, SearchEngine } from '@/lib/search/engine';
import { createEdge, createGraphData, createNode, type NodeOverrides } from '@/lib/graph/factory';
import type { GraphData, SearchQuery } from '@/types';

function node(id: string, title: string, overrides: NodeOverrides = {}) {
  return createNode({ id, title, importance: 0, createdAt: 10, updatedAt: 0, ...overrides });
}

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    node('a', 'Beta Quantum', { description: 'notes about chess', tags: ['physics'] }),
    node('b', 'Alpha Quantum', { description: 'quantum field notes', tags: ['science'] }),
    node('c', 'Gamma Chess', { description: 'board games', tags: ['games'] }),
    node('d', 'Delta Log', { description: 'logging', tags: ['quantum'] }),
  );
  graph.edges.push(createEdge('a', 'b', { id: 'e1', label: 'supports', type: 'supports' }));
  return graph;
}

function query(text: string, limit = 10): SearchQuery {
  return { text, filters: DEFAULT_SEARCH_FILTERS, limit };
}

describe('SearchEngine.search', () => {
  it('creates an engine instance and lists all documents by title for an empty query', () => {
    expect(createSearchEngine(fixture())).toBeInstanceOf(SearchEngine);

    const engine = createSearchEngine(fixture());
    const results = engine.search(query(''));
    expect(results.map((result) => result.nodeId)).toEqual(['b', 'a', 'd', 'c']);
    expect(results.every((result) => result.score === 0)).toBe(true);
    expect(results[0].matchedFields).toEqual(['all']);
    expect(results[0].highlights).toEqual([]);
    expect(engine.search(query('', 1)).map((result) => result.nodeId)).toEqual(['b']);
  });

  it('ranks title matches above description matches above tag matches', () => {
    const engine = createSearchEngine(fixture());
    const results = engine.search(query('quantum'));

    expect(results.map((result) => result.nodeId)).toEqual(['b', 'a', 'd']);
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[1].score).toBeGreaterThan(results[2].score);
  });

  it('exposes matched fields as highlights with safe, local snippet values', () => {
    const engine = createSearchEngine(fixture());
    const top = engine.search(query('quantum'))[0];

    expect(top.matchedFields).toEqual(['title', 'description']);
    expect(top.highlights).toEqual([
      { field: 'title', value: 'Alpha Quantum' },
      { field: 'description', value: 'quantum field notes' },
    ]);
    expect(top.snippet).toBe('quantum field notes');
    expect(top.nodeType).toBe('concept');
  });

  it('applies every filter before scoring', () => {
    const graph = createGraphData();
    graph.nodes.push(
      node('x', 'Ax', { type: 'note', importance: 0.8, tags: ['keep'], createdAt: 100, updatedAt: 200 }),
      node('y', 'By', { type: 'idea', importance: 0.4, tags: ['other'], createdAt: 100, updatedAt: 200 }),
      node('z', 'Cz', { type: 'note', importance: 0.9, tags: ['keep'], createdAt: 50, updatedAt: 50 }),
    );
    graph.edges.push(createEdge('x', 'y', { id: 'e' }));
    const engine = createSearchEngine(graph);

    const results = engine.search({
      text: '',
      filters: {
        types: ['note'],
        tags: ['KEEP'],
        minImportance: 0.5,
        createdAfter: 60,
        modifiedAfter: 60,
        onlyConnected: true,
      },
      limit: 10,
    });
    expect(results.map((result) => result.nodeId)).toEqual(['x']);
  });
});

describe('SearchEngine utilities', () => {
  it('supports quick search, suggestions and graph replacement', () => {
    const engine = createSearchEngine(fixture());

    expect(engine.quick('quantum').map((result) => result.nodeId)).toEqual(['b', 'a', 'd']);
    expect(engine.quick('quantum', 1)).toHaveLength(1);
    expect(engine.suggest('quantum')).toEqual(['Beta Quantum', 'Alpha Quantum', '#quantum']);
    expect(engine.suggest('   ')).toEqual([]);

    engine.setGraph(createGraphData());
    expect(engine.quick('quantum')).toEqual([]);
    expect(engine.suggest('quantum')).toEqual([]);
  });

  it('keeps a deduplicated, bounded local search history', () => {
    const engine = createSearchEngine(fixture());
    engine.setHistoryLimit(2);
    engine.recordSearch('  alpha  ', 3);
    engine.recordSearch('beta', 1);
    engine.recordSearch('alpha', 5);
    engine.recordSearch('   ', 9);

    const history = engine.getHistory();
    expect(history.map((entry) => entry.text)).toEqual(['alpha', 'beta']);
    expect(history[0].resultCount).toBe(5);
    expect(history[0].id).toMatch(/^search_/);
    expect(engine.getHistory()).not.toBe(history);

    engine.clearHistory();
    expect(engine.getHistory()).toEqual([]);

    engine.setHistoryLimit(0);
    engine.recordSearch('gamma', 1);
    expect(engine.getHistory()).toHaveLength(1);
  });
});
