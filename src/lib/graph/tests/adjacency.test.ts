import { describe, expect, it } from 'vitest';
import { buildAdjacency, edgeBetween, neighbors, nodeDegree, outgoingNeighbors } from '@/lib/graph/adjacency';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha', type: 'concept', tags: ['x'] }),
    createNode({ id: 'b', title: 'Beta', type: 'idea', tags: ['y'] }),
    createNode({ id: 'c', title: 'Gamma', type: 'note' }),
    createNode({ id: 'd', title: 'Delta', type: 'resource' }),
    createNode({ id: 'lonely', title: 'Lonely', type: 'concept' }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1', directed: true }),
    createEdge('b', 'c', { id: 'e2', directed: true }),
    createEdge('c', 'a', { id: 'e3', directed: true }),
    createEdge('a', 'd', { id: 'e4', directed: true }),
  );
  return graph;
}

describe('buildAdjacency', () => {
  it('indexes every node, including isolated ones, with an empty starting degree', () => {
    const adjacency = buildAdjacency(fixture());
    for (const id of ['a', 'b', 'c', 'd', 'lonely']) {
      expect(adjacency.out.has(id)).toBe(true);
      expect(adjacency.incoming.has(id)).toBe(true);
      expect(adjacency.all.has(id)).toBe(true);
      expect(adjacency.degree.get(id)).toBe(nodeDegree(adjacency, id));
    }
    expect(nodeDegree(adjacency, 'lonely')).toBe(0);
    expect(nodeDegree(adjacency, 'missing')).toBe(0);
  });

  it('builds directed out/incoming lists and an undirected view from the same edges', () => {
    const adjacency = buildAdjacency(fixture());
    expect(outgoingNeighbors(adjacency, 'a')).toEqual(['b', 'd']);
    expect(adjacency.incoming.get('a')?.map((ref) => ref.other)).toEqual(['c']);
    expect(neighbors(adjacency, 'a')).toEqual(['b', 'c', 'd']);
    expect(adjacency.all.get('a')?.map((ref) => ref.edge.id)).toEqual(['e1', 'e3', 'e4']);
  });

  it('counts incident edges once per endpoint, even when edges are directed', () => {
    const adjacency = buildAdjacency(fixture());
    expect(nodeDegree(adjacency, 'a')).toBe(3);
    expect(nodeDegree(adjacency, 'b')).toBe(2);
    expect(nodeDegree(adjacency, 'c')).toBe(2);
    expect(nodeDegree(adjacency, 'd')).toBe(1);
    expect([...adjacency.degree.values()].reduce((sum, degree) => sum + degree, 0)).toBe(8);
  });

  it('ignores edges whose endpoints are not in the node list', () => {
    const graph = fixture();
    graph.edges.push(createEdge('a', 'ghost', { id: 'bad' }));
    const adjacency = buildAdjacency(graph);
    expect(nodeDegree(adjacency, 'a')).toBe(3);
    expect(adjacency.all.has('ghost')).toBe(false);
    expect(neighbors(adjacency, 'a')).not.toContain('ghost');
  });

  it('counts a self edge toward its single endpoint for both directions of the undirected view', () => {
    const graph = createGraphData();
    graph.nodes.push(createNode({ id: 'a', title: 'Alpha' }));
    graph.edges.push(createEdge('a', 'a', { id: 'loop' }));
    const adjacency = buildAdjacency(graph);
    expect(nodeDegree(adjacency, 'a')).toBe(2);
    expect(neighbors(adjacency, 'a')).toEqual(['a', 'a']);
  });
});

describe('neighbors and nodeDegree', () => {
  it('returns an empty list for unknown nodes', () => {
    const adjacency = buildAdjacency(fixture());
    expect(neighbors(adjacency, 'unknown')).toEqual([]);
    expect(outgoingNeighbors(adjacency, 'unknown')).toEqual([]);
  });
});

describe('edgeBetween', () => {
  it('finds an edge in either direction and returns undefined when none exists', () => {
    const graph = fixture();
    expect(edgeBetween(graph, 'a', 'b')?.id).toBe('e1');
    expect(edgeBetween(graph, 'b', 'a')?.id).toBe('e1');
    expect(edgeBetween(graph, 'b', 'd')).toBeUndefined();
    expect(edgeBetween(graph, 'a', 'lonely')).toBeUndefined();
  });
});
