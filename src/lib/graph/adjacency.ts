import type { GraphData, KnowledgeEdge } from '@/types';

export interface EdgeRef {
  edge: KnowledgeEdge;
  other: string;
}

export interface AdjacencyMap {
  out: Map<string, EdgeRef[]>;
  incoming: Map<string, EdgeRef[]>;
  all: Map<string, EdgeRef[]>;
  degree: Map<string, number>;
}

function push(map: Map<string, EdgeRef[]>, key: string, value: EdgeRef): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/** Builds directed and undirected adjacency indexes in one pass. */
export function buildAdjacency(graph: GraphData): AdjacencyMap {
  const out = new Map<string, EdgeRef[]>();
  const incoming = new Map<string, EdgeRef[]>();
  const all = new Map<string, EdgeRef[]>();
  const degree = new Map<string, number>();

  for (const node of graph.nodes) {
    out.set(node.id, []);
    incoming.set(node.id, []);
    all.set(node.id, []);
    degree.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    if (!degree.has(edge.source) || !degree.has(edge.target)) continue;
    const forward: EdgeRef = { edge, other: edge.target };
    const backward: EdgeRef = { edge, other: edge.source };
    push(out, edge.source, forward);
    push(incoming, edge.target, backward);
    push(all, edge.source, forward);
    push(all, edge.target, backward);
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    if (edge.source !== edge.target) degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    else degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }

  return { out, incoming, all, degree };
}

export function neighbors(adjacency: AdjacencyMap, nodeId: string): string[] {
  return (adjacency.all.get(nodeId) ?? []).map((ref) => ref.other);
}

export function outgoingNeighbors(adjacency: AdjacencyMap, nodeId: string): string[] {
  return (adjacency.out.get(nodeId) ?? []).map((ref) => ref.other);
}

export function nodeDegree(adjacency: AdjacencyMap, nodeId: string): number {
  return adjacency.degree.get(nodeId) ?? 0;
}

export function edgeBetween(graph: GraphData, a: string, b: string): KnowledgeEdge | undefined {
  return graph.edges.find(
    (edge) => (edge.source === a && edge.target === b) || (edge.source === b && edge.target === a),
  );
}
