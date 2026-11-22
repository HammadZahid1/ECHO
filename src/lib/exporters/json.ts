import type { ExportOptions, ExportResult, GraphData } from '@/types';
import { applyFilters } from '@/lib/graph/filters';
import { safeFilename } from '@/lib/utils/download';

export function selectExportGraph(graph: GraphData, options: ExportOptions): GraphData {
  if (options.scope === 'all') return graph;
  if (options.scope === 'selected') {
    const ids = new Set(options.nodeIds ?? []);
    return { ...graph, nodes: graph.nodes.filter((node) => ids.has(node.id)), edges: graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)) };
  }
  if (options.scope === 'cluster') return applyFilters(graph, { clusterNodeIds: options.nodeIds ?? [] });
  return applyFilters(graph, {});
}

export function exportJson(graph: GraphData, options: ExportOptions, name = 'echo-graph'): ExportResult {
  const scoped = selectExportGraph(graph, options);
  const payload: Record<string, unknown> = {
    format: 'echo-graph',
    version: 1,
    exportedAt: Date.now(),
    name,
    nodes: scoped.nodes.map((node) => ({
      ...node,
      position: options.includePositions ? node.position : undefined,
      createdAt: options.includeTimestamps ? node.createdAt : undefined,
      updatedAt: options.includeTimestamps ? node.updatedAt : undefined,
      metadata: options.includeMetadata ? node.metadata : undefined,
    })),
    edges: scoped.edges.map((edge) => ({
      ...edge,
      createdAt: options.includeTimestamps ? edge.createdAt : undefined,
      updatedAt: options.includeTimestamps ? edge.updatedAt : undefined,
      metadata: options.includeMetadata ? edge.metadata : undefined,
    })),
    tags: scoped.tags,
  };
  if (!options.includePositions) {
    for (const node of payload.nodes as Record<string, unknown>[]) delete node.position;
  }
  if (!options.includeTimestamps) {
    for (const node of payload.nodes as Record<string, unknown>[]) {
      delete node.createdAt;
      delete node.updatedAt;
    }
    for (const edge of payload.edges as Record<string, unknown>[]) {
      delete edge.createdAt;
      delete edge.updatedAt;
    }
  }
  if (!options.includeMetadata) {
    for (const node of payload.nodes as Record<string, unknown>[]) delete node.metadata;
    for (const edge of payload.edges as Record<string, unknown>[]) delete edge.metadata;
  }
  return {
    filename: options.filename ?? `${safeFilename(name)}.json`,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, options.pretty ? 2 : 0),
    nodeCount: scoped.nodes.length,
    edgeCount: scoped.edges.length,
  };
}
