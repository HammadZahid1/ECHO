import type { GraphData, NeighborhoodResult } from '@/types';
import { buildAdjacency, type AdjacencyMap } from './adjacency';

export interface VisitContext {
  nodeId: string;
  depth: number;
  viaEdgeId?: string;
}

/** Breadth-first traversal from a seed set; returns discovery order. */
export function breadthFirst(
  adjacency: AdjacencyMap,
  seeds: string[],
  options: { maxDepth?: number; onVisit?: (context: VisitContext) => void } = {},
): VisitContext[] {
  const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;
  const visited = new Set<string>(seeds);
  const queue: VisitContext[] = seeds.map((nodeId) => ({ nodeId, depth: 0 }));
  const result: VisitContext[] = [];
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    result.push(current);
    const atLimit = current.depth >= maxDepth;
    options.onVisit?.(current);
    if (atLimit) continue;
    for (const ref of adjacency.all.get(current.nodeId) ?? []) {
      if (visited.has(ref.other)) continue;
      visited.add(ref.other);
      queue.push({ nodeId: ref.other, depth: current.depth + 1, viaEdgeId: ref.edge.id });
    }
  }
  return result;
}

/** Depth-first traversal with an explicit stack (no recursion limit). */
export function depthFirst(adjacency: AdjacencyMap, start: string, onVisit?: (context: VisitContext) => void): VisitContext[] {
  const visited = new Set<string>([start]);
  const stack: VisitContext[] = [{ nodeId: start, depth: 0 }];
  const result: VisitContext[] = [];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    result.push(current);
    onVisit?.(current);
    const refs = adjacency.all.get(current.nodeId) ?? [];
    for (let i = refs.length - 1; i >= 0; i -= 1) {
      const ref = refs[i];
      if (visited.has(ref.other)) continue;
      visited.add(ref.other);
      stack.push({ nodeId: ref.other, depth: current.depth + 1, viaEdgeId: ref.edge.id });
    }
  }
  return result;
}

/** Connected components of the undirected projection of the graph. */
export function connectedComponents(graph: GraphData): string[][] {
  const adjacency = buildAdjacency(graph);
  const unvisited = new Set(graph.nodes.map((node) => node.id));
  const components: string[][] = [];
  while (unvisited.size > 0) {
    const seed = unvisited.values().next().value as string;
    const visited = breadthFirst(adjacency, [seed]);
    const component = visited.map((entry) => entry.nodeId);
    for (const id of component) unvisited.delete(id);
    components.push(component);
  }
  return components.sort((a, b) => b.length - a.length);
}

/** Node ids reachable within N hops and the edges that connect them. */
export function neighborhood(graph: GraphData, centerId: string, depth = 1): NeighborhoodResult {
  const adjacency = buildAdjacency(graph);
  const visited = new Set<string>([centerId]);
  const byDepth: string[][] = [[centerId]];
  const edges: NeighborhoodResult['edges'] = [];

  for (let d = 1; d <= depth; d += 1) {
    const frontier: string[] = [];
    for (const nodeId of byDepth[d - 1] ?? []) {
      for (const ref of adjacency.all.get(nodeId) ?? []) {
        if (!edges.some((entry) => entry.edgeId === ref.edge.id)) {
          edges.push({ edgeId: ref.edge.id, source: ref.edge.source, target: ref.edge.target, depth: d });
        }
        if (visited.has(ref.other)) continue;
        visited.add(ref.other);
        frontier.push(ref.other);
      }
    }
    if (frontier.length === 0) break;
    byDepth.push(frontier);
  }

  return { centerId, depth, nodeIds: [...visited], edges, byDepth };
}

export function reachableWithin(graph: GraphData, start: string, depth: number): Set<string> {
  return new Set(breadthFirst(buildAdjacency(graph), [start], { maxDepth: depth }).map((entry) => entry.nodeId));
}
