import { describe, expect, it } from 'vitest';
import {
  LAYOUT_FUNCTIONS,
  averagePosition,
  computeLayout,
  withLayoutPositions,
} from '@/lib/layout';
import { createDefaultSettings, createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData, GraphLayoutSettings } from '@/types';
import type { LayoutOptions, PositionMap } from '@/lib/layout/types';

function graph(): GraphData {
  const data = createGraphData();
  data.nodes.push(
    createNode({ id: 'a', title: 'A', position: { x: 1, y: 2, z: 3 } }),
    createNode({ id: 'b', title: 'B', position: { x: -4, y: 5, z: -6 } }),
    createNode({ id: 'c', title: 'C', position: { x: 7, y: -8, z: 9 } }),
  );
  data.edges.push(createEdge('a', 'b', { id: 'e1', directed: true }));
  return data;
}

function options(kind: GraphLayoutSettings['kind'], data: GraphData = graph()): LayoutOptions {
  return { graph: data, settings: { ...createDefaultSettings().layout, kind }, seed: 21, radius: 20, dimensions: 2 };
}

describe('computeLayout', () => {
  it('registers exactly the seven deterministic layout functions', () => {
    expect(Object.keys(LAYOUT_FUNCTIONS).sort()).toEqual([
      'circular', 'cluster', 'grid', 'hierarchical', 'organic', 'radial', 'tree',
    ]);
  });

  it('dispatches every non-force kind to its registered implementation', () => {
    const data = graph();
    for (const kind of Object.keys(LAYOUT_FUNCTIONS) as (keyof typeof LAYOUT_FUNCTIONS)[]) {
      const opts = options(kind, data);
      expect(computeLayout(opts)).toEqual(LAYOUT_FUNCTIONS[kind](opts));
    }
  });

  it('returns detached copies of node positions for the force kind', () => {
    const data = graph();
    const positions = computeLayout(options('force', data));

    expect(positions.size).toBe(3);
    expect(positions.get('a')).toEqual({ x: 1, y: 2, z: 3 });
    expect(positions.get('a')).not.toBe(data.nodes[0].position);
    expect(data.nodes[0].position).toEqual({ x: 1, y: 2, z: 3 });
  });
});

describe('withLayoutPositions', () => {
  it('applies positions without mutating the source graph', () => {
    const data = graph();
    const positions: PositionMap = new Map([['a', { x: 10, y: 20, z: 30 }]]);
    const result = withLayoutPositions(data, positions);

    expect(result).not.toBe(data);
    expect(result.nodes[0].position).toEqual({ x: 10, y: 20, z: 30 });
    expect(data.nodes[0].position).toEqual({ x: 1, y: 2, z: 3 });
    expect(result.nodes[1]).toBe(data.nodes[1]);
    expect(result.edges).toBe(data.edges);
  });
});

describe('averagePosition', () => {
  it('handles empty and known position sets', () => {
    expect(averagePosition([])).toEqual({ x: 0, y: 0, z: 0 });
    expect(averagePosition([
      { x: 1, y: 2, z: 3 },
      { x: 3, y: 4, z: 5 },
    ])).toEqual({ x: 2, y: 3, z: 4 });
  });

  it('does not mutate the supplied positions', () => {
    const input = [{ x: 2, y: 4, z: 6 }];
    expect(averagePosition(input)).toEqual({ x: 2, y: 4, z: 6 });
    expect(input).toEqual([{ x: 2, y: 4, z: 6 }]);
  });
});
