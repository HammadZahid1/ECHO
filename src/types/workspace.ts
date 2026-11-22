import type { GraphData, Vec3 } from './graph';

export type LayoutKind =
  | 'force'
  | 'radial'
  | 'circular'
  | 'hierarchical'
  | 'tree'
  | 'grid'
  | 'cluster'
  | 'organic';

export interface GraphLayoutSettings {
  kind: LayoutKind;
  repulsion: number;
  attraction: number;
  linkDistance: number;
  gravity: number;
  damping: number;
  collision: number;
  strength: number;
  speed: number;
  running: boolean;
  focusNodeId: string | null;
}

export interface GraphVisualSettings {
  showLabels: boolean;
  showEdgeLabels: boolean;
  showParticles: boolean;
  showClusterHulls: boolean;
  showGrid: boolean;
  showStarfield: boolean;
  nodeScale: number;
  edgeOpacity: number;
  edgeCurvature: number;
  animateFlow: boolean;
  quality: 'low' | 'medium' | 'high';
  background: 'void' | 'deep' | 'graphite';
}

export interface GraphSettings {
  layout: GraphLayoutSettings;
  visual: GraphVisualSettings;
}

export interface GraphCollection {
  id: string;
  name: string;
  description: string;
  color: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface GraphSnapshot {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  graph: GraphData;
  settings: GraphSettings;
  camera: CameraState;
}

export interface CameraState {
  position: Vec3;
  target: Vec3;
  zoom: number;
}

export interface GraphWorkspace {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  color: string;
  graph: GraphData;
  settings: GraphSettings;
  collections: GraphCollection[];
  snapshots: GraphSnapshot[];
  camera: CameraState;
}

export type HistoryActionKind =
  | 'node.add'
  | 'node.remove'
  | 'node.update'
  | 'node.move'
  | 'node.color'
  | 'node.type'
  | 'node.tag'
  | 'node.pin'
  | 'edge.add'
  | 'edge.remove'
  | 'edge.update'
  | 'tag.add'
  | 'tag.update'
  | 'collection.add'
  | 'collection.remove'
  | 'collection.update'
  | 'graph.import'
  | 'graph.layout'
  | 'snapshot.restore';

export interface GraphHistoryEntry {
  id: string;
  kind: HistoryActionKind;
  label: string;
  at: number;
  before: GraphData;
  after: GraphData;
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
}

export interface GraphHistory {
  entries: GraphHistoryEntry[];
  cursor: number;
  limit: number;
}
