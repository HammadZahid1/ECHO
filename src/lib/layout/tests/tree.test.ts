import { describe, expect, it } from 'vitest';
import { buildTree, forestLayout, treeLayout } from '@/lib/layout/tree';
import { hierarchicalLayout } from '@/lib/layout/hierarchical';
import { createDefaultSettings, createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';
import type { LayoutOptions } from '@/lib/layout/types';

function branchGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Root' }),
    createNode({ id: 'b', title: 'Branch B' }),
    createNode({ id: 'c', title: 'Branch C' }),
    createNode({ id: 'd', title: 'Leaf D' }),
    createNode({ id: 'e', title: 'Leaf E' }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1', directed: true }),
    createEdge('a', 'c', { id: 'e2', directed: true }),
    createEdge('b', 'd', { id: 'e3', directed: true }),
    createEdge('b', 'e', { id: 'e4', directed: true }),
  );
  return graph;
}

function options(graph: GraphData, overrides: Partial<LayoutOptions> = {}): LayoutOptions {
  return {
    graph,
    settings: { ...createDefaultSettings().layout, kind: 'tree' },
    ...overrides,
  };
}

function finiteVec(value: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

describe('buildTree', () => {
  it('builds a forest from directed edges and ignores dangling endpoints', () => {
    const graph = branchGraph();
    graph.edges.push(createEdge('a', 'ghost', { id: 'e5', directed: true }));
    const roots = buildTree(graph);

    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe('a');
    expect(roots[0].children.map((child) => child.id)).toEqual(['b', 'c']);
    expect(roots[0].children[0].children.map((child) => child.id)).toEqual(['d', 'e']);
  });

  it('falls back to every node when directed edges form a rootless cycle', () => {
    const graph = createGraphData();
    graph.nodes.push(createNode({ id: 'x' }), createNode({ id: 'y' }));
    graph.edges.push(
      createEdge('x', 'y', { id: 'e1', directed: true }),
      createEdge('y', 'x', { id: 'e2', directed: true }),
    );

    expect(buildTree(graph).map((root) => root.id)).toEqual(['x', 'y']);
  });
});

describe('treeLayout', () => {
  it('covers every node and places deeper generations lower', () => {
    const positions = treeLayout(options(branchGraph(), { radius: 10, dimensions: 2 }));

    expect(positions.size).toBe(5);
    expect(positions.get('a')?.y).toBeCloseTo(0, 6);
    expect(positions.get('b')?.y).toBeCloseTo(-10, 6);
    expect(positions.get('c')?.y).toBeCloseTo(-10, 6);
    expect(positions.get('d')?.y).toBeCloseTo(-20, 6);
    expect(positions.get('a')!.y).toBeGreaterThan(positions.get('d')!.y);
    expect([...positions.values()].every(finiteVec)).toBe(true);
  });

  it('centres a parent between its children and is deterministic', () => {
    const opts = options(branchGraph(), { radius: 10, dimensions: 2 });
    const positions = treeLayout(opts);

    expect(treeLayout(opts)).toEqual(positions);
    expect(positions.get('b')?.x).toBeCloseTo(5, 6);
    expect(positions.get('a')?.x).toBeCloseTo(17.5, 6);
    expect(positions.get('a')!.x).toBeGreaterThan(positions.get('b')!.x);
  });

  it('scales vertical spacing for 3D and handles empty graphs', () => {
    const positions = treeLayout(options(branchGraph(), { radius: 10, dimensions: 3 }));

    expect(positions.get('b')?.y).toBeCloseTo(-6, 6);
    expect(positions.get('d')?.y).toBeCloseTo(-12, 6);
    expect(positions.get('a')?.z).toBe(0);
    expect(treeLayout(options(createGraphData())).size).toBe(0);
  });
});

describe('forestLayout', () => {
  it('delegates to the hierarchical layout', () => {
    const opts = options(branchGraph(), { radius: 12, dimensions: 2 });
    expect(forestLayout(opts)).toEqual(hierarchicalLayout(opts));
  });
});
