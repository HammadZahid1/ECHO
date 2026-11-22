import { describe, expect, it } from 'vitest';
import { combinedSimilarity, findSimilarNodes, suggestConnections } from '@/lib/graph/similarity';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

describe('combinedSimilarity', () => {
  it('returns one for identical text and tags and scores unrelated nodes lower', () => {
    const identical = combinedSimilarity(
      'Alpha Quantum', 'energy research', ['quantum'],
      'Alpha Quantum', 'energy research', ['quantum'],
    );
    expect(identical).toBeCloseTo(1);
    const unrelated = combinedSimilarity(
      'Alpha Quantum', 'energy research', ['quantum'],
      'Chess Opening', 'board game strategy', ['games'],
    );
    expect(unrelated).toBeLessThan(identical);
    expect(unrelated).toBeGreaterThanOrEqual(0);
  });

  it('rewards shared tags and shared tokens independently', () => {
    const base = combinedSimilarity('Alpha Field', 'energy research', [], 'Beta Field', 'energy study', []);
    const withTag = combinedSimilarity('Alpha Field', 'energy research', ['x'], 'Beta Field', 'energy study', ['x']);
    const withToken = combinedSimilarity('Alpha Field', 'energy research', [], 'Alpha Field', 'energy study', []);
    expect(withTag).toBeGreaterThan(base);
    expect(withToken).toBeGreaterThan(base);
  });
});

describe('findSimilarNodes', () => {
  function fixture(): GraphData {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'Quantum Field Theory', description: 'Research notes about fields', tags: ['physics'] }),
      createNode({ id: 'b', title: 'Quantum Field Theory', description: 'Research notes about fields', tags: ['physics'] }),
      createNode({ id: 'c', title: 'Chess Opening Guide', description: 'board game strategies', tags: ['games'] }),
    );
    return graph;
  }

  it('finds near-duplicate nodes and ranks pairs by score', () => {
    const pairs = findSimilarNodes(fixture(), 0.62, 10);
    expect(pairs).toHaveLength(1);
    expect(new Set([pairs[0]?.a, pairs[0]?.b])).toEqual(new Set(['a', 'b']));
    expect(pairs[0]?.score).toBeGreaterThanOrEqual(0.62);
    expect(pairs[0]?.reason).toBeTruthy();
  });

  it('honors the threshold and limit', () => {
    expect(findSimilarNodes(fixture(), 1.1)).toEqual([]);
    expect(findSimilarNodes(fixture(), 0.62, 0)).toEqual([]);
  });
});

describe('suggestConnections', () => {
  function fixture(): GraphData {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'Alpha Quantum', description: 'energy research', tags: ['x', 'y'] }),
      createNode({ id: 'b', title: 'Beta Neighbor', description: 'connected already', tags: ['x', 'y'] }),
      createNode({ id: 'c', title: 'Alpha Quantum', description: 'energy research', tags: ['x', 'y'] }),
      createNode({ id: 'd', title: 'Zebra Mountain', description: 'geology survey', tags: ['z'] }),
    );
    graph.edges.push(createEdge('a', 'b', { id: 'e1' }));
    return graph;
  }

  it('excludes the target and already-connected nodes, ranking similar candidates first', () => {
    const suggestions = suggestConnections(fixture(), 'a', 5);
    expect(suggestions.map((pair) => pair.b)).toEqual(['c', 'd']);
    expect(suggestions[0]?.a).toBe('a');
    expect(suggestions[0]?.score).toBeGreaterThan(suggestions[1]?.score ?? Number.POSITIVE_INFINITY);
    expect(suggestions[0]?.reason).toContain('shared tag');
  });

  it('respects the limit and returns nothing for an unknown node', () => {
    expect(suggestConnections(fixture(), 'a', 1).map((pair) => pair.b)).toEqual(['c']);
    expect(suggestConnections(fixture(), 'missing')).toEqual([]);
  });
});
