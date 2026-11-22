import type { GraphData, GraphStatistics, KnowledgeNode } from '@/types';
import { computeStatistics } from '@/lib/graph/stats';
import { buildAdjacency } from '@/lib/graph/adjacency';
import { filterEdges, filterNodes, type GraphFilterState } from '@/lib/graph/filters';

export interface DerivedGraph {
  graph: GraphData;
  visibleNodes: KnowledgeNode[];
  statistics: GraphStatistics;
  adjacency: ReturnType<typeof buildAdjacency>;
}

/** Single-pass derivation used by views that need filtered graph + metrics. */
export function deriveGraph(graph: GraphData, filters: GraphFilterState = {}): DerivedGraph {
  const visibleNodes = filterNodes(graph, filters);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleGraph: GraphData = { ...graph, nodes: visibleNodes, edges: filterEdges(graph, visibleIds) };
  return {
    graph: visibleGraph,
    visibleNodes,
    statistics: computeStatistics(visibleGraph),
    adjacency: buildAdjacency(visibleGraph),
  };
}

export function selectedNodes(graph: GraphData, ids: string[]): KnowledgeNode[] {
  const set = new Set(ids);
  return graph.nodes.filter((node) => set.has(node.id));
}
