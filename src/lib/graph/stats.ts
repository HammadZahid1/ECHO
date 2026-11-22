import type { DistributionBucket, GraphData, GraphStatistics, NodeType, RelationshipType } from '@/types';
import { buildAdjacency } from './adjacency';
import { connectedComponents } from './traverse';
import { NODE_TYPE_INFO, RELATIONSHIP_TYPE_INFO } from './registry';
import { median, mean } from '@/lib/utils/math';
import { normalizeText } from '@/lib/utils/text';

function buckets(entries: Map<string, number>, labels?: Record<string, string>, colors?: Record<string, string>): DistributionBucket[] {
  return [...entries.entries()]
    .map(([key, count]) => ({ key, label: labels?.[key] ?? key, count, color: colors?.[key] }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Computes all live graph statistics from actual graph data. */
export function computeStatistics(graph: GraphData): GraphStatistics {
  const adjacency = buildAdjacency(graph);
  const degrees = graph.nodes.map((node) => adjacency.degree.get(node.id) ?? 0);
  const typeCounts = new Map<string, number>();
  const relationCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const degreeCounts = new Map<string, number>();
  const titleGroups = new Map<string, string[]>();

  for (const node of graph.nodes) {
    typeCounts.set(node.type, (typeCounts.get(node.type) ?? 0) + 1);
    for (const tag of node.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    const key = normalizeText(node.title);
    titleGroups.set(key, [...(titleGroups.get(key) ?? []), node.id]);
  }
  for (const edge of graph.edges) {
    relationCounts.set(edge.type, (relationCounts.get(edge.type) ?? 0) + 1);
  }
  for (const degree of degrees) {
    const key = String(degree);
    degreeCounts.set(key, (degreeCounts.get(key) ?? 0) + 1);
  }

  const components = connectedComponents(graph);
  const isolatedNodeIds = graph.nodes.filter((node) => (adjacency.degree.get(node.id) ?? 0) === 0).map((node) => node.id);
  const maxDegree = degrees.length === 0 ? 0 : Math.max(...degrees);
  const possibleEdges = graph.nodes.length > 1 ? (graph.nodes.length * (graph.nodes.length - 1)) / 2 : 0;
  const mostConnectedNodeIds = graph.nodes
    .map((node) => ({ id: node.id, degree: adjacency.degree.get(node.id) ?? 0 }))
    .filter((entry) => entry.degree > 0)
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5)
    .map((entry) => entry.id);

  const typeLabels = Object.fromEntries(
    Object.entries(NODE_TYPE_INFO).map(([key, value]) => [key, value.label]),
  ) as Record<NodeType, string>;
  const typeColors = Object.fromEntries(
    Object.entries(NODE_TYPE_INFO).map(([key, value]) => [key, value.color]),
  ) as Record<NodeType, string>;
  const relationLabels = Object.fromEntries(
    Object.entries(RELATIONSHIP_TYPE_INFO).map(([key, value]) => [key, value.label]),
  ) as Record<RelationshipType, string>;
  const relationColors = Object.fromEntries(
    Object.entries(RELATIONSHIP_TYPE_INFO).map(([key, value]) => [key, value.color]),
  ) as Record<RelationshipType, string>;

  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    typeDistribution: buckets(typeCounts, typeLabels, typeColors),
    relationshipDistribution: buckets(relationCounts, relationLabels, relationColors),
    tagDistribution: buckets(tagCounts),
    clusterCount: components.length,
    componentCount: components.length,
    isolatedNodeIds,
    averageDegree: mean(degrees),
    medianDegree: median(degrees),
    maxDegree,
    density: possibleEdges === 0 ? 0 : graph.edges.length / possibleEdges,
    degreeDistribution: buckets(degreeCounts),
    mostConnectedNodeIds,
    largestClusterSize: components[0]?.length ?? 0,
    missingDescriptionCount: graph.nodes.filter((node) => node.description.trim() === '').length,
    missingTagsCount: graph.nodes.filter((node) => node.tags.length === 0).length,
    duplicateTitleGroups: [...titleGroups.values()].filter((group) => group.length > 1),
  };
}

/** Degree values keyed by node id for chart and inspector use. */
export function degreeMap(graph: GraphData): Map<string, number> {
  return buildAdjacency(graph).degree;
}
