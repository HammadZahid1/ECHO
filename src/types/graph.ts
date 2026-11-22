/** Core knowledge graph domain types. */

export type Vec3 = { x: number; y: number; z: number };

export const NODE_TYPES = [
  'concept',
  'idea',
  'note',
  'research',
  'question',
  'project',
  'person',
  'resource',
  'event',
  'custom',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  'related',
  'depends',
  'contradicts',
  'supports',
  'contains',
  'derived',
  'influences',
  'references',
  'causes',
  'custom',
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export type NodeMetadata = Record<string, string | number | boolean | null>;

export interface KnowledgeNode {
  id: string;
  title: string;
  description: string;
  type: NodeType;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  color?: string;
  importance: number;
  source?: string;
  references: string[];
  metadata: NodeMetadata;
  position: Vec3;
  pinned: boolean;
  collectionIds: string[];
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label: string;
  description?: string;
  directed: boolean;
  createdAt: number;
  updatedAt: number;
  strength: number;
  metadata: NodeMetadata;
}

export interface KnowledgeTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: number;
}

export interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  tags: KnowledgeTag[];
}

export interface NodeTypeInfo {
  type: NodeType;
  label: string;
  color: string;
  description: string;
  glyph: string;
}

export interface RelationshipTypeInfo {
  type: RelationshipType;
  label: string;
  color: string;
  description: string;
  defaultLabel: string;
}
