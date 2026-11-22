import { describe, expect, it, vi } from 'vitest';
import { buildAdjacency } from '@/lib/graph/adjacency';
import {
  breadthFirst,
  connectedComponents,
  depthFirst,
  neighborhood,
  reachableWithin,
} from '@/lib/graph/traverse';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function chainGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha' }),
    createNode({ id: 'b', title: 'Beta' }),
    createNode({ id: 'c', title: 'Gamma' }),
    createNode({ id: 'd', title: 'Delta' }),
    createNode({ id: 'isolated', title: 'Isolated' }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'eab' }),
    createEdge('b', 'c', { id: 'ebc' }),
    createEdge('c', 'd', { id: 'ecd' }),
  );
  return graph;
}

describe('breadthFirst', () => {
  it('discovers nodes level by level and records the edge used to reach each one', () => {
    const visits = breadthFirst(buildAdjacency(chainGraph()), ['a']);
    expect(visits.map((visit) => visit.nodeId)).toEqual(['a', 'b', 'c', 'd']);
    expect(visits.map((visit) => visit.depth)).toEqual([0, 1, 2, 3]);
    expect(visits.slice(1).map((visit) => visit.viaEdgeId)).toEqual(['eab', 'ebc', 'ecd']);
  });

  it('stops expanding at maxDepth but still visits nodes at that depth', () => {
    const adjacency = buildAdjacency(chainGraph());
    expect(breadthFirst(adjacency, ['a'], { maxDepth: 0 }).map((v) => v.nodeId)).toEqual(['a']);
    expect(breadthFirst(adjacency, ['a'], { maxDepth: 1 }).map((v) => v.nodeId)).toEqual(['a', 'b']);
    expect(breadthFirst(adjacency, ['a'], { maxDepth: 2 }).map((v) => v.nodeId)).toEqual(['a', 'b', 'c']);
  });

  it('accepts several seeds at depth zero and does not revisit nodes', () => {
    const visits = breadthFirst(buildAdjacency(chainGraph()), ['a', 'isolated']);
    expect(new Set(visits.map((v) => v.nodeId))).toEqual(new Set(['a', 'b', 'c', 'd', 'isolated']));
    expect(visits.filter((v) => v.depth === 0).map((v) => v.nodeId)).toEqual(['a', 'isolated']);
    expect(visits).toHaveLength(5);
  });

  it('calls onVisit for each visited context in discovery order', () => {
    const onVisit = vi.fn();
    const visits = breadthFirst(buildAdjacency(chainGraph()), ['a'], { onVisit });
    expect(onVisit).toHaveBeenCalledTimes(visits.length);
    expect(onVisit.mock.calls.map(([context]) => context.nodeId)).toEqual(visits.map((v) => v.nodeId));
  });
});

describe('depthFirst', () => {
  it('visits every reachable node once with increasing depths along a chain', () => {
    const onVisit = vi.fn();
    const visits = depthFirst(buildAdjacency(chainGraph()), 'a', onVisit);
    expect(visits.map((v) => v.nodeId)).toEqual(['a', 'b', 'c', 'd']);
    expect(visits.map((v) => v.depth)).toEqual([0, 1, 2, 3]);
    expect(visits[0]?.viaEdgeId).toBeUndefined();
    expect(visits.slice(1).map((v) => v.viaEdgeId)).toEqual(['eab', 'ebc', 'ecd']);
    expect(onVisit).toHaveBeenCalledTimes(4);
  });

  it('returns only the start node when it has no incident edges', () => {
    expect(depthFirst(buildAdjacency(chainGraph()), 'isolated').map((v) => v.nodeId)).toEqual(['isolated']);
  });
});

describe('connectedComponents', () => {
  it('groups nodes by the undirected projection and sorts components by size', () => {
    const graph = chainGraph();
    graph.nodes.push(createNode({ id: 'x', title: 'X' }), createNode({ id: 'y', title: 'Y' }));
    graph.edges.push(createEdge('x', 'y', { id: 'exy' }));

    const components = connectedComponents(graph);
    expect(components.map((component) => component.length)).toEqual([4, 2, 1]);
    expect(new Set(components[0])).toEqual(new Set(['a', 'b', 'c', 'd']));
    expect(new Set(components[1])).toEqual(new Set(['x', 'y']));
    expect(components[2]).toEqual(['isolated']);
  });

  it('returns no components for an empty graph', () => {
    expect(connectedComponents(createGraphData())).toEqual([]);
  });
});

describe('neighborhood', () => {
  it('returns nodes and edges grouped by hop distance', () => {
    const result = neighborhood(chainGraph(), 'b', 2);
    expect(result.centerId).toBe('b');
    expect(result.byDepth[0]).toEqual(['b']);
    expect(new Set(result.byDepth[1])).toEqual(new Set(['a', 'c']));
    expect(result.byDepth[2]).toEqual(['d']);
    expect(new Set(result.nodeIds)).toEqual(new Set(['a', 'b', 'c', 'd']));
    expect(result.nodeIds).not.toContain('isolated');
    expect(result.edges.map((edge) => edge.edgeId)).toEqual(['eab', 'ebc', 'ecd']);
    expect(result.edges.find((edge) => edge.edgeId === 'ecd')?.depth).toBe(2);
  });

  it('supports a zero-depth neighborhood and a center without edges', () => {
    const graph = chainGraph();
    const zero = neighborhood(graph, 'b', 0);
    expect(zero.byDepth).toEqual([['b']]);
    expect(zero.edges).toEqual([]);
    const isolated = neighborhood(graph, 'isolated', 2);
    expect(isolated.byDepth).toEqual([['isolated']]);
    expect(isolated.nodeIds).toEqual(['isolated']);
  });
});

describe('reachableWithin', () => {
  it('returns the center plus nodes reachable within the given number of hops', () => {
    const graph = chainGraph();
    expect(reachableWithin(graph, 'b', 0)).toEqual(new Set(['b']));
    expect(reachableWithin(graph, 'b', 1)).toEqual(new Set(['b', 'a', 'c']));
    expect(reachableWithin(graph, 'b', 2)).toEqual(new Set(['b', 'a', 'c', 'd']));
  });
});
