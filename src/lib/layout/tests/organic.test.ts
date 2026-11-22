import { describe, expect, it } from 'vitest';
import { organicLayout } from '@/lib/layout/organic';
import { radialLayout } from '@/lib/layout/radial';
import { createDefaultSettings, createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';
import type { LayoutOptions } from '@/lib/layout/types';

function graph(): GraphData {
  const data = createGraphData();
  data.nodes.push(
    createNode({ id: 'hub', title: 'Hub' }),
    createNode({ id: 'a', title: 'A' }),
    createNode({ id: 'b', title: 'B' }),
    createNode({ id: 'isolated', title: 'Isolated' }),
  );
  data.edges.push(createEdge('hub', 'a', { id: 'e1' }), createEdge('hub', 'b', { id: 'e2' }));
  return data;
}

function options(overrides: Partial<LayoutOptions> = {}): LayoutOptions {
  return {
    graph: graph(),
    settings: { ...createDefaultSettings().layout, kind: 'organic' },
    ...overrides,
  };
}

function finiteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

describe('organicLayout', () => {
  it('covers every node with finite coordinates', () => {
    const data = graph();
    const positions = organicLayout(options({ graph: data, seed: 19, dimensions: 2 }));

    expect(positions.size).toBe(data.nodes.length);
    expect([...positions.keys()].sort()).toEqual(['a', 'b', 'hub', 'isolated']);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('is deterministic for a fixed seed', () => {
    const opts = options({ seed: 31, radius: 34, dimensions: 2 });
    expect(organicLayout(opts)).toEqual(organicLayout(opts));
  });

  it('only drifts a bounded distance from the radial scaffold', () => {
    const opts = options({ seed: 8, radius: 34, dimensions: 2, focusNodeId: 'hub' });
    const organic = organicLayout(opts);
    const scaffold = radialLayout({ ...opts, radius: 34 });

    for (const id of opts.graph.nodes.map((node) => node.id)) {
      const drifted = organic.get(id)!;
      const base = scaffold.get(id)!;
      const distance = Math.hypot(drifted.x - base.x, drifted.y - base.y, drifted.z - base.z);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThan(9);
    }
    expect(Math.hypot(organic.get('hub')!.x, organic.get('hub')!.y, organic.get('hub')!.z)).toBeLessThan(7);
  });

  it('keeps a disconnected node near the outer scaffold radius', () => {
    const positions = organicLayout(options({ seed: 12, radius: 30, dimensions: 2, focusNodeId: 'hub' }));
    const radius = Math.hypot(positions.get('isolated')!.x, positions.get('isolated')!.z);

    expect(radius).toBeGreaterThan(25);
    expect(radius).toBeLessThan(35);
    expect(positions.get('isolated')!.z).not.toBe(0);
  });

  it('returns an empty map for an empty graph', () => {
    expect(organicLayout(options({ graph: createGraphData(), seed: 3 })).size).toBe(0);
  });
});
