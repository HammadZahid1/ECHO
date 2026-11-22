import { describe, expect, it } from 'vitest';
import {
  componentClusters,
  estimateModularity,
  labelPropagationClusters,
  neighborhoodClusters,
  similarityClusters,
  tagClusters,
} from '@/lib/graph/clusters';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function componentGraph(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha', tags: ['x'] }),
    createNode({ id: 'b', title: 'Beta', tags: ['x'] }),
    createNode({ id: 'c', title: 'Gamma', tags: ['z'] }),
    createNode({ id: 'd', title: 'Delta', tags: ['y'] }),
    createNode({ id: 'e', title: 'Epsilon', tags: ['y'] }),
    createNode({ id: 'f', title: 'Zeta' }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1' }),
    createEdge('b', 'c', { id: 'e2' }),
    createEdge('d', 'e', { id: 'e3' }),
  );
  return graph;
}

describe('componentClusters', () => {
  it('creates one cluster per connected component, ordered by size', () => {
    const result = componentClusters(componentGraph());
    expect(result.method).toBe('component');
    expect(result.clusters.map((cluster) => cluster.size)).toEqual([3, 2, 1]);
    expect(new Set(result.clusters[0]?.nodeIds)).toEqual(new Set(['a', 'b', 'c']));
    expect(new Set(result.clusters[1]?.nodeIds)).toEqual(new Set(['d', 'e']));
    expect(result.clusters[2]?.nodeIds).toEqual(['f']);
    expect(result.clusters.every((cluster) => cluster.method === 'component')).toBe(true);
  });

  it('computes per-cluster density and overall modularity from real edges', () => {
    const result = componentClusters(componentGraph());
    expect(result.modularity).toBeCloseTo(1);
    expect(result.clusters[0]?.density).toBeCloseTo(2 / 3);
    expect(result.clusters[1]?.density).toBeCloseTo(1);
    expect(result.clusters[2]?.density).toBe(0);
    expect(result.clusters[0]?.keywords.length).toBeGreaterThan(0);
  });

  it('handles an empty graph', () => {
    const result = componentClusters(createGraphData());
    expect(result.clusters).toEqual([]);
    expect(result.modularity).toBe(0);
  });
});

describe('labelPropagationClusters', () => {
  it('groups connected nodes into a community and keeps isolated nodes separate', () => {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'Alpha' }),
      createNode({ id: 'b', title: 'Beta' }),
      createNode({ id: 'c', title: 'Gamma' }),
    );
    graph.edges.push(createEdge('a', 'b', { id: 'e1' }));

    const result = labelPropagationClusters(graph);
    expect(result.method).toBe('label-propagation');
    expect(result.clusters.map((cluster) => cluster.size)).toEqual([2, 1]);
    expect(new Set(result.clusters[0]?.nodeIds)).toEqual(new Set(['a', 'b']));
    expect(result.clusters[1]?.nodeIds).toEqual(['c']);
    expect(result.modularity).toBeCloseTo(1);
  });

  it('returns no communities for an empty graph and is stable across repeated runs', () => {
    expect(labelPropagationClusters(createGraphData()).clusters).toEqual([]);
    const graph = componentGraph();
    expect(labelPropagationClusters(graph).clusters.map((c) => c.nodeIds)).toEqual(
      labelPropagationClusters(graph).clusters.map((c) => c.nodeIds),
    );
  });
});

describe('tagClusters', () => {
  it('groups by tag and places untagged nodes into their own cluster', () => {
    const graph = componentGraph();
    const result = tagClusters(graph);
    expect(result.method).toBe('tag');
    const byName = new Map(result.clusters.map((cluster) => [cluster.name, cluster]));
    expect([...byName.keys()].sort()).toEqual(['untagged', 'x', 'y', 'z']);
    expect(byName.get('x')?.nodeIds).toEqual(['a', 'b']);
    expect(byName.get('y')?.nodeIds).toEqual(['d', 'e']);
    expect(byName.get('untagged')?.nodeIds).toEqual(['f']);
  });

  it('uses tag clusters as the partition for modularity', () => {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'Alpha', tags: ['shared'] }),
      createNode({ id: 'b', title: 'Beta', tags: ['shared'] }),
      createNode({ id: 'c', title: 'Gamma' }),
    );
    graph.edges.push(createEdge('a', 'b', { id: 'e1' }), createEdge('a', 'c', { id: 'e2' }));
    const result = tagClusters(graph);
    expect(result.modularity).toBeCloseTo(0.5);
    expect(result.clusters.find((cluster) => cluster.name === 'untagged')?.nodeIds).toEqual(['c']);
  });
});

describe('similarityClusters', () => {
  it('merges nodes with matching text and tags but keeps unrelated nodes apart', () => {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'Alpha Quantum', description: 'energy research', tags: ['quantum'] }),
      createNode({ id: 'b', title: 'Alpha Quantum', description: 'energy research', tags: ['quantum'] }),
      createNode({ id: 'c', title: 'Zebra Mountain', description: 'geology survey', tags: ['geo'] }),
    );
    const result = similarityClusters(graph);
    expect(result.method).toBe('similarity');
    expect(result.clusters.map((cluster) => cluster.size)).toEqual([2, 1]);
    expect(new Set(result.clusters[0]?.nodeIds)).toEqual(new Set(['a', 'b']));
    expect(result.clusters[1]?.nodeIds).toEqual(['c']);
  });

  it('does not merge anything when the threshold is unreachable', () => {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'Alpha Quantum', tags: ['quantum'] }),
      createNode({ id: 'b', title: 'Alpha Quantum', tags: ['quantum'] }),
    );
    expect(similarityClusters(graph, 2).clusters).toHaveLength(2);
  });
});

describe('neighborhoodClusters', () => {
  it('clusters the focus node and its neighbors within the requested depth', () => {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'Alpha' }),
      createNode({ id: 'b', title: 'Beta' }),
      createNode({ id: 'c', title: 'Gamma' }),
      createNode({ id: 'd', title: 'Delta' }),
    );
    graph.edges.push(
      createEdge('a', 'b', { id: 'e1' }),
      createEdge('b', 'c', { id: 'e2' }),
      createEdge('c', 'd', { id: 'e3' }),
    );

    const shallow = neighborhoodClusters(graph, 'b', 1);
    expect(shallow.method).toBe('neighborhood');
    expect(shallow.clusters).toHaveLength(1);
    expect(new Set(shallow.clusters[0]?.nodeIds)).toEqual(new Set(['b', 'a', 'c']));
    expect(shallow.clusters[0]?.name).toContain('Beta');
    expect(shallow.modularity).toBe(0);

    const deep = neighborhoodClusters(graph, 'b', 2);
    expect(new Set(deep.clusters[0]?.nodeIds)).toEqual(new Set(['b', 'a', 'c', 'd']));
  });
});

describe('estimateModularity', () => {
  it('measures the fraction of edges internal to a proposed partition', () => {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'Alpha' }),
      createNode({ id: 'b', title: 'Beta' }),
      createNode({ id: 'c', title: 'Gamma' }),
      createNode({ id: 'd', title: 'Delta' }),
    );
    graph.edges.push(
      createEdge('a', 'b', { id: 'e1' }),
      createEdge('c', 'd', { id: 'e2' }),
      createEdge('a', 'c', { id: 'e3' }),
    );
    expect(estimateModularity(graph, [['a', 'b'], ['c', 'd']])).toBeCloseTo(2 / 3);
    expect(estimateModularity(graph, [['a', 'b', 'c', 'd']])).toBe(1);
    expect(estimateModularity(graph, [['a'], ['b'], ['c'], ['d']])).toBe(0);
    expect(estimateModularity(createGraphData(), [['a']])).toBe(0);
  });
});
