import { describe, expect, it } from 'vitest';
import { gridLayout } from '@/lib/layout/grid';
import { createDefaultSettings, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';
import type { LayoutOptions } from '@/lib/layout/types';

function weightedGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'beta', title: 'Beta', importance: 0.2 }),
    createNode({ id: 'alpha', title: 'Alpha', importance: 0.9 }),
    createNode({ id: 'zulu', title: 'Zulu', importance: 0.9 }),
    createNode({ id: 'gamma', title: 'Gamma', importance: 0.1 }),
  );
  return graph;
}

function options(graph: GraphData, overrides: Partial<LayoutOptions> = {}): LayoutOptions {
  return {
    graph,
    settings: { ...createDefaultSettings().layout, kind: 'grid' },
    ...overrides,
  };
}

function finiteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

describe('gridLayout', () => {
  it('orders by importance then title and lays nodes out on a square grid', () => {
    const positions = gridLayout(options(weightedGraph(), { radius: 10, dimensions: 2 }));

    expect(positions.size).toBe(4);
    expect(positions.get('alpha')).toEqual({ x: -5, y: -5, z: 0 });
    expect(positions.get('zulu')).toEqual({ x: 5, y: -5, z: 0 });
    expect(positions.get('beta')).toEqual({ x: -5, y: 5, z: 0 });
    expect(positions.get('gamma')).toEqual({ x: 5, y: 5, z: 0 });
  });

  it('breaks equal-importance ties alphabetically', () => {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'zed', title: 'Zed', importance: 0.5 }),
      createNode({ id: 'ann', title: 'Ann', importance: 0.5 }),
    );
    const positions = gridLayout(options(graph, { radius: 8, dimensions: 2 }));

    expect(positions.get('ann')?.x).toBeCloseTo(-4, 6);
    expect(positions.get('zed')?.x).toBeCloseTo(4, 6);
    expect(positions.get('ann')!.x).toBeLessThan(positions.get('zed')!.x);
  });

  it('is deterministic and uses z for rows in 3D', () => {
    const opts = options(weightedGraph(), { radius: 10, dimensions: 3 });
    const positions = gridLayout(opts);

    expect(gridLayout(opts)).toEqual(positions);
    expect([...positions.values()].every((position) => position.y === 0)).toBe(true);
    expect(positions.get('alpha')?.z).toBeCloseTo(-5, 6);
    expect(positions.get('beta')?.z).toBeCloseTo(5, 6);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('keeps coverage and finite coordinates for a non-square node count', () => {
    const graph = weightedGraph();
    graph.nodes.push(createNode({ id: 'extra', title: 'Extra', importance: 0.05 }));
    const positions = gridLayout(options(graph, { radius: 6, dimensions: 2 }));

    expect(positions.size).toBe(5);
    expect([...positions.keys()].sort()).toEqual(['alpha', 'beta', 'extra', 'gamma', 'zulu']);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('returns an empty map for an empty graph', () => {
    expect(gridLayout(options(createGraphData())).size).toBe(0);
  });
});
