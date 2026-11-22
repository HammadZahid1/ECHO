import { describe, expect, it } from 'vitest';
import { findPaths, pathWaypoints, shortestPath } from '@/lib/graph/pathfinding';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha' }),
    createNode({ id: 'b', title: 'Beta' }),
    createNode({ id: 'c', title: 'Gamma' }),
    createNode({ id: 'd', title: 'Delta' }),
    createNode({ id: 'lonely', title: 'Lonely' }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1', strength: 0.5 }),
    createEdge('b', 'c', { id: 'e2', strength: 0.9 }),
    createEdge('a', 'c', { id: 'e3', type: 'depends', strength: 0.2 }),
    createEdge('c', 'd', { id: 'e4', type: 'supports', strength: 0.4 }),
  );
  return graph;
}

describe('shortestPath', () => {
  it('returns the unweighted shortest path with its edges, types and summed strength', () => {
    const path = shortestPath(fixture(), 'a', 'd');
    expect(path).not.toBeNull();
    expect(path?.nodeIds).toEqual(['a', 'c', 'd']);
    expect(path?.edgeIds).toEqual(['e3', 'e4']);
    expect(path?.length).toBe(2);
    expect(path?.relationshipTypes).toEqual(['depends', 'supports']);
    expect(path?.totalStrength).toBeCloseTo(0.6);
  });

  it('returns a zero length path from a node to itself', () => {
    const path = shortestPath(fixture(), 'a', 'a');
    expect(path?.nodeIds).toEqual(['a']);
    expect(path?.edgeIds).toEqual([]);
    expect(path?.length).toBe(0);
  });

  it('returns null when no path exists or an endpoint is unknown', () => {
    expect(shortestPath(fixture(), 'a', 'lonely')).toBeNull();
    expect(shortestPath(fixture(), 'a', 'missing')).toBeNull();
  });
});

describe('findPaths', () => {
  it('enumerates simple paths ordered by length and then strength', () => {
    const result = findPaths(fixture(), 'a', 'd');
    expect(result.found).toBe(true);
    expect(result.paths.map((path) => path.nodeIds)).toEqual([
      ['a', 'c', 'd'],
      ['a', 'b', 'c', 'd'],
    ]);
    expect(result.explored).toBeGreaterThan(0);
  });

  it('respects maxLength and limit', () => {
    const shortOnly = findPaths(fixture(), 'a', 'd', { maxLength: 2 });
    expect(shortOnly.paths.map((path) => path.nodeIds)).toEqual([['a', 'c', 'd']]);
    expect(findPaths(fixture(), 'a', 'd', { limit: 1 }).paths).toHaveLength(1);
  });

  it('reports no paths for disconnected or unknown endpoints', () => {
    for (const [from, to] of [['a', 'lonely'], ['a', 'missing']]) {
      const result = findPaths(fixture(), from, to);
      expect(result.found).toBe(false);
      expect(result.paths).toEqual([]);
      expect(result.from).toBe(from);
      expect(result.to).toBe(to);
    }
  });
});

describe('pathWaypoints', () => {
  it('counts intermediate nodes across candidate paths and ranks the most frequent first', () => {
    const paths = findPaths(fixture(), 'a', 'd').paths;
    const waypoints = pathWaypoints(paths);
    expect(waypoints).toEqual([
      { nodeId: 'c', count: 2 },
      { nodeId: 'b', count: 1 },
    ]);
    expect(pathWaypoints([])).toEqual([]);
  });

  it('ignores the start and end nodes of each path', () => {
    const path = shortestPath(fixture(), 'a', 'd');
    expect(pathWaypoints(path ? [path] : [])).toEqual([{ nodeId: 'c', count: 1 }]);
  });
});
