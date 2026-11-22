import type { LayoutOptions, PositionMap } from './types';
import { buildAdjacency } from '@/lib/graph/adjacency';
import { breadthFirst } from '@/lib/graph/traverse';

/** Layered layout using directed edges as parent → child relationships. */
export function hierarchicalLayout(options: LayoutOptions): PositionMap {
  const { graph, dimensions = 2, radius = 18 } = options;
  const positions: PositionMap = new Map();
  if (graph.nodes.length === 0) return positions;
  const adjacency = buildAdjacency(graph);
  const hasParent = new Set(graph.edges.filter((edge) => edge.directed && edge.source !== edge.target).map((edge) => edge.target));
  let roots = graph.nodes.filter((node) => !hasParent.has(node.id)).map((node) => node.id);
  if (roots.length === 0) roots = [graph.nodes[0].id];

  const layers = new Map<string, number>();
  breadthFirst(adjacency, roots).forEach((entry) => layers.set(entry.nodeId, entry.depth));
  for (const node of graph.nodes) if (!layers.has(node.id)) layers.set(node.id, 0);

  const byLayer = new Map<number, string[]>();
  for (const [id, depth] of layers) byLayer.set(depth, [...(byLayer.get(depth) ?? []), id]);
  const maxDepth = Math.max(...byLayer.keys());

  for (const [depth, ids] of byLayer) {
    ids.forEach((id, index) => {
      const width = (index - (ids.length - 1) / 2) * radius;
      positions.set(id, {
        x: width,
        y: dimensions === 2 ? (maxDepth / 2 - depth) * radius : (maxDepth / 2 - depth) * radius * 0.6,
        z: dimensions === 2 ? 0 : (index - (ids.length - 1) / 2) * radius * 0.35,
      });
    });
  }
  return positions;
}
