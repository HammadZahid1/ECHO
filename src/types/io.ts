import type { GraphData, KnowledgeNode } from './graph';
import type { GraphSnapshot, GraphWorkspace } from './workspace';

export interface ImportIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  path?: string;
}

export interface ImportOptions {
  createMissingNodes: boolean;
  mergeById: boolean;
  generateMissingIds: boolean;
  preserveTimestamps: boolean;
  importMetadata: boolean;
  nodeHierarchy: boolean;
  relationParsing: boolean;
}

export interface ImportResult {
  ok: boolean;
  format: 'json' | 'csv-nodes' | 'csv-edges' | 'markdown' | 'text' | 'unknown';
  graph: GraphData;
  issues: ImportIssue[];
  importedNodes: number;
  importedEdges: number;
  skippedNodes: number;
  skippedEdges: number;
}

export type ExportFormat = 'json' | 'csv-nodes' | 'csv-edges' | 'markdown' | 'svg' | 'png';

export interface ExportOptions {
  format: ExportFormat;
  scope: 'all' | 'selected' | 'cluster' | 'filtered';
  nodeIds?: string[];
  includeMetadata: boolean;
  includePositions: boolean;
  includeTimestamps: boolean;
  pretty: boolean;
  filename?: string;
}

export interface ExportResult {
  filename: string;
  mimeType: string;
  content: string | Blob;
  nodeCount: number;
  edgeCount: number;
}

export interface ParsedDocument {
  title: string;
  nodes: Partial<KnowledgeNode>[];
  edges: { sourceIndex: number; targetIndex: number; label: string; type: string }[];
  tags: string[];
}

export interface GraphBundle {
  format: 'echo-workspace' | 'echo-snapshot';
  version: number;
  exportedAt: number;
  workspace?: Partial<GraphWorkspace>;
  snapshot?: GraphSnapshot;
}
