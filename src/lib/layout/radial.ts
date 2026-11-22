import type { Vec3 } from '@/types';
import type { LayoutOptions, PositionMap } from './types';
import { buildAdjacency } from '@/lib/graph/adjacency';
import { breadthFirst } from '@/lib/graph/traverse';
import { seededRandom } from '@/lib/utils/math';

/** Concentric rings around a focus node, optionally ordered by graph distance. */
export function radialLayout(options: LayoutOptions): PositionMap {
  const { graph, focusNodeId, radius = 30, dimensions = 3 } = options;
  const positions: PositionMap = new Map();
  if (graph.nodes.length === 0) return positions;
  const focus = focusNodeId && graph.nodes.some((node) => node.id === focusNodeId)
    ? focusNodeId
    : graph.nodes.reduce((best, node) => {
      const adjacency = buildAdjacency(graph);
      return (adjacency.degree.get(node.id) ?? 0) > (adjacency.degree.get(best) ?? 0) ? node.id : best;
    }, graph.nodes[0].id);

  positions.set(focus, { x: 0, y: 0, z: 0 });
  const adjacency = buildAdjacency(graph);
  const visited = breadthFirst(adjacency, [focus]).filter((entry) => entry.nodeId !== focus);
  const byRing = new Map<number, string[]>();
  for (const entry of visited) {
    const level = Math.min(6, entry.depth);
    byRing.set(level, [...(byRing.get(level) ?? []), entry.nodeId]);
  }
  for (const node of graph.nodes) {
    if (!positions.has(node.id)) byRing.set(3, [...(byRing.get(3) ?? []), node.id]);
  }

  const random = seededRandom(options.seed ?? 7);
  for (const [level, ids] of byRing) {
    const ringRadius = (level / 3) * radius;
    ids.forEach((id, index) => {
      const angle = (index / Math.max(1, ids.length)) * Math.PI * 2 + level * 0.3;
      const jitter = (random() - 0.5) * ringRadius * 0.08;
      const position: Vec3 = {
        x: Math.cos(angle) * (ringRadius + jitter),
        y: dimensions === 2 ? 0 : Math.sin(angle * 2 + level) * ringRadius * 0.18,
        z: Math.sin(angle) * (ringRadius + jitter),
      };
      positions.set(id, position);
    });
  }
  return positions;
}
