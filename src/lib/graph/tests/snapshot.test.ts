import { describe, expect, it } from 'vitest';
import { addEdge, addNode, removeNode, updateEdge, updateNode } from '@/lib/graph/operations';
import { createCamera, createDefaultSettings, createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import { compareGraphs, compareSnapshots, snapshotSummary } from '@/lib/graph/snapshot';
import type { GraphData, GraphSnapshot } from '@/types';

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha', tags: ['x'], createdAt: 100, updatedAt: 100 }),
    createNode({ id: 'b', title: 'Beta', tags: ['y'], createdAt: 200, updatedAt: 200 }),
  );
  graph.edges.push(createEdge('a', 'b', { id: 'e1', strength: 0.5, createdAt: 100, updatedAt: 100 }));
  return graph;
}

function snapshot(graph: GraphData, name: string): GraphSnapshot {
  return {
    id: `snapshot-${name}`,
    name,
    description: '',
    createdAt: 1000,
    graph,
    settings: createDefaultSettings(),
    camera: createCamera(),
  };
}

describe('compareGraphs', () => {
  it('reports added nodes and edges together with before/after statistics', () => {
    const before = fixture();
    const after = addEdge(
      addNode(before, createNode({ id: 'c', title: 'Charlie', tags: ['z'] })),
      createEdge('a', 'c', { id: 'e2', strength: 0.8 }),
    );
    const diff = compareGraphs(before, after);
    expect(diff.addedNodes).toEqual(['c']);
    expect(diff.addedEdges).toEqual(['e2']);
    expect(diff.removedNodes).toEqual([]);
    expect(diff.removedEdges).toEqual([]);
    expect(diff.modifiedNodes).toEqual([]);
    expect(diff.modifiedEdges).toEqual([]);
    expect(diff.statisticsBefore.nodeCount).toBe(2);
    expect(diff.statisticsBefore.edgeCount).toBe(1);
    expect(diff.statisticsBefore.density).toBe(1);
    expect(diff.statisticsBefore.averageDegree).toBe(1);
    expect(diff.statisticsAfter.nodeCount).toBe(3);
    expect(diff.statisticsAfter.edgeCount).toBe(2);
    expect(diff.statisticsAfter.density).toBeCloseTo(2 / 3);
    expect(diff.statisticsAfter.clusterCount).toBe(1);
  });

  it('reports removed nodes and the edges that disappear with them', () => {
    const before = fixture();
    const diff = compareGraphs(before, removeNode(before, 'b'));
    expect(diff.removedNodes).toEqual(['b']);
    expect(diff.removedEdges).toEqual(['e1']);
    expect(diff.addedNodes).toEqual([]);
    expect(diff.statisticsAfter.nodeCount).toBe(1);
    expect(diff.statisticsAfter.edgeCount).toBe(0);
    expect(diff.statisticsAfter.density).toBe(0);
  });

  it('detects property changes but ignores position-only node moves', () => {
    const before = fixture();
    const modified = compareGraphs(
      before,
      updateEdge(updateNode(before, 'a', { title: 'Alpha prime', tags: ['x', 'new'] }), 'e1', { strength: 0.9 }),
    );
    expect(modified.modifiedNodes).toEqual(['a']);
    expect(modified.modifiedEdges).toEqual(['e1']);

    const moved = compareGraphs(before, updateNode(before, 'a', { position: { x: 9, y: 9, z: 9 } }));
    expect(moved.modifiedNodes).toEqual([]);
    expect(moved.modifiedEdges).toEqual([]);

    expect(compareGraphs(before, before).modifiedNodes).toEqual([]);
    expect(compareGraphs(before, before).statisticsBefore).toEqual(compareGraphs(before, before).statisticsAfter);
  });
});

describe('compareSnapshots and snapshotSummary', () => {
  it('compares the graphs carried by two snapshots', () => {
    const before = fixture();
    const after = addNode(before, createNode({ id: 'c', title: 'Charlie' }));
    const diff = compareSnapshots(snapshot(before, 'before'), snapshot(after, 'after'));
    expect(diff.addedNodes).toEqual(['c']);
    expect(diff.statisticsAfter.nodeCount).toBe(3);
  });

  it('summarizes node and edge counts', () => {
    expect(snapshotSummary(snapshot(fixture(), 'base'))).toBe('2 nodes · 1 relationships');
  });
});
