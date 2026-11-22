import type { GraphData, GraphHealthReport, HealthIssue, HealthFix, RelationshipType } from '@/types';
import { buildAdjacency } from './adjacency';
import { connectedComponents } from './traverse';
import { findSimilarNodes, suggestConnections } from './similarity';
import { normalizeText } from '@/lib/utils/text';

/** All health findings are computed from actual graph data and local heuristics. */
export function analyzeGraphHealth(graph: GraphData): GraphHealthReport {
  const issues: HealthIssue[] = [];
  const adjacency = buildAdjacency(graph);
  const components = connectedComponents(graph);
  const now = Date.now();
  let sequence = 0;
  const add = (
    kind: HealthIssue['kind'],
    severity: HealthIssue['severity'],
    title: string,
    detail: string,
    nodeIds: string[] = [],
    edgeIds: string[] = [],
    suggestion?: string,
    fix?: HealthFix,
  ): void => {
    sequence += 1;
    issues.push({ id: `health-${sequence}`, kind, severity, title, detail, nodeIds, edgeIds, suggestion, fix });
  };

  const isolated = graph.nodes.filter((node) => (adjacency.degree.get(node.id) ?? 0) === 0);
  for (const node of isolated) {
    const suggestion = suggestConnections(graph, node.id, 1)[0];
    add(
      'isolated', 'warning', `Unconnected: ${node.title}`,
      'This node has no relationships and will not appear in path searches.',
      [node.id], [],
      suggestion ? `Consider connecting to ${graph.nodes.find((candidate) => candidate.id === suggestion.b)?.title ?? 'a similar node'}.` : 'Add a relationship to place it in the knowledge network.',
      suggestion ? { kind: 'connect', source: node.id, target: suggestion.b, type: 'related' as RelationshipType } : undefined,
    );
  }

  const hubs = graph.nodes
    .map((node) => ({ node, degree: adjacency.degree.get(node.id) ?? 0 }))
    .filter((entry) => entry.degree >= 8)
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5);
  for (const { node, degree } of hubs) {
    add('hub', 'info', `Hub node: ${node.title}`, `${degree} connections. Hubs can dominate force layouts and path searches.`,
      [node.id], [], 'Consider splitting the hub into more specific concepts.');
  }

  for (const component of components) {
    if (component.length < 4) continue;
    const internal = graph.edges.filter((edge) => component.includes(edge.source) && component.includes(edge.target)).length;
    const density = internal / Math.max(1, (component.length * (component.length - 1)) / 2);
    if (density < 0.25) {
      const name = graph.nodes.find((node) => node.id === component[0])?.title ?? 'Cluster';
      add('weak-cluster', 'info', `Loosely connected cluster: ${name}`,
        `${component.length} nodes with ${(density * 100).toFixed(0)}% internal density.`, component, [],
        'Look for missing relationships between closely related nodes.');
    }
    if (component.length > 40) {
      add('oversized-cluster', 'warning', `Oversized cluster: ${nameForComponent(graph, component)}`,
        `${component.length} nodes in one component. Consider splitting it into sub-themes.`, component);
    }
  }

  const titleGroups = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const key = normalizeText(node.title);
    titleGroups.set(key, [...(titleGroups.get(key) ?? []), node.id]);
  }
  for (const ids of titleGroups.values()) {
    if (ids.length > 1) {
      add('duplicate-title', 'warning', `Duplicate title: ${graph.nodes.find((node) => node.id === ids[0])?.title}`,
        `${ids.length} nodes share this title.`, ids, [], 'Rename or merge these nodes.',
        { kind: 'merge', keepId: ids[0], removeId: ids[1] });
    }
  }

  for (const pair of findSimilarNodes(graph, 0.72, 20)) {
    const a = graph.nodes.find((node) => node.id === pair.a);
    const b = graph.nodes.find((node) => node.id === pair.b);
    if (!a || !b) continue;
    add('likely-duplicate', 'info', `Possible duplicate: ${a.title} / ${b.title}`,
      `Local text similarity ${(pair.score * 100).toFixed(0)}%. ${pair.reason}.`, [a.id, b.id], [],
      'Review and merge if they represent the same concept.',
      { kind: 'merge', keepId: a.id, removeId: b.id });
  }

  for (const node of graph.nodes) {
    if (node.description.trim() === '') {
      add('missing-description', 'info', `No description: ${node.title}`,
        'Descriptions make graph exploration and search far more useful.', [node.id], [],
        'Add a short explanation of this concept.', { kind: 'describe', nodeId: node.id });
    }
    if (node.tags.length === 0) {
      add('missing-tags', 'info', `No tags: ${node.title}`,
        'Tags enable fast filtering and tag-based clustering.', [node.id], [],
        'Add at least one tag.', { kind: 'add-tag', nodeId: node.id, tag: 'untagged' });
    }
    if ((adjacency.degree.get(node.id) ?? 0) === 1) {
      const parent = (adjacency.all.get(node.id) ?? [])[0]?.other;
      add('low-degree', 'info', `Single connection: ${node.title}`,
        'This node is only weakly integrated into the graph.', [node.id], [],
        parent ? `Consider relating it to other nodes near ${graph.nodes.find((candidate) => candidate.id === parent)?.title ?? 'its neighbor'}.` : undefined);
    }
  }

  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      add('circular-self-edge', 'warning', `Self relationship: ${edge.label}`,
        'A node references itself, which can distort degree statistics.', [edge.source], [edge.id],
        'Remove or redirect this relationship.', { kind: 'delete-edge', edgeId: edge.id });
    }
  }
  const ids = new Set(graph.nodes.map((node) => node.id));
  for (const edge of graph.edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      add('dangling-edge', 'critical', 'Broken relationship', `Relationship ${edge.id} references a missing node.`, [], [edge.id],
        'Remove this relationship.', { kind: 'delete-edge', edgeId: edge.id });
    }
  }

  const penalty = issues.reduce((sum, issue) => sum + (
    issue.severity === 'critical' ? 12 : issue.severity === 'warning' ? 4 : 1
  ), 0);
  const score = Math.max(0, Math.round(100 - penalty));
  return { issues, score, checkedAt: now, nodeCount: graph.nodes.length, edgeCount: graph.edges.length };
}

function nameForComponent(graph: GraphData, ids: string[]): string {
  return graph.nodes.find((node) => node.id === ids[0])?.title ?? 'Unnamed cluster';
}
