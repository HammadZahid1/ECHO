import { describe, expect, it } from 'vitest';
import { clusterLayout } from '@/lib/layout/clusterLayout';
import { createDefaultSettings, createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';
import type { LayoutOptions } from '@/lib/layout/types';

function islandGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha' }),
    createNode({ id: 'b', title: 'Beta' }),
    createNode({ id: 'c', title: 'Gamma' }),
    createNode({ id: 'd', title: 'Delta' }),
    createNode({ id: 'e', title: 'Epsilon' }),
    createNode({ id: 'f', title: 'Zeta' }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1' }),
    createEdge('b', 'c', { id: 'e2' }),
    createEdge('d', 'e', { id: 'e3' }),
  );
  return graph;
}

function options(graph: GraphData, overrides: Partial<LayoutOptions> = {}): LayoutOptions {
  return {
    graph,
    settings: { ...createDefaultSettings().layout, kind: 'cluster' },
    ...overrides,
  };
}

function finiteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function centroid(positions: Map<string, { x: number; y: number; z: number }>, ids: string[]): { x: number; y: number } {
  const values = ids.map((id) => positions.get(id)!);
  return {
    x: values.reduce((sum, value) => sum + value.x, 0) / values.length,
    y: values.reduce((sum, value) => sum + value.y, 0) / values.length,
  };
}

describe('clusterLayout', () => {
  it('covers every node with finite coordinates', () => {
    const graph = islandGraph();
    const positions = clusterLayout(options(graph, { radius: 10, seed: 11, dimensions: 2 }));

    expect(positions.size).toBe(graph.nodes.length);
    expect([...positions.keys()].sort()).toEqual(graph.nodes.map((node) => node.id).sort());
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('separates connected components into distinct islands', () => {
    const positions = clusterLayout(options(islandGraph(), { radius: 10, seed: 11, dimensions: 2 }));
    const first = centroid(positions, ['a', 'b', 'c']);
    const second = centroid(positions, ['d', 'e']);
    const third = centroid(positions, ['f']);

    expect(second.x - first.x).toBeGreaterThan(15);
    expect(third.y - first.y).toBeGreaterThan(15);
    expect(first.x).toBeLessThan(0);
    expect(second.x).toBeGreaterThan(0);
  });

  it('is deterministic for a fixed seed', () => {
    const opts = options(islandGraph(), { radius: 10, seed: 23, dimensions: 2 });
    expect(clusterLayout(opts)).toEqual(clusterLayout(opts));
  });

  it('places a singleton close to its island centre', () => {
    const positions = clusterLayout(options(islandGraph(), { radius: 10, seed: 11, dimensions: 2 }));
    const singleton = positions.get('f')!;

    expect(singleton.x).toBeGreaterThan(-12);
    expect(singleton.x).toBeLessThan(-10);
    expect(singleton.y).toBeGreaterThan(10);
    expect(singleton.y).toBeLessThan(12);
  });

  it('uses z for islands in 3D and returns an empty map for empty graphs', () => {
    const positions = clusterLayout(options(islandGraph(), { radius: 10, seed: 4, dimensions: 3 }));
    const zValues = [...positions.values()].map((position) => position.z);

    expect(Math.max(...zValues) - Math.min(...zValues)).toBeGreaterThan(5);
    expect([...positions.values()].every(finiteVec)).toBe(true);
    expect(clusterLayout(options(createGraphData(), { seed: 4 })).size).toBe(0);
  });
});
