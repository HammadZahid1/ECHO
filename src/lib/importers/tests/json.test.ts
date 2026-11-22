import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/graph/validate';
import { importJson } from '@/lib/importers/json';

afterEach(() => vi.restoreAllMocks());

describe('importJson', () => {
  it('imports a complete graph with nodes, edges and tags intact', () => {
    const result = importJson(JSON.stringify({
      nodes: [
        {
          id: 'a', title: 'Alpha', type: 'idea', tags: ['x'], description: 'first',
          createdAt: 10, updatedAt: 20, position: { x: 1, y: 2, z: 3 },
          metadata: { origin: 'test' },
        },
        { id: 'b', title: 'Beta', type: 'note', tags: ['y'] },
      ],
      edges: [{
        id: 'e1', source: 'a', target: 'b', type: 'supports', label: 'backs',
        directed: true, strength: 0.8, createdAt: 30,
      }],
      tags: [{ id: 't1', name: 'x', color: '#ff0000' }],
    }));

    expect(result.ok).toBe(true);
    expect(result.format).toBe('json');
    expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(result.importedNodes).toBe(2);
    expect(result.importedEdges).toBe(1);
    expect(result.skippedNodes).toBe(0);
    expect(result.skippedEdges).toBe(0);
    expect(result.graph.nodes[0]).toMatchObject({
      id: 'a', title: 'Alpha', type: 'idea', tags: ['x'], description: 'first',
      createdAt: 10, updatedAt: 20, position: { x: 1, y: 2, z: 3 },
      metadata: { origin: 'test' },
    });
    expect(result.graph.edges[0]).toMatchObject({
      id: 'e1', source: 'a', target: 'b', type: 'supports', label: 'backs',
      directed: true, strength: 0.8, createdAt: 30,
    });
    expect(result.graph.tags).toMatchObject([{ id: 't1', name: 'x', color: '#ff0000' }]);
  });

  it('returns a parse issue and an empty graph for malformed JSON', () => {
    for (const text of ['{"nodes":', 'not json', '']) {
      const result = importJson(text);
      expect(result.ok).toBe(false);
      expect(result.format).toBe('json');
      expect(result.issues[0]).toMatchObject({ severity: 'error', code: 'json.parse' });
      expect(result.graph).toEqual({ nodes: [], edges: [], tags: [] });
      expect(result.importedNodes).toBe(0);
      expect(result.importedEdges).toBe(0);
    }
  });

  it('rejects arrays and primitives with a shape issue', () => {
    for (const text of ['[]', 'null', '42', '"graph"']) {
      const result = importJson(text);
      expect(result.ok).toBe(false);
      expect(result.issues).toContainEqual(expect.objectContaining({ code: 'json.shape', severity: 'error' }));
      expect(result.graph.nodes).toEqual([]);
    }
  });

  it('reads nested graph envelopes and reports foreign formats as info', () => {
    const nested = JSON.stringify({
      format: 'obsidian',
      graph: { nodes: [{ id: 'x', title: 'X' }], edges: [] },
    });
    const result = importJson(nested);
    expect(result.ok).toBe(true);
    expect(result.graph.nodes.map((node) => node.id)).toEqual(['x']);
    expect(result.issues).toContainEqual(expect.objectContaining({
      severity: 'info', code: 'json.format', message: 'Imported from "obsidian" format',
    }));

    const native = importJson(JSON.stringify({
      format: 'echo-graph', nodes: [{ id: 'x', title: 'X' }], edges: [],
    }));
    expect(native.ok).toBe(true);
    expect(native.issues.some((issue) => issue.code === 'json.format')).toBe(false);
  });

  it('drops invalid records, counts skipped entries and reports validation errors', () => {
    const result = importJson(JSON.stringify({
      nodes: [
        { id: 'a', title: 'Alpha' },
        { id: ' ', title: 'Blank id' },
        { title: '   ' },
        { title: 'Gamma' },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'missing' }],
    }));

    expect(result.ok).toBe(false);
    expect(result.graph.nodes.map((node) => node.title)).toEqual(['Alpha', 'Blank id', 'Gamma']);
    expect(result.graph.edges).toEqual([]);
    expect(result.skippedNodes).toBe(1);
    expect(result.skippedEdges).toBe(1);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'node.invalid-id', 'node.missing-title', 'edge.dangling',
    ]));
  });

  it('honors options for id generation, metadata, timestamps and merging', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const text = JSON.stringify({
      nodes: [
        { title: 'No id', createdAt: 50, metadata: { keep: 'yes', nested: { drop: true } } },
        { id: 'dup', title: 'First' },
        { id: 'dup', title: 'Second' },
      ],
      edges: [],
    });

    const strict = importJson(text, {
      ...DEFAULT_IMPORT_OPTIONS,
      generateMissingIds: false,
      importMetadata: false,
      preserveTimestamps: false,
    });
    expect(strict.graph.nodes.map((node) => node.id)).toEqual(['dup']);
    expect(strict.graph.nodes[0]).toMatchObject({ title: 'Second', createdAt: 1000, metadata: {} });

    const split = importJson(text, { ...DEFAULT_IMPORT_OPTIONS, mergeById: false });
    expect(split.graph.nodes).toHaveLength(3);
    expect(split.issues.some((issue) => issue.code === 'node.id-regenerated')).toBe(true);

    const normal = importJson(text);
    expect(normal.graph.nodes[0].metadata).toEqual({ keep: 'yes' });
    expect(normal.graph.nodes[0].createdAt).toBe(50);
  });
});
