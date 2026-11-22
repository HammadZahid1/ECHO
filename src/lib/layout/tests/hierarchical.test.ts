import { describe, expect, it } from 'vitest';
import { hierarchicalLayout } from '@/lib/layout/hierarchical';
import { createDefaultSettings, createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';
import type { LayoutOptions } from '@/lib/layout/types';

function treeGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Root' }),
    createNode({ id: 'b', title: 'Child B' }),
    createNode({ id: 'c', title: 'Child C' }),
    createNode({ id: 'd', title: 'Grandchild' }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1', directed: true }),
    createEdge('a', 'c', { id: 'e2', directed: true }),
    createEdge('b', 'd', { id: 'e3', directed: true }),
  );
  return graph;
}

function options(graph: GraphData, overrides: Partial<LayoutOptions> = {}): LayoutOptions {
  return {
    graph,
    settings: { ...createDefaultSettings().layout, kind: 'hierarchical' },
    ...overrides,
  };
}

function finiteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

describe('hierarchicalLayout', () => {
  it('covers every node and orders layers from root to leaf', () => {
    const positions = hierarchicalLayout(options(treeGraph(), { radius: 10, dimensions: 2 }));

    expect(positions.size).toBe(4);
    expect(positions.get('a')).toEqual({ x: 0, y: 10, z: 0 });
    expect(positions.get('b')?.y).toBeCloseTo(0, 6);
    expect(positions.get('c')?.y).toBeCloseTo(0, 6);
    expect(positions.get('d')?.y).toBeCloseTo(-10, 6);
    expect(positions.get('a')!.y).toBeGreaterThan(positions.get('b')!.y);
    expect(positions.get('b')!.y).toBeGreaterThan(positions.get('d')!.y);
  });

  it('centres siblings horizontally around their parent', () => {
    const positions = hierarchicalLayout(options(treeGraph(), { radius: 10, dimensions: 2 }));

    expect(positions.get('b')?.x).toBeCloseTo(-5, 6);
    expect(positions.get('c')?.x).toBeCloseTo(5, 6);
    expect(positions.get('d')?.x).toBeCloseTo(0, 6);
    expect(positions.get('b')!.x).toBeLessThan(positions.get('c')!.x);
  });

  it('is deterministic and spreads layers in z for 3D', () => {
    const opts = options(treeGraph(), { radius: 10, dimensions: 3 });
    const positions = hierarchicalLayout(opts);

    expect(hierarchicalLayout(opts)).toEqual(positions);
    expect(positions.get('b')?.z).toBeCloseTo(-1.75, 6);
    expect(positions.get('c')?.z).toBeCloseTo(1.75, 6);
    expect(positions.get('a')?.y).toBeCloseTo(6, 6);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('still covers nodes when directed edges form a cycle with no explicit root', () => {
    const graph = treeGraph();
    graph.edges.push(createEdge('d', 'a', { id: 'e4', directed: true }));
    const positions = hierarchicalLayout(options(graph, { radius: 8, dimensions: 2 }));

    expect(positions.size).toBe(4);
    expect([...positions.keys()].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('returns an empty map for an empty graph', () => {
    expect(hierarchicalLayout(options(createGraphData())).size).toBe(0);
  });
});
