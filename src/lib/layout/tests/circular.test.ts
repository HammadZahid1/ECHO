import { describe, expect, it } from 'vitest';
import { circularLayout } from '@/lib/layout/circular';
import { createDefaultSettings, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';
import type { LayoutOptions } from '@/lib/layout/types';

function ringGraph(count: number): GraphData {
  const graph = createGraphData();
  for (let i = 0; i < count; i += 1) {
    graph.nodes.push(createNode({ id: `n${i}`, title: `Node ${i}` }));
  }
  return graph;
}

function options(graph: GraphData, overrides: Partial<LayoutOptions> = {}): LayoutOptions {
  return {
    graph,
    settings: { ...createDefaultSettings().layout, kind: 'circular' },
    ...overrides,
  };
}

function finiteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

describe('circularLayout', () => {
  it('covers every node and spaces a small graph evenly on one circle', () => {
    const graph = ringGraph(4);
    const positions = circularLayout(options(graph, { radius: 36, dimensions: 2 }));

    expect(positions.size).toBe(4);
    expect(positions.get('n0')?.x).toBeCloseTo(0, 6);
    expect(positions.get('n0')?.y).toBeCloseTo(-36, 6);
    expect(positions.get('n1')?.x).toBeCloseTo(36, 6);
    expect(positions.get('n2')?.y).toBeCloseTo(36, 6);
    expect(positions.get('n3')?.x).toBeCloseTo(-36, 6);
  });

  it('is deterministic and keeps 2D nodes in the xy plane', () => {
    const opts = options(ringGraph(6), { radius: 20, dimensions: 2 });
    const first = circularLayout(opts);

    expect(circularLayout(opts)).toEqual(first);
    expect([...first.values()].every((position) => position.y !== 0)).toBe(true);
    expect([...first.values()].every((position) => position.z === 0)).toBe(true);
    expect([...first.values()].every(finiteVec)).toBe(true);
  });

  it('uses the xz plane in 3D mode', () => {
    const positions = circularLayout(options(ringGraph(5), { radius: 12, dimensions: 3 }));

    expect([...positions.values()].every((position) => position.y === 0)).toBe(true);
    expect([...positions.values()].some((position) => Math.abs(position.z) > 1)).toBe(true);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('adds outer rings for graphs larger than 24 nodes', () => {
    const positions = circularLayout(options(ringGraph(25), { radius: 10, dimensions: 2 }));
    const inner = Math.hypot(positions.get('n0')!.x, positions.get('n0')!.y);
    const outer = Math.hypot(positions.get('n20')!.x, positions.get('n20')!.y);

    expect(positions.size).toBe(25);
    expect(inner).toBeCloseTo(10, 6);
    expect(outer).toBeCloseTo(13.5, 6);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('returns an empty map for an empty graph', () => {
    expect(circularLayout(options(createGraphData())).size).toBe(0);
  });
});
