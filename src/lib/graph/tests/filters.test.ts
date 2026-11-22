import { describe, expect, it } from 'vitest';
import {
  applyFilters,
  collectAllTags,
  collectNodeTypes,
  filterEdges,
  filterNodes,
} from '@/lib/graph/filters';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({
      id: 'a', title: 'Alpha', description: 'first topic', type: 'concept', tags: ['x', 'y'],
      importance: 0.8, createdAt: 100, updatedAt: 500, collectionIds: ['c1'],
    }),
    createNode({
      id: 'b', title: 'Beta', description: 'second topic', type: 'idea', tags: ['y'],
      importance: 0.3, createdAt: 200, updatedAt: 200,
    }),
    createNode({
      id: 'c', title: 'Gamma', description: 'Zebra theory', type: 'concept', tags: ['z'],
      importance: 0.6, createdAt: 300, updatedAt: 400, collectionIds: ['c2'],
    }),
    createNode({
      id: 'd', title: 'Delta', description: 'fourth topic', type: 'note',
      importance: 0.9, createdAt: 400, updatedAt: 300,
    }),
  );
  graph.edges.push(createEdge('a', 'b', { id: 'e1' }));
  return graph;
}

const ids = (graph: GraphData): string[] => graph.nodes.map((node) => node.id);

describe('filterNodes', () => {
  it('filters by node type, tags and minimum importance', () => {
    const graph = fixture();
    expect(filterNodes(graph, { types: ['concept'] }).map((node) => node.id)).toEqual(['a', 'c']);
    expect(filterNodes(graph, { tags: ['y'] }).map((node) => node.id)).toEqual(['a', 'b']);
    expect(filterNodes(graph, { minImportance: 0.6 }).map((node) => node.id)).toEqual(['a', 'c', 'd']);
  });

  it('filters by creation and modification timestamps', () => {
    const graph = fixture();
    expect(filterNodes(graph, { createdAfter: 250 }).map((node) => node.id)).toEqual(['c', 'd']);
    expect(filterNodes(graph, { modifiedAfter: 350 }).map((node) => node.id)).toEqual(['a', 'c']);
  });

  it('filters by connectivity, collection, cluster membership and hidden ids', () => {
    const graph = fixture();
    expect(filterNodes(graph, { onlyConnected: true }).map((node) => node.id)).toEqual(['a', 'b']);
    expect(filterNodes(graph, { collectionId: 'c1' }).map((node) => node.id)).toEqual(['a']);
    expect(filterNodes(graph, { clusterNodeIds: ['a', 'c'] }).map((node) => node.id)).toEqual(['a', 'c']);
    expect(filterNodes(graph, { hiddenNodeIds: ['b'] }).map((node) => node.id)).toEqual(['a', 'c', 'd']);
  });

  it('matches a normalized query against title, description, tags and type', () => {
    const graph = fixture();
    expect(filterNodes(graph, { query: 'ZEBRA' }).map((node) => node.id)).toEqual(['c']);
    expect(filterNodes(graph, { query: 'concept' }).map((node) => node.id)).toEqual(['a', 'c']);
    expect(filterNodes(graph, { query: 'nothing-matches' })).toEqual([]);
  });

  it('applies all active filters together and returns everything when none are set', () => {
    const graph = fixture();
    expect(filterNodes(graph, { types: ['concept'], minImportance: 0.7 }).map((node) => node.id)).toEqual(['a']);
    expect(filterNodes(graph)).toHaveLength(4);
  });
});

describe('applyFilters', () => {
  it('keeps only edges whose endpoints survive filtering', () => {
    const graph = fixture();
    const result = applyFilters(graph, { types: ['idea'] });
    expect(ids(result)).toEqual(['b']);
    expect(result.edges).toEqual([]);
    expect(ids(graph)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('preserves an edge when both endpoints are visible', () => {
    const result = applyFilters(fixture(), { clusterNodeIds: ['a', 'b'] });
    expect(result.edges.map((edge) => edge.id)).toEqual(['e1']);
  });

  it('filters edges against an explicit set of visible node ids', () => {
    expect(filterEdges(fixture(), new Set(['a']))).toEqual([]);
    expect(filterEdges(fixture(), new Set(['a', 'b'])).map((edge) => edge.id)).toEqual(['e1']);
  });
});

describe('collectAllTags and collectNodeTypes', () => {
  it('counts tags across nodes, sorted by frequency then name', () => {
    expect(collectAllTags(fixture())).toEqual([
      { tag: 'y', count: 2 },
      { tag: 'x', count: 1 },
      { tag: 'z', count: 1 },
    ]);
    expect(collectAllTags(createGraphData())).toEqual([]);
  });

  it('returns each node type once in first-seen order', () => {
    expect(collectNodeTypes(fixture())).toEqual(['concept', 'idea', 'note']);
  });
});
