import type { ImportIssue, ImportOptions, ImportResult } from '@/types';
import { DEFAULT_IMPORT_OPTIONS, normalizeGraph } from '@/lib/graph/validate';
import { createGraphData } from '@/lib/graph/factory';
import { normalizeText } from '@/lib/utils/text';

/** RFC-4180-inspired CSV parser with quoted fields and escaped quotes. */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (char === '\n') {
      row.push(field.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined): boolean {
  return ['true', '1', 'yes', 'y', 'directed'].includes((value ?? '').toLowerCase());
}

export function importCsvNodes(text: string, options: ImportOptions = DEFAULT_IMPORT_OPTIONS): ImportResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { ok: false, format: 'csv-nodes', graph: createGraphData(), issues: [{ severity: 'error', code: 'csv.empty', message: 'CSV needs a header and at least one data row' }], importedNodes: 0, importedEdges: 0, skippedNodes: 0, skippedEdges: 0 };
  }
  const header = rows[0].map((value) => normalizeText(value).replace(/[^a-z0-9]/g, ''));
  const issues: ImportIssue[] = [];
  const required = ['title'];
  for (const field of required) {
    if (!header.includes(field)) issues.push({ severity: 'error', code: 'csv.missing-column', message: `Missing required column: ${field}`, path: 'header' });
  }
  const record = (values: string[]): Record<string, string> =>
    Object.fromEntries(header.map((name, index) => [name, values[index] ?? '']));

  const nodes = rows.slice(1).map((values, index) => {
    const value = record(values);
    const rawTags = value.tags || value.tag || '';
    return {
      id: value.id || undefined,
      title: value.title,
      description: value.description || '',
      type: value.type || 'concept',
      tags: rawTags.split('|').map((tag) => tag.trim()).filter(Boolean),
      importance: parseNumber(value.importance, 0.5),
      color: value.color || undefined,
      source: value.source || undefined,
      position: { x: parseNumber(value.x, 0), y: parseNumber(value.y, 0), z: parseNumber(value.z, 0) },
      pinned: parseBoolean(value.pinned),
      metadata: options.importMetadata && value.metadata ? { csv: value.metadata } : {},
      createdAt: parseNumber(value.createdat, Date.now()),
      updatedAt: parseNumber(value.updatedat, Date.now()),
      references: value.references ? value.references.split('|').filter(Boolean) : [],
    };
  });

  const normalized = normalizeGraph({ nodes, edges: [] }, options);
  return {
    ok: issues.filter((issue) => issue.severity === 'error').length === 0 && normalized.graph.nodes.length > 0,
    format: 'csv-nodes',
    graph: normalized.graph,
    issues: [...issues, ...normalized.issues],
    importedNodes: normalized.graph.nodes.length,
    importedEdges: 0,
    skippedNodes: rows.length - 1 - normalized.graph.nodes.length,
    skippedEdges: 0,
  };
}

export function importCsvEdges(text: string, nodesText?: string, options: ImportOptions = DEFAULT_IMPORT_OPTIONS): ImportResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { ok: false, format: 'csv-edges', graph: createGraphData(), issues: [{ severity: 'error', code: 'csv.empty', message: 'Edge CSV needs a header and at least one data row' }], importedNodes: 0, importedEdges: 0, skippedNodes: 0, skippedEdges: 0 };
  }
  const base = nodesText ? importCsvNodes(nodesText, options).graph : createGraphData();
  const header = rows[0].map((value) => normalizeText(value).replace(/[^a-z0-9]/g, ''));
  const issues: ImportIssue[] = [];
  if (!header.includes('source') || !header.includes('target')) {
    issues.push({ severity: 'error', code: 'csv.missing-endpoints', message: 'Edge CSV requires source and target columns' });
  }
  const edges = rows.slice(1).map((values) => {
    const value = Object.fromEntries(header.map((name, index) => [name, values[index] ?? ''])) as Record<string, string>;
    const type = value.type || 'related';
    return {
      id: value.id || undefined,
      source: value.source,
      target: value.target,
      type,
      label: value.label || type,
      description: value.description || undefined,
      directed: parseBoolean(value.directed),
      strength: parseNumber(value.strength, 0.5),
      createdAt: parseNumber(value.createdat, Date.now()),
      metadata: {},
    };
  });
  const normalized = normalizeGraph({ nodes: base.nodes, edges }, options);
  return {
    ok: issues.length === 0,
    format: 'csv-edges',
    graph: normalized.graph,
    issues: [...issues, ...normalized.issues],
    importedNodes: base.nodes.length,
    importedEdges: normalized.graph.edges.length,
    skippedNodes: 0,
    skippedEdges: rows.length - 1 - normalized.graph.edges.length,
  };
}
