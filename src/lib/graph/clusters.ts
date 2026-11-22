import type { ClusterAnalysis, GraphCluster, GraphData, GraphStatistics } from '@/types';
import { buildAdjacency } from './adjacency';
import { connectedComponents } from './traverse';
import { computeStatistics } from './stats';
import { uniqueTokens, normalizeText } from '@/lib/utils/text';
import { colorForString } from '@/lib/utils/color';
import { hashString } from '@/lib/utils/math';

function clusterFromIds(
  id: string,
  nodeIds: string[],
  method: GraphCluster['method'],
  graph: GraphData,
  name: string,
): GraphCluster {
  const idSet = new Set(nodeIds);
  const internalEdges = graph.edges.filter((edge) => idSet.has(edge.source) && idSet.has(edge.target));
  const possible = nodeIds.length > 1 ? (nodeIds.length * (nodeIds.length - 1)) / 2 : 1;
  const keywords = [...new Set(
    nodeIds
      .map((nodeId) => graph.nodes.find((node) => node.id === nodeId))
      .filter((node): node is NonNullable<typeof node> => Boolean(node))
      .flatMap((node) => [...node.tags, ...uniqueTokens(node.title).slice(0, 3)]),
  )].slice(0, 6);
  return {
    id,
    name,
    method,
    nodeIds,
    color: colorForString(id),
    keywords,
    size: nodeIds.length,
    density: Math.min(1, internalEdges.length / possible),
    collapsed: false,
  };
}

export function componentClusters(graph: GraphData): ClusterAnalysis {
  const components = connectedComponents(graph);
  return {
    method: 'component',
    modularity: estimateModularity(graph, components),
    clusters: components.map((nodeIds, index) =>
      clusterFromIds(`component-${index}`, nodeIds, 'component', graph, nodeIds.length ? nameForNodes(graph, nodeIds, `Cluster ${index + 1}`) : 'Empty cluster')),
  };
}

/** Asynchronous-style label propagation over the local graph (deterministic sweep order). */
export function labelPropagationClusters(graph: GraphData, iterations = 12): ClusterAnalysis {
  if (graph.nodes.length === 0) return { clusters: [], method: 'label-propagation', modularity: 0 };
  const adjacency = buildAdjacency(graph);
  const labels = new Map<string, string>(graph.nodes.map((node) => [node.id, node.id]));
  const order = graph.nodes.map((node) => node.id);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let changed = false;
    for (const nodeId of order) {
      const counts = new Map<string, number>();
      for (const ref of adjacency.all.get(nodeId) ?? []) {
        const label = labels.get(ref.other);
        if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      if (counts.size === 0) continue;
      const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
      if (labels.get(nodeId) !== best) {
        labels.set(nodeId, best);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const groups = new Map<string, string[]>();
  for (const nodeId of order) {
    const label = labels.get(nodeId) ?? nodeId;
    groups.set(label, [...(groups.get(label) ?? []), nodeId]);
  }
  const clusters = [...groups.values()]
    .filter((ids) => ids.length > 0)
    .sort((a, b) => b.length - a.length)
    .map((ids, index) => clusterFromIds(`community-${index}`, ids, 'label-propagation', graph, nameForNodes(graph, ids, `Community ${index + 1}`)));
  return { clusters, method: 'label-propagation', modularity: estimateModularity(graph, clusters.map((cluster) => cluster.nodeIds)) };
}

export function tagClusters(graph: GraphData): ClusterAnalysis {
  const groups = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const tags = node.tags.length > 0 ? node.tags : ['untagged'];
    for (const tag of tags) groups.set(tag, [...(groups.get(tag) ?? []), node.id]);
  }
  const clusters = [...groups.entries()]
    .filter(([, ids]) => ids.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tag, ids]) => clusterFromIds(`tag-${normalizeText(tag)}`, ids, 'tag', graph, tag));
  return { clusters, method: 'tag', modularity: estimateModularity(graph, clusters.map((cluster) => cluster.nodeIds)) };
}

export function similarityClusters(graph: GraphData, threshold = 0.28): ClusterAnalysis {
  const parent = new Map<string, string>(graph.nodes.map((node) => [node.id, node.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    return root;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  const tokenSets = graph.nodes.map((node) => new Set(uniqueTokens(`${node.title} ${node.description}`)));
  const tagSets = graph.nodes.map((node) => new Set(node.tags));
  for (let i = 0; i < graph.nodes.length; i += 1) {
    for (let j = i + 1; j < graph.nodes.length; j += 1) {
      const a = tokenSets[i];
      const b = tokenSets[j];
      if (!a || !b) continue;
      let overlap = 0;
      for (const token of a) if (b.has(token)) overlap += 1;
      const unionSize = new Set([...a, ...b]).size || 1;
      let sharedTags = 0;
      for (const tag of tagSets[i] ?? []) if (tagSets[j]?.has(tag)) sharedTags += 1;
      const score = overlap / unionSize + sharedTags * 0.18;
      if (score >= threshold) union(graph.nodes[i].id, graph.nodes[j].id);
    }
  }
  const groups = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const root = find(node.id);
    groups.set(root, [...(groups.get(root) ?? []), node.id]);
  }
  const clusters = [...groups.values()]
    .sort((a, b) => b.length - a.length)
    .map((ids, index) => clusterFromIds(`similarity-${index}`, ids, 'similarity', graph, nameForNodes(graph, ids, `Theme ${index + 1}`)));
  return { clusters, method: 'similarity', modularity: estimateModularity(graph, clusters.map((cluster) => cluster.nodeIds)) };
}

export function neighborhoodClusters(graph: GraphData, focusNodeId: string, depth = 1): ClusterAnalysis {
  const adjacency = buildAdjacency(graph);
  const queue = [focusNodeId];
  const seen = new Set([focusNodeId]);
  for (let d = 0; d < depth; d += 1) {
    const next: string[] = [];
    for (const id of queue) {
      for (const ref of adjacency.all.get(id) ?? []) {
        if (!seen.has(ref.other)) {
          seen.add(ref.other);
          next.push(ref.other);
        }
      }
    }
    queue.splice(0, queue.length, ...next);
  }
  const focus = graph.nodes.find((node) => node.id === focusNodeId);
  return {
    method: 'neighborhood',
    modularity: 0,
    clusters: [clusterFromIds(`neighborhood-${hashString(focusNodeId)}`, [...seen], 'neighborhood', graph, focus ? `${focus.title} neighborhood` : 'Neighborhood')],
  };
}

export function nameForNodes(graph: GraphData, nodeIds: string[], fallback: string): string {
  const names = nodeIds
    .map((id) => graph.nodes.find((node) => node.id === id)?.title)
    .filter((title): title is string => Boolean(title))
    .sort((a, b) => a.length - b.length);
  if (names.length === 0) return fallback;
  const primary = names[0];
  return names.length > 1 ? `${primary} +${names.length - 1}` : primary;
}

/** Fraction of edges that fall within a proposed partition (transparency-oriented proxy). */
export function estimateModularity(graph: GraphData, groups: string[][]): number {
  if (graph.edges.length === 0) return 0;
  const groupOf = new Map<string, number>();
  groups.forEach((ids, index) => ids.forEach((id) => groupOf.set(id, index)));
  let internal = 0;
  for (const edge of graph.edges) {
    if (groupOf.get(edge.source) !== undefined && groupOf.get(edge.source) === groupOf.get(edge.target)) internal += 1;
  }
  return internal / graph.edges.length;
}

export function clusterStatistics(graph: GraphData, statistics: GraphStatistics = computeStatistics(graph)): {
  largest: number;
  averageSize: number;
  total: number;
} {
  return {
    largest: statistics.largestClusterSize,
    averageSize: statistics.nodeCount === 0 ? 0 : statistics.nodeCount / Math.max(1, statistics.clusterCount),
    total: statistics.clusterCount,
  };
}
