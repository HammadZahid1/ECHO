import type { ExportOptions, ExportResult, GraphData } from '@/types';
import { selectExportGraph } from './json';
import { safeFilename } from '@/lib/utils/download';

function escapeCsv(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}

export function exportNodesCsv(graph: GraphData, options: ExportOptions, name = 'echo-nodes'): ExportResult {
  const scoped = selectExportGraph(graph, options);
  const header = ['id', 'title', 'description', 'type', 'tags', 'importance', 'color', 'source', 'references', 'x', 'y', 'z', 'createdAt', 'updatedAt'];
  const rows = scoped.nodes.map((node) => [
    node.id, node.title, node.description, node.type, node.tags.join('|'), node.importance,
    node.color ?? '', node.source ?? '', node.references.join('|'),
    options.includePositions ? node.position.x : '', options.includePositions ? node.position.y : '', options.includePositions ? node.position.z : '',
    options.includeTimestamps ? node.createdAt : '', options.includeTimestamps ? node.updatedAt : '',
  ]);
  return {
    filename: options.filename ?? `${safeFilename(name)}.csv`,
    mimeType: 'text/csv',
    content: toCsv(header, rows),
    nodeCount: scoped.nodes.length,
    edgeCount: 0,
  };
}

export function exportEdgesCsv(graph: GraphData, options: ExportOptions, name = 'echo-edges'): ExportResult {
  const scoped = selectExportGraph(graph, options);
  const header = ['id', 'source', 'target', 'type', 'label', 'directed', 'strength', 'description', 'createdAt'];
  const rows = scoped.edges.map((edge) => [
    edge.id, edge.source, edge.target, edge.type, edge.label, edge.directed, edge.strength,
    edge.description ?? '', options.includeTimestamps ? edge.createdAt : '',
  ]);
  return {
    filename: options.filename ?? `${safeFilename(name)}.csv`,
    mimeType: 'text/csv',
    content: toCsv(header, rows),
    nodeCount: scoped.nodes.length,
    edgeCount: scoped.edges.length,
  };
}
