import { useMemo } from 'react';
import type { GraphData } from '@/types';
import { useGraphStore } from '@/store/graphStore';
import { deriveGraph } from '@/store/selectors';
import { computeStatistics } from '@/lib/graph/stats';
import { analyzeGraphHealth } from '@/lib/graph/health';
import { labelPropagationClusters } from '@/lib/graph/clusters';

export function useGraphStatistics(graph: GraphData) {
  return useMemo(() => computeStatistics(graph), [graph]);
}

export function useGraphHealth(graph: GraphData) {
  return useMemo(() => analyzeGraphHealth(graph), [graph]);
}

export function useClusters(graph: GraphData) {
  return useMemo(() => labelPropagationClusters(graph), [graph]);
}

export function useDerivedGraph() {
  const graph = useGraphStore((state) => state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)?.graph);
  const filters = useGraphStore((state) => state.filters);
  return useMemo(() => deriveGraph(graph ?? { nodes: [], edges: [], tags: [] }, filters), [graph, filters]);
}
