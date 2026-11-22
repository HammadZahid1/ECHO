import type { ExportOptions, ExportResult, GraphData } from '@/types';
import { selectExportGraph } from './json';
import { projectGraph } from './projection';
import { safeFilename } from '@/lib/utils/download';

const escapeXml = (value: string): string =>
  value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char] ?? char);

export function exportSvg(graph: GraphData, options: ExportOptions, name = 'ECHO graph'): ExportResult {
  const scoped = selectExportGraph(graph, options);
  const projection = projectGraph(scoped);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${projection.width}" height="${projection.height}" viewBox="0 0 ${projection.width} ${projection.height}">`,
    `<rect width="100%" height="100%" fill="#08090b"/>`,
    `<title>${escapeXml(name)}</title>`,
  ];
  for (const edge of projection.edges) {
    parts.push(`<line x1="${edge.x1.toFixed(1)}" y1="${edge.y1.toFixed(1)}" x2="${edge.x2.toFixed(1)}" y2="${edge.y2.toFixed(1)}" stroke="${edge.color}" stroke-opacity="${(0.2 + edge.strength * 0.5).toFixed(2)}" stroke-width="${(0.6 + edge.strength * 1.8).toFixed(2)}"/>`);
  }
  for (const node of projection.nodes) {
    parts.push(`<circle cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="${node.radius.toFixed(1)}" fill="${node.color}" fill-opacity="0.22" stroke="${node.color}" stroke-width="1.4"/>`);
    if (options.nodeIds === undefined || options.scope === 'all' || options.pretty) {
      parts.push(`<text x="${(node.x + node.radius + 5).toFixed(1)}" y="${(node.y + 3).toFixed(1)}" font-family="sans-serif" font-size="11" fill="#c9ced6">${escapeXml(node.title)}</text>`);
    }
  }
  parts.push('</svg>');
  return {
    filename: options.filename ?? `${safeFilename(name)}.svg`,
    mimeType: 'image/svg+xml',
    content: parts.join('\n'),
    nodeCount: scoped.nodes.length,
    edgeCount: scoped.edges.length,
  };
}
