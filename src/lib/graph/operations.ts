import type { GraphData, KnowledgeEdge, KnowledgeNode } from '@/types';
import { createId } from '@/lib/utils/id';
import { cloneGraph } from './factory';

export function addNode(graph: GraphData, node: KnowledgeNode): GraphData {
  if (graph.nodes.some((existing) => existing.id === node.id)) return graph;
  return { ...graph, nodes: [...graph.nodes, node] };
}

export function updateNode(graph: GraphData, id: string, patch: Partial<KnowledgeNode>): GraphData {
  let changed = false;
  const nodes = graph.nodes.map((node) => {
    if (node.id !== id) return node;
    changed = true;
    return { ...node, ...patch, id: node.id, updatedAt: patch.updatedAt ?? Date.now() };
  });
  return changed ? { ...graph, nodes } : graph;
}

export function removeNode(graph: GraphData, id: string): GraphData {
  const nodes = graph.nodes.filter((node) => node.id !== id);
  if (nodes.length === graph.nodes.length) return graph;
  return { ...graph, nodes, edges: graph.edges.filter((edge) => edge.source !== id && edge.target !== id) };
}

export function duplicateNode(graph: GraphData, id: string): { graph: GraphData; newId: string | null } {
  const source = graph.nodes.find((node) => node.id === id);
  if (!source) return { graph, newId: null };
  const newId = createId('node');
  const copy: KnowledgeNode = {
    ...source,
    id: newId,
    title: `${source.title} copy`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: [...source.tags],
    references: [...source.references],
    collectionIds: [...source.collectionIds],
    metadata: { ...source.metadata },
    position: { x: source.position.x + 6, y: source.position.y + 4, z: source.position.z },
    pinned: false,
  };
  return { graph: { ...graph, nodes: [...graph.nodes, copy] }, newId };
}

export function addEdge(graph: GraphData, edge: KnowledgeEdge): GraphData {
  const exists = graph.edges.some((candidate) => candidate.id === edge.id);
  const endpointsExist = graph.nodes.some((node) => node.id === edge.source)
    && graph.nodes.some((node) => node.id === edge.target);
  if (exists || !endpointsExist || edge.source === edge.target) return graph;
  return { ...graph, edges: [...graph.edges, edge] };
}

export function updateEdge(graph: GraphData, id: string, patch: Partial<KnowledgeEdge>): GraphData {
  let changed = false;
  const edges = graph.edges.map((edge) => {
    if (edge.id !== id) return edge;
    changed = true;
    return { ...edge, ...patch, id: edge.id, updatedAt: patch.updatedAt ?? Date.now() };
  });
  return changed ? { ...graph, edges } : graph;
}

export function removeEdge(graph: GraphData, id: string): GraphData {
  const edges = graph.edges.filter((edge) => edge.id !== id);
  return edges.length === graph.edges.length ? graph : { ...graph, edges };
}

export function setNodePositions(graph: GraphData, positions: Map<string, { x: number; y: number; z: number }>): GraphData {
  let changed = false;
  const nodes = graph.nodes.map((node) => {
    const position = positions.get(node.id);
    if (!position || node.pinned) return node;
    changed = true;
    return { ...node, position };
  });
  return changed ? { ...graph, nodes } : graph;
}

export function moveNode(graph: GraphData, id: string, position: { x: number; y: number; z: number }): GraphData {
  return updateNode(graph, id, { position });
}

export function togglePin(graph: GraphData, id: string): GraphData {
  let changed = false;
  const nodes = graph.nodes.map((node) => {
    if (node.id !== id) return node;
    changed = true;
    return { ...node, pinned: !node.pinned };
  });
  return changed ? { ...graph, nodes } : graph;
}

export function assignTag(graph: GraphData, nodeId: string, tag: string): GraphData {
  const normalized = tag.trim();
  if (!normalized) return graph;
  let changed = false;
  const nodes = graph.nodes.map((node) => {
    if (node.id !== nodeId || node.tags.includes(normalized)) return node;
    changed = true;
    return { ...node, tags: [...node.tags, normalized], updatedAt: Date.now() };
  });
  if (!changed) return graph;
  const tags = graph.tags.some((existing) => existing.name === normalized)
    ? graph.tags
    : [...graph.tags, { id: createId('tag'), name: normalized, color: '#4fd8e8', createdAt: Date.now() }];
  return { ...graph, nodes, tags };
}

export function unassignTag(graph: GraphData, nodeId: string, tag: string): GraphData {
  return updateNode(graph, nodeId, { tags: (graph.nodes.find((node) => node.id === nodeId)?.tags ?? []).filter((value) => value !== tag) });
}

export function replaceGraph(graph: GraphData, incoming: GraphData): GraphData {
  return cloneGraph(incoming);
}
