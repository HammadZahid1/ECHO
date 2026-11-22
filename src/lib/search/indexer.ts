import type { GraphData, KnowledgeNode } from '@/types';
import { normalizeText, uniqueTokens } from '@/lib/utils/text';

export interface SearchDocument {
  nodeId: string;
  title: string;
  normalizedTitle: string;
  description: string;
  type: string;
  tags: string[];
  metadataText: string;
  relationshipText: string;
  searchText: string;
  tokens: Set<string>;
  importance: number;
  createdAt: number;
  updatedAt: number;
}

export function buildDocument(node: KnowledgeNode, graph: GraphData): SearchDocument {
  const connectedLabels = graph.edges
    .filter((edge) => edge.source === node.id || edge.target === node.id)
    .map((edge) => `${edge.label} ${edge.type}`)
    .join(' ');
  const metadataText = Object.entries(node.metadata)
    .map(([key, value]) => `${key} ${String(value ?? '')}`)
    .join(' ');
  const tags = node.tags.map(normalizeText);
  const normalizedTitle = normalizeText(node.title);
  const description = normalizeText(node.description);
  const type = normalizeText(node.type);
  const relationshipText = normalizeText(connectedLabels);
  const normalizedMetadata = normalizeText(metadataText);
  return {
    nodeId: node.id,
    title: node.title,
    normalizedTitle,
    description,
    type,
    tags,
    metadataText: normalizedMetadata,
    relationshipText,
    searchText: [normalizedTitle, description, tags.join(' '), type, normalizedMetadata, relationshipText].join(' '),
    tokens: new Set(uniqueTokens([normalizedTitle, description, tags.join(' '), relationshipText].join(' '))),
    importance: node.importance,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

export function buildIndex(graph: GraphData): Map<string, SearchDocument> {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return new Map(graph.nodes.map((node) => [node.id, buildDocument(node, { ...graph, nodes: [nodeById.get(node.id) ?? node] })]));
}
