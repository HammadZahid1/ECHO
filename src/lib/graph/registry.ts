import type {
  LayoutKind,
  NodeType,
  NodeTypeInfo,
  RelationshipType,
  RelationshipTypeInfo,
  ViewMode,
} from '@/types';

export const NODE_TYPE_INFO: Record<NodeType, NodeTypeInfo> = {
  concept: { type: 'concept', label: 'Concept', color: '#4fd8e8', description: 'An abstract idea or mental model', glyph: '◇' },
  idea: { type: 'idea', label: 'Idea', color: '#9d7bf5', description: 'A new thought or possibility', glyph: '✧' },
  note: { type: 'note', label: 'Note', color: '#8b919b', description: 'A captured piece of information', glyph: '▤' },
  research: { type: 'research', label: 'Research', color: '#5b8def', description: 'A finding, source or study', glyph: '⌘' },
  question: { type: 'question', label: 'Question', color: '#e3b35c', description: 'An open inquiry', glyph: '?' },
  project: { type: 'project', label: 'Project', color: '#58c9a0', description: 'A deliberate body of work', glyph: '▣' },
  person: { type: 'person', label: 'Person', color: '#e88fb8', description: 'An individual or actor', glyph: '◉' },
  resource: { type: 'resource', label: 'Resource', color: '#7fd4a6', description: 'A tool, book or reference', glyph: '▧' },
  event: { type: 'event', label: 'Event', color: '#e46d70', description: 'Something that happened', glyph: '◷' },
  custom: { type: 'custom', label: 'Custom', color: '#c6cad1', description: 'A user-defined category', glyph: '✦' },
};

export const RELATIONSHIP_TYPE_INFO: Record<RelationshipType, RelationshipTypeInfo> = {
  related: { type: 'related', label: 'Related to', color: '#7f8792', description: 'A general association', defaultLabel: 'related to' },
  depends: { type: 'depends', label: 'Depends on', color: '#e3b35c', description: 'Source requires target', defaultLabel: 'depends on' },
  contradicts: { type: 'contradicts', label: 'Contradicts', color: '#e46d70', description: 'The two claims conflict', defaultLabel: 'contradicts' },
  supports: { type: 'supports', label: 'Supports', color: '#58c9a0', description: 'Source reinforces target', defaultLabel: 'supports' },
  contains: { type: 'contains', label: 'Contains', color: '#5b8def', description: 'Target is part of source', defaultLabel: 'contains' },
  derived: { type: 'derived', label: 'Derived from', color: '#9d7bf5', description: 'Source emerges from target', defaultLabel: 'derived from' },
  influences: { type: 'influences', label: 'Influences', color: '#4fd8e8', description: 'Source shapes target', defaultLabel: 'influences' },
  references: { type: 'references', label: 'References', color: '#8ca3f7', description: 'Source points to target', defaultLabel: 'references' },
  causes: { type: 'causes', label: 'Causes', color: '#e88fb8', description: 'Source produces target', defaultLabel: 'causes' },
  custom: { type: 'custom', label: 'Custom', color: '#c6cad1', description: 'A user-defined relationship', defaultLabel: 'custom link' },
};

export const LAYOUT_LABELS: Record<LayoutKind, string> = {
  force: 'Force directed',
  radial: 'Radial',
  circular: 'Circular',
  hierarchical: 'Hierarchical',
  tree: 'Tree',
  grid: 'Grid',
  cluster: 'Cluster',
  organic: 'Organic',
};

export const VIEW_LABELS: Record<ViewMode, string> = {
  universe: '3D Universe',
  'graph-2d': '2D Graph',
  radial: 'Radial Explorer',
  hierarchical: 'Hierarchy',
  cluster: 'Clusters',
  timeline: 'Timeline',
  table: 'Table',
  network: 'Network Overview',
};

export const IMPORTANCE_LABELS = ['faint', 'minor', 'notable', 'important', 'essential'] as const;

export function importanceLabel(importance: number): string {
  const index = Math.min(IMPORTANCE_LABELS.length - 1, Math.max(0, Math.floor(importance * IMPORTANCE_LABELS.length)));
  return IMPORTANCE_LABELS[index];
}
