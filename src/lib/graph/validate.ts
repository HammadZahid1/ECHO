import type { GraphData, ImportIssue, KnowledgeEdge, KnowledgeNode } from '@/types';
import type { ImportOptions } from '@/types';
import { NODE_TYPES, RELATIONSHIP_TYPES } from '@/types';
import { isValidHex } from '@/lib/utils/color';
import { createId } from '@/lib/utils/id';
import { clamp } from '@/lib/utils/math';
import { normalizeText } from '@/lib/utils/text';

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  createMissingNodes: false,
  mergeById: true,
  generateMissingIds: true,
  preserveTimestamps: true,
  importMetadata: true,
  nodeHierarchy: true,
  relationParsing: true,
};

function issue(severity: ImportIssue['severity'], code: string, message: string, path?: string): ImportIssue {
  return { severity, code, message, path };
}

export function validateNode(value: unknown, path = 'node'): ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (typeof value !== 'object' || value === null) {
    return [issue('error', 'node.not-object', 'Node must be an object', path)];
  }
  const node = value as Record<string, unknown>;
  if (node.id !== undefined && (typeof node.id !== 'string' || node.id.trim() === '')) {
    issues.push(issue('error', 'node.invalid-id', 'Node id must be a non-empty string', `${path}.id`));
  }
  if (typeof node.title !== 'string' || node.title.trim() === '') {
    issues.push(issue('error', 'node.missing-title', 'Node title is required', `${path}.title`));
  }
  if (node.type !== undefined && !NODE_TYPES.includes(node.type as KnowledgeNode['type'])) {
    issues.push(issue('warning', 'node.unknown-type', `Unknown node type "${String(node.type)}"; using concept`, `${path}.type`));
  }
  if (node.tags !== undefined && (!Array.isArray(node.tags) || node.tags.some((tag) => typeof tag !== 'string'))) {
    issues.push(issue('warning', 'node.invalid-tags', 'Tags must be an array of strings', `${path}.tags`));
  }
  if (node.importance !== undefined && (typeof node.importance !== 'number' || !Number.isFinite(node.importance))) {
    issues.push(issue('warning', 'node.invalid-importance', 'Importance must be a number', `${path}.importance`));
  }
  if (node.color !== undefined && !isValidHex(node.color)) {
    issues.push(issue('warning', 'node.invalid-color', 'Color must be a hex value', `${path}.color`));
  }
  if (node.position !== undefined) {
    const position = node.position as Record<string, unknown>;
    if (
      typeof position !== 'object' || position === null ||
      ['x', 'y', 'z'].some((axis) => typeof position[axis] !== 'number' || !Number.isFinite(position[axis]))
    ) {
      issues.push(issue('warning', 'node.invalid-position', 'Position must contain numeric x, y and z', `${path}.position`));
    }
  }
  if (node.metadata !== undefined && (typeof node.metadata !== 'object' || node.metadata === null || Array.isArray(node.metadata))) {
    issues.push(issue('warning', 'node.invalid-metadata', 'Metadata must be an object', `${path}.metadata`));
  }
  return issues;
}

export function validateEdge(value: unknown, path = 'edge'): ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (typeof value !== 'object' || value === null) {
    return [issue('error', 'edge.not-object', 'Edge must be an object', path)];
  }
  const edge = value as Record<string, unknown>;
  if (typeof edge.source !== 'string' || edge.source.trim() === '') {
    issues.push(issue('error', 'edge.missing-source', 'Edge source is required', `${path}.source`));
  }
  if (typeof edge.target !== 'string' || edge.target.trim() === '') {
    issues.push(issue('error', 'edge.missing-target', 'Edge target is required', `${path}.target`));
  }
  if (edge.type !== undefined && !RELATIONSHIP_TYPES.includes(edge.type as KnowledgeEdge['type'])) {
    issues.push(issue('warning', 'edge.unknown-type', `Unknown relationship type "${String(edge.type)}"; using related`, `${path}.type`));
  }
  if (edge.strength !== undefined && (typeof edge.strength !== 'number' || !Number.isFinite(edge.strength))) {
    issues.push(issue('warning', 'edge.invalid-strength', 'Strength must be a number', `${path}.strength`));
  }
  return issues;
}

export function findDuplicateIds<T extends { id: string }>(items: T[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  return [...duplicates];
}

export function findDanglingEdges(graph: GraphData): KnowledgeEdge[] {
  const ids = new Set(graph.nodes.map((node) => node.id));
  return graph.edges.filter((edge) => !ids.has(edge.source) || !ids.has(edge.target));
}

/** Repairs and normalizes untrusted graph data, returning diagnostics. */
export function normalizeGraph(input: unknown, options: ImportOptions = DEFAULT_IMPORT_OPTIONS): {
  graph: GraphData;
  issues: ImportIssue[];
} {
  const issues: ImportIssue[] = [];
  const raw = (input ?? {}) as Record<string, unknown>;
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];

  if (!Array.isArray(raw.nodes)) issues.push(issue('warning', 'graph.nodes-missing', 'No node array found; starting empty'));
  if (!Array.isArray(raw.edges)) issues.push(issue('warning', 'graph.edges-missing', 'No edge array found; starting empty'));

  const nodes: KnowledgeNode[] = [];
  const usedIds = new Set<string>();

  rawNodes.forEach((rawNode, index) => {
    issues.push(...validateNode(rawNode, `nodes[${index}]`));
    if (typeof rawNode !== 'object' || rawNode === null) return;
    const value = rawNode as Record<string, unknown>;
    if (typeof value.title !== 'string' || value.title.trim() === '') return;

    let id = typeof value.id === 'string' ? value.id.trim() : '';
    if (!id && options.generateMissingIds) id = createId('node');
    if (!id) return;
    if (usedIds.has(id)) {
      if (!options.mergeById) {
        id = createId('node');
        issues.push(issue('info', 'node.id-regenerated', `Duplicate id "${id}" was regenerated`, `nodes[${index}].id`));
      } else {
        issues.push(issue('info', 'node.id-merged', `Duplicate node id "${id}" merged`, `nodes[${index}].id`));
      }
    }
    usedIds.add(id);

    const type = NODE_TYPES.includes(value.type as KnowledgeNode['type'])
      ? (value.type as KnowledgeNode['type'])
      : 'concept';
    const position = (value.position ?? {}) as Record<string, unknown>;
    const num = (v: unknown, fallback: number): number =>
      typeof v === 'number' && Number.isFinite(v) ? v : fallback;
    const now = Date.now();
    const existing = options.mergeById ? nodes.find((node) => node.id === id) : undefined;
    const tags = Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim() !== '').map((tag) => normalizeText(tag))
      : [];
    const node: KnowledgeNode = {
      id,
      title: String(value.title).trim(),
      description: typeof value.description === 'string' ? value.description : '',
      type,
      tags: [...new Set(tags)],
      createdAt: options.preserveTimestamps ? num(value.createdAt, existing?.createdAt ?? now) : (existing?.createdAt ?? now),
      updatedAt: options.preserveTimestamps ? num(value.updatedAt, now) : now,
      color: isValidHex(value.color) ? value.color : undefined,
      importance: clamp(num(value.importance, 0.5), 0, 1),
      source: typeof value.source === 'string' ? value.source : undefined,
      references: Array.isArray(value.references)
        ? value.references.filter((ref): ref is string => typeof ref === 'string')
        : [],
      metadata: options.importMetadata && typeof value.metadata === 'object' && value.metadata !== null && !Array.isArray(value.metadata)
        ? Object.fromEntries(Object.entries(value.metadata).filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v) || v === null)) as KnowledgeNode['metadata']
        : {},
      position: {
        x: num(position.x, 0),
        y: num(position.y, 0),
        z: num(position.z, 0),
      },
      pinned: value.pinned === true,
      collectionIds: Array.isArray(value.collectionIds)
        ? value.collectionIds.filter((id): id is string => typeof id === 'string')
        : [],
    };
    if (existing) Object.assign(existing, node);
    else nodes.push(node);
  });

  const edges: KnowledgeEdge[] = [];
  const usedEdgeIds = new Set<string>();
  rawEdges.forEach((rawEdge, index) => {
    issues.push(...validateEdge(rawEdge, `edges[${index}]`));
    if (typeof rawEdge !== 'object' || rawEdge === null) return;
    const value = rawEdge as Record<string, unknown>;
    if (typeof value.source !== 'string' || typeof value.target !== 'string') return;
    if (!usedIds.has(value.source) || !usedIds.has(value.target)) {
      issues.push(issue('error', 'edge.dangling', `Edge references missing node "${!usedIds.has(value.source) ? value.source : value.target}"`, `edges[${index}]`));
      return;
    }
    let id = typeof value.id === 'string' && value.id.trim() !== '' ? value.id.trim() : createId('edge');
    if (usedEdgeIds.has(id)) id = createId('edge');
    usedEdgeIds.add(id);
    const type = RELATIONSHIP_TYPES.includes(value.type as KnowledgeEdge['type'])
      ? (value.type as KnowledgeEdge['type'])
      : 'related';
    edges.push({
      id,
      source: value.source,
      target: value.target,
      type,
      label: typeof value.label === 'string' ? value.label : type,
      description: typeof value.description === 'string' ? value.description : undefined,
      directed: value.directed === true,
      createdAt: options.preserveTimestamps && typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
      updatedAt: Date.now(),
      strength: clamp(typeof value.strength === 'number' ? value.strength : 0.5, 0, 1),
      metadata: {},
    });
  });

  const rawTags = Array.isArray(raw.tags) ? raw.tags : [];
  const tags = rawTags
    .filter((tag): tag is Record<string, unknown> => typeof tag === 'object' && tag !== null && typeof (tag as Record<string, unknown>).name === 'string')
    .map((tag) => ({
      id: typeof tag.id === 'string' ? tag.id : createId('tag'),
      name: String(tag.name),
      color: isValidHex(tag.color) ? tag.color : '#4fd8e8',
      description: typeof tag.description === 'string' ? tag.description : undefined,
      createdAt: typeof tag.createdAt === 'number' ? tag.createdAt : Date.now(),
    }));

  return { graph: { nodes, edges, tags }, issues };
}

export function validateGraph(graph: GraphData): ImportIssue[] {
  const issues = findDuplicateIds(graph.nodes).map((id) =>
    issue('error', 'graph.duplicate-node-id', `Duplicate node id "${id}"`, id));
  issues.push(...findDanglingEdges(graph).map((edge) =>
    issue('error', 'graph.dangling-edge', `Edge "${edge.id}" references a missing node`, edge.id)));
  return issues;
}
