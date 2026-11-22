import { describe, expect, it } from 'vitest';
import { computeStatistics, degreeMap } from '@/lib/graph/stats';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha', description: 'Documented', tags: ['x', 'y'] }),
    createNode({ id: 'b', title: 'Alpha', description: '', tags: ['x'] }),
    createNode({ id: 'c', title: 'Gamma', description: 'Documented', type: 'idea', tags: ['z'] }),
    createNode({ id: 'd', title: 'Delta', description: '', type: 'note' }),
    createNode({ id: 'isolated', title: 'Echo', description: '', tags: ['z'] }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1', type: 'related' }),
    createEdge('b', 'c', { id: 'e2', type: 'supports' }),
    createEdge('c', 'a', { id: 'e3', type: 'depends' }),
    createEdge('c', 'd', { id: 'e4', type: 'related' }),
  );
  return graph;
}

describe('computeStatistics', () => {
  it('reports node, edge, degree and density values for a known graph', () => {
    const stats = computeStatistics(fixture());
    expect(stats.nodeCount).toBe(5);
    expect(stats.edgeCount).toBe(4);
    expect(stats.maxDegree).toBe(3);
    expect(stats.averageDegree).toBeCloseTo(8 / 5);
    expect(stats.medianDegree).toBe(2);
    expect(stats.density).toBeCloseTo(0.4);
    expect(stats.isolatedNodeIds).toEqual(['isolated']);
    expect(stats.mostConnectedNodeIds[0]).toBe('c');
    expect(stats.mostConnectedNodeIds).not.toContain('isolated');
  });

  it('builds type, relationship and tag distributions sorted by frequency', () => {
    const stats = computeStatistics(fixture());
    expect(stats.typeDistribution.map((bucket) => [bucket.key, bucket.count])).toEqual([
      ['concept', 3],
      ['idea', 1],
      ['note', 1],
    ]);
    expect(stats.relationshipDistribution.map((bucket) => [bucket.key, bucket.count])).toEqual([
      ['related', 2],
      ['depends', 1],
      ['supports', 1],
    ]);
    expect(stats.tagDistribution.map((bucket) => [bucket.key, bucket.count])).toEqual([
      ['x', 2],
      ['z', 2],
      ['y', 1],
    ]);
    expect(stats.typeDistribution[0]?.label).toBeTruthy();
    expect(stats.relationshipDistribution[0]?.color).toBeTruthy();
  });

  it('summarizes degree distribution, components, missing metadata and duplicate titles', () => {
    const stats = computeStatistics(fixture());
    const degreeCounts = new Map(stats.degreeDistribution.map((bucket) => [bucket.key, bucket.count]));
    expect(degreeCounts).toEqual(new Map([['2', 2], ['0', 1], ['1', 1], ['3', 1]]));
    expect(stats.clusterCount).toBe(2);
    expect(stats.componentCount).toBe(stats.clusterCount);
    expect(stats.largestClusterSize).toBe(4);
    expect(stats.missingDescriptionCount).toBe(3);
    expect(stats.missingTagsCount).toBe(1);
    expect(stats.duplicateTitleGroups).toEqual([['a', 'b']]);
  });

  it('returns zeroed statistics for an empty graph', () => {
    const stats = computeStatistics(createGraphData());
    expect(stats.nodeCount).toBe(0);
    expect(stats.edgeCount).toBe(0);
    expect(stats.averageDegree).toBe(0);
    expect(stats.medianDegree).toBe(0);
    expect(stats.maxDegree).toBe(0);
    expect(stats.density).toBe(0);
    expect(stats.clusterCount).toBe(0);
    expect(stats.largestClusterSize).toBe(0);
    expect(stats.typeDistribution).toEqual([]);
    expect(stats.degreeDistribution).toEqual([]);
    expect(stats.duplicateTitleGroups).toEqual([]);
  });

  it('treats a fully connected pair as maximum density', () => {
    const graph = createGraphData();
    graph.nodes.push(createNode({ id: 'a', title: 'Alpha' }), createNode({ id: 'b', title: 'Beta' }));
    graph.edges.push(createEdge('a', 'b', { id: 'e1' }));
    expect(computeStatistics(graph).density).toBe(1);
  });
});

describe('degreeMap', () => {
  it('exposes the same per-node degrees used by the statistics', () => {
    const graph = fixture();
    const degrees = degreeMap(graph);
    expect(degrees.get('a')).toBe(2);
    expect(degrees.get('b')).toBe(2);
    expect(degrees.get('c')).toBe(3);
    expect(degrees.get('d')).toBe(1);
    expect(degrees.get('isolated')).toBe(0);
    expect(degrees.size).toBe(graph.nodes.length);
  });
});
