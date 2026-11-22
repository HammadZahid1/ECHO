import type { ExportOptions, ExportResult, GraphData } from '@/types';
import { selectExportGraph } from './json';
import { projectGraph } from './projection';
import { safeFilename } from '@/lib/utils/download';

/** Draws the current 2D projection onto a supplied canvas context. */
export function drawGraphToCanvas(graph: GraphData, context: CanvasRenderingContext2D, width: number, height: number): void {
  const projection = projectGraph(graph, width, height, Math.min(width, height) * 0.08);
  context.fillStyle = '#08090b';
  context.fillRect(0, 0, width, height);
  for (const edge of projection.edges) {
    context.beginPath();
    context.moveTo(edge.x1, edge.y1);
    context.lineTo(edge.x2, edge.y2);
    context.strokeStyle = `rgba(120, 140, 160, ${0.18 + edge.strength * 0.45})`;
    context.lineWidth = 0.6 + edge.strength * 1.8;
    context.stroke();
  }
  for (const node of projection.nodes) {
    context.beginPath();
    context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    context.fillStyle = `${node.color}44`;
    context.fill();
    context.strokeStyle = node.color;
    context.lineWidth = 1.4;
    context.stroke();
    context.fillStyle = '#c9ced6';
    context.font = '11px sans-serif';
    context.fillText(node.title, node.x + node.radius + 5, node.y + 3);
  }
}

export async function exportPng(graph: GraphData, options: ExportOptions, name = 'ECHO graph'): Promise<ExportResult> {
  const scoped = selectExportGraph(graph, options);
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1000;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable in this browser');
  drawGraphToCanvas(scoped, context, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG encoding failed')), 'image/png');
  });
  return {
    filename: options.filename ?? `${safeFilename(name)}.png`,
    mimeType: 'image/png',
    content: blob,
    nodeCount: scoped.nodes.length,
    edgeCount: scoped.edges.length,
  };
}
