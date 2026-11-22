import type { GraphData, ImportOptions, ImportResult } from '@/types';
import { normalizeGraph, DEFAULT_IMPORT_OPTIONS } from '@/lib/graph/validate';
import { createGraphData } from '@/lib/graph/factory';

export function importJson(text: string, options: ImportOptions = DEFAULT_IMPORT_OPTIONS): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      format: 'json',
      graph: createGraphData(),
      issues: [{ severity: 'error', code: 'json.parse', message: error instanceof Error ? error.message : 'Invalid JSON' }],
      importedNodes: 0,
      importedEdges: 0,
      skippedNodes: 0,
      skippedEdges: 0,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      format: 'json',
      graph: createGraphData(),
      issues: [{ severity: 'error', code: 'json.shape', message: 'Graph JSON must be an object with nodes and edges arrays' }],
      importedNodes: 0,
      importedEdges: 0,
      skippedNodes: 0,
      skippedEdges: 0,
    };
  }

  const record = parsed as Record<string, unknown>;
  const nested = (record.graph && typeof record.graph === 'object' ? record.graph : record) as Record<string, unknown>;
  const normalized = normalizeGraph(nested, options);
  const graph: GraphData = normalized.graph;
  const errors = normalized.issues.filter((issue) => issue.severity === 'error');
  const rawNodeCount = Array.isArray(nested.nodes) ? nested.nodes.length : 0;
  const rawEdgeCount = Array.isArray(nested.edges) ? nested.edges.length : 0;

  return {
    ok: errors.length === 0,
    format: 'json',
    graph,
    issues: [
      ...(typeof record.format === 'string' && record.format !== 'echo-graph'
        ? [{ severity: 'info' as const, code: 'json.format', message: `Imported from "${record.format}" format` }]
        : []),
      ...normalized.issues,
    ],
    importedNodes: graph.nodes.length,
    importedEdges: graph.edges.length,
    skippedNodes: Math.max(0, rawNodeCount - graph.nodes.length),
    skippedEdges: Math.max(0, rawEdgeCount - graph.edges.length),
  };
}
