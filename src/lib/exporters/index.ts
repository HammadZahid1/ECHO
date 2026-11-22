import type { ExportOptions, ExportResult, GraphData, GraphSnapshot, GraphWorkspace } from '@/types';
import { exportJson } from './json';
import { exportEdgesCsv, exportNodesCsv } from './csv';
import { exportMarkdown } from './markdown';
import { exportSvg } from './svg';
import { exportPng } from './png';
import { safeFilename } from '@/lib/utils/download';

export * from './json';
export * from './csv';
export * from './markdown';
export * from './projection';
export * from './svg';
export * from './png';

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'json',
  scope: 'all',
  includeMetadata: true,
  includePositions: true,
  includeTimestamps: true,
  pretty: true,
};

export async function exportGraph(graph: GraphData, options: ExportOptions = DEFAULT_EXPORT_OPTIONS, name = 'echo-graph'): Promise<ExportResult> {
  switch (options.format) {
    case 'csv-nodes': return exportNodesCsv(graph, options, name);
    case 'csv-edges': return exportEdgesCsv(graph, options, name);
    case 'markdown': return exportMarkdown(graph, options, name);
    case 'svg': return exportSvg(graph, options, name);
    case 'png': return exportPng(graph, options, name);
    case 'json':
    default: return exportJson(graph, options, name);
  }
}

export function exportWorkspace(workspace: GraphWorkspace, options: ExportOptions = DEFAULT_EXPORT_OPTIONS): ExportResult {
  const payload = {
    format: 'echo-workspace',
    version: 1,
    exportedAt: Date.now(),
    workspace: {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      color: workspace.color,
      settings: options.includeMetadata ? workspace.settings : undefined,
      graph: workspace.graph,
      collections: workspace.collections,
      snapshots: options.includeTimestamps ? workspace.snapshots : undefined,
      camera: workspace.camera,
    },
  };
  return {
    filename: options.filename ?? `${safeFilename(workspace.name)}.echo-workspace.json`,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, options.pretty ? 2 : 0),
    nodeCount: workspace.graph.nodes.length,
    edgeCount: workspace.graph.edges.length,
  };
}

export function exportSnapshot(snapshot: GraphSnapshot, options: ExportOptions = DEFAULT_EXPORT_OPTIONS): ExportResult {
  const payload = {
    format: 'echo-snapshot',
    version: 1,
    exportedAt: Date.now(),
    snapshot,
  };
  return {
    filename: options.filename ?? `${safeFilename(snapshot.name)}.echo-snapshot.json`,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, options.pretty ? 2 : 0),
    nodeCount: snapshot.graph.nodes.length,
    edgeCount: snapshot.graph.edges.length,
  };
}
