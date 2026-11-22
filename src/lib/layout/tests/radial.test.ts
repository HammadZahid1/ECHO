import { describe, expect, it } from 'vitest';
import { radialLayout } from '@/lib/layout/radial';
import { createDefaultSettings, createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';
import type { LayoutOptions } from '@/lib/layout/types';

function starGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'hub', title: 'Hub' }),
    createNode({ id: 'left', title: 'Left' }),
    createNode({ id: 'right', title: 'Right' }),
    createNode({ id: 'leaf', title: 'Leaf' }),
    createNode({ id: 'isolated', title: 'Isolated' }),
  );
  graph.edges.push(
    createEdge('hub', 'left', { id: 'e1' }),
    createEdge('hub', 'right', { id: 'e2' }),
    createEdge('hub', 'leaf', { id: 'e3' }),
  );
  return graph;
}

function options(graph: GraphData, overrides: Partial<LayoutOptions> = {}): LayoutOptions {
  return {
    graph,
    settings: { ...createDefaultSettings().layout, kind: 'radial' },
    ...overrides,
  };
}

function finiteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

describe('radialLayout', () => {
  it('covers every node and pins the requested focus at the origin', () => {
    const graph = starGraph();
    const positions = radialLayout(options(graph, { focusNodeId: 'hub', radius: 30, dimensions: 2, seed: 5 }));

    expect(positions.size).toBe(graph.nodes.length);
    expect(positions.get('hub')).toEqual({ x: 0, y: 0, z: 0 });
    expect([...positions.keys()].sort()).toEqual(graph.nodes.map((node) => node.id).sort());
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('places every non-focus node on the outer ring at distinct angles', () => {
    const positions = radialLayout(options(starGraph(), { focusNodeId: 'hub', radius: 30, dimensions: 2, seed: 5 }));
    const ringRadius = (position: { x: number; z: number }): number => Math.hypot(position.x, position.z);

    expect(ringRadius(positions.get('hub')!)).toBe(0);
    for (const id of ['left', 'right', 'leaf', 'isolated']) {
      const radius = ringRadius(positions.get(id)!);
      expect(radius).toBeGreaterThan(29);
      expect(radius).toBeLessThan(31);
    }
    expect(positions.get('left')).not.toEqual(positions.get('right'));
    expect(positions.get('leaf')).not.toEqual(positions.get('isolated'));
  });

  it('is deterministic for a fixed seed and uses flat y values in 2D', () => {
    const opts = options(starGraph(), { focusNodeId: 'hub', radius: 24, dimensions: 2, seed: 17 });
    expect(radialLayout(opts)).toEqual(radialLayout(opts));
    expect([...radialLayout(opts).values()].every((position) => position.y === 0)).toBe(true);
  });

  it('uses a 3D y offset unless 2D is requested', () => {
    const positions = radialLayout(options(starGraph(), { focusNodeId: 'hub', radius: 24, dimensions: 3, seed: 17 }));
    expect([...positions.values()].some((position) => position.y !== 0)).toBe(true);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('falls back to the highest-degree node for a missing focus and handles empty graphs', () => {
    const positions = radialLayout(options(starGraph(), { focusNodeId: 'does-not-exist', seed: 2 }));
    expect(positions.get('hub')).toEqual({ x: 0, y: 0, z: 0 });
    expect(positions.size).toBe(5);
    expect(radialLayout(options(createGraphData(), { seed: 2 })).size).toBe(0);
  });
});
