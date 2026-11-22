import type {
  CameraState,
  GraphData,
  GraphHistory,
  GraphSettings,
  GraphWorkspace,
  KnowledgeEdge,
  KnowledgeNode,
  KnowledgeTag,
  NodeType,
  RelationshipType,
  Vec3,
} from '@/types';
import { createId } from '@/lib/utils/id';
import { vec } from '@/lib/utils/math';
import { NODE_TYPE_INFO, RELATIONSHIP_TYPE_INFO } from './registry';

export interface NodeOverrides extends Partial<Omit<KnowledgeNode, 'id' | 'position'>> {
  id?: string;
  position?: Partial<Vec3>;
}

export function createNode(overrides: NodeOverrides = {}): KnowledgeNode {
  const now = Date.now();
  const type: NodeType = overrides.type ?? 'concept';
  return {
    id: overrides.id ?? createId('node'),
    title: overrides.title ?? 'Untitled node',
    description: overrides.description ?? '',
    type,
    tags: overrides.tags ? [...overrides.tags] : [],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    color: overrides.color ?? NODE_TYPE_INFO[type].color,
    importance: overrides.importance ?? 0.5,
    source: overrides.source,
    references: overrides.references ? [...overrides.references] : [],
    metadata: overrides.metadata ? { ...overrides.metadata } : {},
    position: { ...vec(), ...overrides.position },
    pinned: overrides.pinned ?? false,
    collectionIds: overrides.collectionIds ? [...overrides.collectionIds] : [],
  };
}

export interface EdgeOverrides extends Partial<Omit<KnowledgeEdge, 'id'>> {
  id?: string;
}

export function createEdge(source: string, target: string, overrides: EdgeOverrides = {}): KnowledgeEdge {
  const now = Date.now();
  const type: RelationshipType = overrides.type ?? 'related';
  return {
    id: overrides.id ?? createId('edge'),
    source,
    target,
    type,
    label: overrides.label ?? RELATIONSHIP_TYPE_INFO[type].defaultLabel,
    description: overrides.description,
    directed: overrides.directed ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    strength: overrides.strength ?? 0.5,
    metadata: overrides.metadata ? { ...overrides.metadata } : {},
  };
}

export function createTag(name: string, overrides: Partial<KnowledgeTag> = {}): KnowledgeTag {
  return {
    id: overrides.id ?? createId('tag'),
    name,
    color: overrides.color ?? '#4fd8e8',
    description: overrides.description,
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

export function createGraphData(): GraphData {
  return { nodes: [], edges: [], tags: [] };
}

export function createCamera(): CameraState {
  return { position: vec(0, 4, 90), target: vec(), zoom: 1 };
}

export function createDefaultSettings(): GraphSettings {
  return {
    layout: {
      kind: 'force',
      repulsion: 68,
      attraction: 0.018,
      linkDistance: 16,
      gravity: 0.012,
      damping: 0.86,
      collision: 3.2,
      strength: 1,
      speed: 1,
      running: true,
      focusNodeId: null,
    },
    visual: {
      showLabels: true,
      showEdgeLabels: false,
      showParticles: true,
      showClusterHulls: true,
      showGrid: false,
      showStarfield: true,
      nodeScale: 1,
      edgeOpacity: 0.5,
      edgeCurvature: 0.12,
      animateFlow: true,
      quality: 'high',
      background: 'void',
    },
  };
}

export function createWorkspace(overrides: Partial<GraphWorkspace> = {}): GraphWorkspace {
  const now = Date.now();
  return {
    id: overrides.id ?? createId('workspace'),
    name: overrides.name ?? 'Untitled universe',
    description: overrides.description ?? '',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    color: overrides.color ?? '#4fd8e8',
    graph: overrides.graph ?? createGraphData(),
    settings: overrides.settings ?? createDefaultSettings(),
    collections: overrides.collections ?? [],
    snapshots: overrides.snapshots ?? [],
    camera: overrides.camera ?? createCamera(),
  };
}

export function createHistory(limit = 120): GraphHistory {
  return { entries: [], cursor: -1, limit };
}

export function cloneGraph(graph: GraphData): GraphData {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      tags: [...node.tags],
      references: [...node.references],
      collectionIds: [...node.collectionIds],
      metadata: { ...node.metadata },
    })),
    edges: graph.edges.map((edge) => ({ ...edge, metadata: { ...edge.metadata } })),
    tags: graph.tags.map((tag) => ({ ...tag })),
  };
}
