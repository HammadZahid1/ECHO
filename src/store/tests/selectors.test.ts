import { describe, expect, it } from 'vitest';
import { deriveGraph, selectedNodes } from '@/store/selectors';
import { computeStatistics } from '@/lib/graph/stats';
import { createEdge, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function makeGraph(): GraphData {
  const stamp = { createdAt: 1_735_689_600_000, updatedAt: 1_735_689_600_000 };
  return {
    nodes: [
      createNode({ ...stamp, id: 'a', title: 'Alpha', type: 'concept', tags: ['core'], importance: 0.8, createdAt: 100, updatedAt: 200 }),
      createNode({ ...stamp, id: 'b', title: 'Beta', type: 'person', tags: ['core'], importance: 0.5, createdAt: 200, updatedAt: 300 }),
      createNode({ ...stamp, id: 'c', title: 'Cora', type: 'research', tags: ['outer'], importance: 0.3, createdAt: 300, updatedAt: 400 }),
      createNode({ ...stamp, id: 'd', title: 'Delta', type: 'question', tags: ['outer'], importance: 0.9, createdAt: 400, updatedAt: 500 }),
    ],
    edges: [
      createEdge('a', 'b', { ...stamp, id: 'e1' }),
      createEdge('b', 'c', { ...stamp, id: 'e2' }),
      createEdge('c', 'd', { ...stamp, id: 'e3' }),
    ],
    tags: [],
  };
}

const graph = makeGraph();

describe('deriveGraph', () => {
  it('returns the full graph and matching statistics when no filters are active', () => {
    const derived = deriveGraph(graph);

    expect(derived.graph.nodes).toEqual(graph.nodes);
    expect(derived.graph.edges).toEqual(graph.edges);
    expect(derived.visibleNodes).toHaveLength(4);
    expect(derived.statistics).toEqual(computeStatistics(graph));
    expect(derived.adjacency.degree.get('b')).toBe(2);
  });

  it('removes hidden nodes and every edge incident to them', () => {
    const derived = deriveGraph(graph, { hiddenNodeIds: ['c'] });

    expect(derived.visibleNodes.map((node) => node.id)).toEqual(['a', 'b', 'd']);
    expect(derived.graph.edges.map((edge) => edge.id)).toEqual(['e1']);
    expect(derived.statistics.edgeCount).toBe(1);
    expect(derived.adjacency.degree.get('c')).toBeUndefined();
  });

  it('combines type and tag filters', () => {
    const derived = deriveGraph(graph, { types: ['concept', 'research'], tags: ['core', 'outer'] });

    expect(derived.visibleNodes.map((node) => node.id)).toEqual(['a', 'c']);
    expect(derived.graph.edges).toEqual([]);
    expect(derived.statistics.componentCount).toBe(2);

    const narrow = deriveGraph(graph, { types: ['concept'], tags: ['outer'] });
    expect(narrow.visibleNodes).toEqual([]);
    expect(narrow.statistics.nodeCount).toBe(0);
  });

  it('applies importance and date filters', () => {
    const important = deriveGraph(graph, { minImportance: 0.6 });
    expect(important.visibleNodes.map((node) => node.id)).toEqual(['a', 'd']);

    const recent = deriveGraph(graph, { createdAfter: 200 });
    expect(recent.visibleNodes.map((node) => node.id)).toEqual(['b', 'c', 'd']);

    const modified = deriveGraph(graph, { modifiedAfter: 400 });
    expect(modified.visibleNodes.map((node) => node.id)).toEqual(['c', 'd']);
  });

  it('matches queries case-insensitively across node fields', () => {
    expect(deriveGraph(graph, { query: 'ALPHA' }).visibleNodes.map((node) => node.id)).toEqual(['a']);
    expect(deriveGraph(graph, { query: 'outer' }).visibleNodes.map((node) => node.id)).toEqual(['c', 'd']);
    expect(deriveGraph(graph, { query: 'question' }).visibleNodes.map((node) => node.id)).toEqual(['d']);
  });

  it('restricts the graph to a supplied cluster membership', () => {
    const derived = deriveGraph(graph, { clusterNodeIds: ['b', 'c'] });

    expect(derived.visibleNodes.map((node) => node.id)).toEqual(['b', 'c']);
    expect(derived.graph.edges.map((edge) => edge.id)).toEqual(['e2']);
    expect(derived.statistics.nodeCount).toBe(2);
  });

  it('selects existing nodes in graph order and ignores unknown ids', () => {
    expect(selectedNodes(graph, ['d', 'a', 'unknown']).map((node) => node.id)).toEqual(['a', 'd']);
    expect(selectedNodes(graph, [])).toEqual([]);
    expect(selectedNodes(graph, ['unknown'])).toEqual([]);
  });
});
