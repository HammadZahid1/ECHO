import type { ExportOptions, ExportResult, GraphData } from '@/types';
import { selectExportGraph } from './json';
import { NODE_TYPE_INFO, RELATIONSHIP_TYPE_INFO } from '@/lib/graph/registry';
import { safeFilename } from '@/lib/utils/download';
import { formatDate } from '@/lib/utils/time';

/** Human-readable knowledge base export with back-links. */
export function exportMarkdown(graph: GraphData, options: ExportOptions, name = 'ECHO knowledge base'): ExportResult {
  const scoped = selectExportGraph(graph, options);
  const nodeById = new Map(scoped.nodes.map((node) => [node.id, node]));
  const lines: string[] = [`# ${name}`, '', `${scoped.nodes.length} nodes · ${scoped.edges.length} relationships`, ''];

  for (const node of scoped.nodes) {
    lines.push(`## ${node.title}`, '');
    lines.push(`_${NODE_TYPE_INFO[node.type].label} · importance ${Math.round(node.importance * 100)}%_`, '');
    if (node.description) lines.push(node.description, '');
    if (node.tags.length > 0) lines.push(`Tags: ${node.tags.map((tag) => `[[#${tag}]]`).join(' ')}`, '');
    if (node.source) lines.push(`Source: ${node.source}`, '');
    if (options.includeTimestamps) lines.push(`Created ${formatDate(node.createdAt)} · Updated ${formatDate(node.updatedAt)}`, '');
    if (options.includeMetadata && Object.keys(node.metadata).length > 0) {
      lines.push('Metadata:', '');
      for (const [key, value] of Object.entries(node.metadata)) lines.push(`- ${key}: ${String(value ?? '')}`);
      lines.push('');
    }
    const related = scoped.edges.filter((edge) => edge.source === node.id || edge.target === node.id);
    if (related.length > 0) {
      lines.push('Relationships:', '');
      for (const edge of related) {
        const otherId = edge.source === node.id ? edge.target : edge.source;
        const other = nodeById.get(otherId);
        if (!other) continue;
        const direction = edge.directed && edge.target === otherId ? '→ ' : edge.directed ? '← ' : '↔ ';
        lines.push(`- ${direction}[[${other.title}]] — ${edge.label} (${RELATIONSHIP_TYPE_INFO[edge.type].label}, ${Math.round(edge.strength * 100)}%)`);
      }
      lines.push('');
    }
  }

  return {
    filename: options.filename ?? `${safeFilename(name)}.md`,
    mimeType: 'text/markdown',
    content: lines.join('\n'),
    nodeCount: scoped.nodes.length,
    edgeCount: scoped.edges.length,
  };
}
