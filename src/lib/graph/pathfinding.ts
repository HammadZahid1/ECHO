import type { GraphData, PathResult, PathSearchResult } from '@/types';
import { buildAdjacency } from './adjacency';

function assemble(graph: GraphData, nodeIds: string[]): PathResult | null {
  const edgeIds: string[] = [];
  const relationshipTypes: PathResult['relationshipTypes'] = [];
  let totalStrength = 0;
  for (let i = 0; i < nodeIds.length - 1; i += 1) {
    const from = nodeIds[i];
    const to = nodeIds[i + 1];
    const edge = graph.edges.find(
      (candidate) =>
        (candidate.source === from && candidate.target === to) ||
        (candidate.source === to && candidate.target === from),
    );
    if (!edge) return null;
    edgeIds.push(edge.id);
    relationshipTypes.push(edge.type);
    totalStrength += edge.strength;
  }
  return {
    nodeIds,
    edgeIds,
    length: nodeIds.length - 1,
    totalStrength,
    relationshipTypes,
  };
}

/** Shortest unweighted path using BFS over the undirected graph projection. */
export function shortestPath(graph: GraphData, from: string, to: string): PathResult | null {
  if (from === to) return assemble(graph, [from]);
  const adjacency = buildAdjacency(graph);
  if (!adjacency.all.has(from) || !adjacency.all.has(to)) return null;
  const previous = new Map<string, string>();
  const queue = [from];
  const visited = new Set([from]);
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    for (const ref of adjacency.all.get(current) ?? []) {
      if (visited.has(ref.other)) continue;
      visited.add(ref.other);
      previous.set(ref.other, current);
      if (ref.other === to) {
        const path = [to];
        let cursor = to;
        while (cursor !== from) {
          const parent = previous.get(cursor);
          if (!parent) return null;
          path.unshift(parent);
          cursor = parent;
        }
        return assemble(graph, path);
      }
      queue.push(ref.other);
    }
  }
  return null;
}

/** Enumerates simple paths up to a maximum length, ordered by length then strength. */
export function findPaths(
  graph: GraphData,
  from: string,
  to: string,
  options: { maxLength?: number; limit?: number } = {},
): PathSearchResult {
  const maxLength = options.maxLength ?? 6;
  const limit = options.limit ?? 5;
  const adjacency = buildAdjacency(graph);
  const paths: PathResult[] = [];
  let explored = 0;
  if (!adjacency.all.has(from) || !adjacency.all.has(to)) {
    return { paths: [], from, to, found: false, explored };
  }

  const stack: { nodeId: string; path: string[] }[] = [{ nodeId: from, path: [from] }];
  while (stack.length > 0 && paths.length < limit * 4) {
    const current = stack.pop();
    if (!current) break;
    explored += 1;
    if (current.path.length - 1 > maxLength) continue;
    for (const ref of adjacency.all.get(current.nodeId) ?? []) {
      if (current.path.includes(ref.other)) continue;
      const nextPath = [...current.path, ref.other];
      if (ref.other === to) {
        const result = assemble(graph, nextPath);
        if (result) paths.push(result);
        continue;
      }
      if (nextPath.length - 1 < maxLength) stack.push({ nodeId: ref.other, path: nextPath });
    }
  }

  const unique = new Map<string, PathResult>();
  for (const path of paths) unique.set(path.nodeIds.join('>'), path);
  const ranked = [...unique.values()]
    .sort((a, b) => a.length - b.length || b.totalStrength - a.totalStrength)
    .slice(0, limit);

  return { paths: ranked, from, to, found: ranked.length > 0, explored };
}

/** Ranks intermediate nodes by how often they appear across candidate paths. */
export function pathWaypoints(paths: PathResult[]): { nodeId: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const path of paths) {
    for (const nodeId of path.nodeIds.slice(1, -1)) counts.set(nodeId, (counts.get(nodeId) ?? 0) + 1);
  }
  return [...counts.entries()].map(([nodeId, count]) => ({ nodeId, count })).sort((a, b) => b.count - a.count);
}
