import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useClusters, useDerivedGraph, useGraphHealth, useGraphStatistics } from '@/hooks/useGraphDerived';
import { labelPropagationClusters } from '@/lib/graph/clusters';
import { analyzeGraphHealth } from '@/lib/graph/health';
import { computeStatistics } from '@/lib/graph/stats';
import { createEdge, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', () => ({
  createDebouncedSaver: () => () => undefined,
  loadWorkspaces: async () => ({ workspaces: [], issues: [], available: false }),
  saveWorkspace: async () => undefined,
  deleteWorkspace: async () => undefined,
}));

function makeGraph(): GraphData {
  const stamp = { createdAt: 1_735_689_600_000, updatedAt: 1_735_689_600_000 };
  return {
    nodes: [
      createNode({ ...stamp, id: 'a', title: 'Alpha', type: 'concept', tags: ['core'] }),
      createNode({ ...stamp, id: 'b', title: 'Beta', type: 'person', tags: ['core'] }),
      createNode({ ...stamp, id: 'c', title: 'Gamma', type: 'resource', tags: ['outer'] }),
      createNode({ ...stamp, id: 'lonely', title: 'Lonely', description: '', tags: [] }),
    ],
    edges: [
      createEdge('a', 'b', { ...stamp, id: 'e1' }),
      createEdge('b', 'c', { ...stamp, id: 'e2' }),
    ],
    tags: [],
  };
}

const graph = makeGraph();

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-derived', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    filters: {},
    selectedNodeIds: [],
    histories: {},
  });
});

describe('useGraphDerived', () => {
  it('useGraphStatistics mirrors computeStatistics and memoizes by graph identity', () => {
    const { result, rerender } = renderHook(({ input }) => useGraphStatistics(input), {
      initialProps: { input: graph },
    });

    expect(result.current).toEqual(computeStatistics(graph));
    const first = result.current;
    rerender({ input: graph });
    expect(result.current).toBe(first);

    const other = { ...graph, nodes: graph.nodes.slice(0, 2) };
    rerender({ input: other });
    expect(result.current.nodeCount).toBe(2);
  });

  it('useGraphHealth mirrors analyzeGraphHealth and memoizes by graph identity', () => {
    const { result, rerender } = renderHook(({ input }) => useGraphHealth(input), {
      initialProps: { input: graph },
    });

    expect(result.current.nodeCount).toBe(4);
    expect(result.current.edgeCount).toBe(2);
    expect(result.current.issues.map((issue) => issue.kind)).toContain('isolated');
    expect(result.current.issues.map((issue) => issue.kind)).toContain('missing-tags');
    const first = result.current;
    rerender({ input: graph });
    expect(result.current).toBe(first);
    expect(analyzeGraphHealth(graph).score).toBe(result.current.score);
  });

  it('useClusters mirrors label propagation and memoizes by graph identity', () => {
    const { result, rerender } = renderHook(({ input }) => useClusters(input), {
      initialProps: { input: graph },
    });

    expect(result.current).toEqual(labelPropagationClusters(graph));
    const first = result.current;
    rerender({ input: graph });
    expect(result.current).toBe(first);
  });

  it('useDerivedGraph reads the active workspace graph with no filters', () => {
    const { result } = renderHook(() => useDerivedGraph());

    expect(result.current.graph.nodes).toEqual(graph.nodes);
    expect(result.current.graph.edges).toEqual(graph.edges);
    expect(result.current.visibleNodes).toHaveLength(4);
    expect(result.current.statistics.nodeCount).toBe(4);
  });

  it('useDerivedGraph applies store filters to nodes, edges and statistics', () => {
    const { result } = renderHook(() => useDerivedGraph());

    act(() => {
      useGraphStore.getState().setFilters({ hiddenNodeIds: ['c', 'lonely'] });
    });

    expect(result.current.visibleNodes.map((node) => node.id)).toEqual(['a', 'b']);
    expect(result.current.graph.edges.map((edge) => edge.id)).toEqual(['e1']);
    expect(result.current.statistics.nodeCount).toBe(2);
    expect(result.current.statistics.edgeCount).toBe(1);
    expect(result.current.adjacency.degree.get('c')).toBeUndefined();
  });

  it('useDerivedGraph reacts to type filters from the store', () => {
    const { result } = renderHook(() => useDerivedGraph());

    act(() => { useGraphStore.getState().setFilters({ types: ['person'] }); });

    expect(result.current.visibleNodes.map((node) => node.id)).toEqual(['b']);
    expect(result.current.graph.edges).toHaveLength(0);
    expect(result.current.statistics.isolatedNodeIds).toEqual(['b']);
  });

  it('useDerivedGraph falls back to an empty graph when no workspace is active', () => {
    act(() => {
      useGraphStore.setState({ workspaces: [], activeWorkspaceId: 'missing' });
    });
    const { result } = renderHook(() => useDerivedGraph());

    expect(result.current.graph).toEqual({ nodes: [], edges: [], tags: [] });
    expect(result.current.visibleNodes).toHaveLength(0);
    expect(result.current.statistics.nodeCount).toBe(0);
  });
});
