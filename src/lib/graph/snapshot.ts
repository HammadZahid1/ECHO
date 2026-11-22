import type { GraphData, GraphSnapshot, GraphStatistics } from '@/types';
import { computeStatistics } from './stats';

export interface GraphDiff {
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
  modifiedEdges: string[];
  statisticsBefore: Pick<GraphStatistics, 'nodeCount' | 'edgeCount' | 'averageDegree' | 'clusterCount' | 'density'>;
  statisticsAfter: Pick<GraphStatistics, 'nodeCount' | 'edgeCount' | 'averageDegree' | 'clusterCount' | 'density'>;
}

function pickStatistics(graph: GraphData): GraphDiff['statisticsBefore'] {
  const stats = computeStatistics(graph);
  return {
    nodeCount: stats.nodeCount,
    edgeCount: stats.edgeCount,
    averageDegree: stats.averageDegree,
    clusterCount: stats.clusterCount,
    density: stats.density,
  };
}

const NODE_FIELDS: (keyof GraphData['nodes'][number])[] = [
  'title', 'description', 'type', 'importance', 'color', 'source', 'pinned',
];

function nodeSignature(node: GraphData['nodes'][number]): string {
  return JSON.stringify({
    ...NODE_FIELDS.reduce<Record<string, unknown>>((acc, key) => ({ ...acc, [key]: node[key] }), {}),
    tags: [...node.tags].sort(),
    references: [...node.references].sort(),
    metadata: node.metadata,
  });
}

function edgeSignature(edge: GraphData['edges'][number]): string {
  return JSON.stringify({
    source: edge.source, target: edge.target, type: edge.type, label: edge.label,
    directed: edge.directed, strength: edge.strength, description: edge.description,
  });
}

/** Structural and property-level comparison of two graph states. */
export function compareGraphs(before: GraphData, after: GraphData): GraphDiff {
  const beforeNodes = new Map(before.nodes.map((node) => [node.id, node]));
  const afterNodes = new Map(after.nodes.map((node) => [node.id, node]));
  const beforeEdges = new Map(before.edges.map((edge) => [edge.id, edge]));
  const afterEdges = new Map(after.edges.map((edge) => [edge.id, edge]));

  const addedNodes = [...afterNodes.keys()].filter((id) => !beforeNodes.has(id));
  const removedNodes = [...beforeNodes.keys()].filter((id) => !afterNodes.has(id));
  const modifiedNodes = [...afterNodes.keys()].filter((id) => {
    const a = beforeNodes.get(id);
    const b = afterNodes.get(id);
    return a && b && nodeSignature(a) !== nodeSignature(b);
  });

  const addedEdges = [...afterEdges.keys()].filter((id) => !beforeEdges.has(id));
  const removedEdges = [...beforeEdges.keys()].filter((id) => !afterEdges.has(id));
  const modifiedEdges = [...afterEdges.keys()].filter((id) => {
    const a = beforeEdges.get(id);
    const b = afterEdges.get(id);
    return a && b && edgeSignature(a) !== edgeSignature(b);
  });

  return {
    addedNodes, removedNodes, modifiedNodes,
    addedEdges, removedEdges, modifiedEdges,
    statisticsBefore: pickStatistics(before),
    statisticsAfter: pickStatistics(after),
  };
}

export function compareSnapshots(a: GraphSnapshot, b: GraphSnapshot): GraphDiff {
  return compareGraphs(a.graph, b.graph);
}

export function snapshotSummary(snapshot: GraphSnapshot): string {
  return `${snapshot.graph.nodes.length} nodes · ${snapshot.graph.edges.length} relationships`;
}
