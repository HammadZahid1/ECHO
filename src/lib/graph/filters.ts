import type { GraphData, KnowledgeNode, SearchFilters } from '@/types';
import { buildAdjacency } from './adjacency';
import { normalizeText } from '@/lib/utils/text';

export interface GraphFilterState extends Partial<SearchFilters> {
  collectionId?: string | null;
  clusterNodeIds?: string[] | null;
  query?: string;
  hiddenNodeIds?: string[];
}

/** Returns the subset of nodes matching all active filters. */
export function filterNodes(graph: GraphData, filters: GraphFilterState = {}): KnowledgeNode[] {
  const adjacency = buildAdjacency(graph);
  const query = normalizeText(filters.query ?? '');
  const clusterSet = filters.clusterNodeIds ? new Set(filters.clusterNodeIds) : null;
  const hidden = new Set(filters.hiddenNodeIds ?? []);

  return graph.nodes.filter((node) => {
    if (hidden.has(node.id)) return false;
    if (filters.types?.length && !filters.types.includes(node.type)) return false;
    if (filters.tags?.length && !filters.tags.some((tag) => node.tags.includes(tag))) return false;
    if (filters.minImportance !== undefined && node.importance < filters.minImportance) return false;
    if (filters.createdAfter !== undefined && node.createdAt < filters.createdAfter) return false;
    if (filters.modifiedAfter !== undefined && node.updatedAt < filters.modifiedAfter) return false;
    if (filters.onlyConnected && (adjacency.degree.get(node.id) ?? 0) === 0) return false;
    if (filters.collectionId && !node.collectionIds.includes(filters.collectionId)) return false;
    if (clusterSet && !clusterSet.has(node.id)) return false;
    if (query) {
      const haystack = normalizeText(`${node.title} ${node.description} ${node.tags.join(' ')} ${node.type}`);
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/** Filters edges to those whose endpoints survive filtering. */
export function filterEdges(graph: GraphData, visibleNodeIds: Set<string>): GraphData['edges'] {
  return graph.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
}

export function applyFilters(graph: GraphData, filters: GraphFilterState = {}): GraphData {
  const nodes = filterNodes(graph, filters);
  return { ...graph, nodes, edges: filterEdges(graph, new Set(nodes.map((node) => node.id))) };
}

export function collectAllTags(graph: GraphData): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const node of graph.nodes) {
    for (const tag of node.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function collectNodeTypes(graph: GraphData): GraphData['nodes'][number]['type'][] {
  return [...new Set(graph.nodes.map((node) => node.type))];
}
