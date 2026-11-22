import type { GraphData } from '@/types';
import { clamp } from '@/lib/utils/math';

export interface ProjectedNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  title: string;
}

export interface ProjectedEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strength: number;
  label: string;
}

export interface GraphProjection {
  width: number;
  height: number;
  nodes: ProjectedNode[];
  edges: ProjectedEdge[];
}

/** Projects graph positions into a padded 2D viewport for SVG/PNG export. */
export function projectGraph(graph: GraphData, width = 1600, height = 1000, padding = 80): GraphProjection {
  if (graph.nodes.length === 0) return { width, height, nodes: [], edges: [] };
  const xs = graph.nodes.map((node) => node.position.x);
  const ys = graph.nodes.map((node) => node.position.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  const projected = new Map<string, ProjectedNode>();
  for (const node of graph.nodes) {
    const point: ProjectedNode = {
      id: node.id,
      x: offsetX + (node.position.x - minX) * scale,
      y: offsetY + (node.position.y - minY) * scale,
      radius: clamp(5 + node.importance * 11, 5, 18),
      color: node.color ?? '#4fd8e8',
      title: node.title,
    };
    projected.set(node.id, point);
  }
  const edges: ProjectedEdge[] = [];
  for (const edge of graph.edges) {
    const source = projected.get(edge.source);
    const target = projected.get(edge.target);
    if (!source || !target) continue;
    edges.push({
      id: edge.id,
      x1: source.x, y1: source.y, x2: target.x, y2: target.y,
      color: '#4a5561',
      strength: edge.strength,
      label: edge.label,
    });
  }
  return { width, height, nodes: [...projected.values()], edges };
}
