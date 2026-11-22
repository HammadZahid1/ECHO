import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_EXPORT_OPTIONS } from '@/lib/exporters';
import { exportJson, selectExportGraph } from '@/lib/exporters/json';
import { createEdge, createGraphData, createNode, createTag } from '@/lib/graph/factory';
import { importJson } from '@/lib/importers/json';
import type { GraphData } from '@/types';

afterEach(() => vi.restoreAllMocks());

interface Payload {
  format: string;
  version: number;
  exportedAt: number;
  name: string;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  tags: Record<string, unknown>[];
}

const payloadOf = (content: string | Blob): Payload => JSON.parse(content as string) as Payload;

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({
      id: 'a', title: 'Alpha', type: 'concept', tags: ['x'], description: 'first',
      importance: 0.8, createdAt: 100, updatedAt: 200, position: { x: 1, y: 2, z: 3 },
      metadata: { origin: 'test', priority: 2 }, collectionIds: ['c1'],
    }),
    createNode({
      id: 'b', title: 'Beta', type: 'idea', tags: ['y'], createdAt: 300,
      updatedAt: 400, position: { x: 4, y: 5, z: 6 },
    }),
  );
  graph.edges.push(createEdge('a', 'b', {
    id: 'e1', type: 'supports', label: 'backs', directed: true,
    strength: 0.75, createdAt: 500, updatedAt: 600, metadata: { source: 'manual' },
  }));
  graph.tags.push(createTag('x', { id: 't1', color: '#ff0000', createdAt: 700 }));
  return graph;
}

describe('exportJson', () => {
  it('emits format metadata with a safe filename and pretty content', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    const result = exportJson(fixture(), DEFAULT_EXPORT_OPTIONS, 'Test Map');

    expect(result.filename).toBe('test-map.json');
    expect(result.mimeType).toBe('application/json');
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(1);
    expect(result.content).toContain('\n  "format"');

    const payload = payloadOf(result.content);
    expect(payload).toMatchObject({ format: 'echo-graph', version: 1, exportedAt: 1234, name: 'Test Map' });
    expect(payload.nodes[0]).toMatchObject({
      id: 'a', title: 'Alpha', position: { x: 1, y: 2, z: 3 },
      createdAt: 100, updatedAt: 200, metadata: { origin: 'test', priority: 2 },
    });
    expect(payload.edges[0]).toMatchObject({
      id: 'e1', source: 'a', target: 'b', type: 'supports',
      label: 'backs', directed: true, strength: 0.75,
    });
    expect(payload.tags).toMatchObject([{ id: 't1', name: 'x', color: '#ff0000' }]);
  });

  it('round-trips through importJson without losing graph data', () => {
    const result = exportJson(fixture(), DEFAULT_EXPORT_OPTIONS, 'round-trip');
    const imported = importJson(result.content as string);

    expect(imported.ok).toBe(true);
    expect(imported.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(imported.graph.nodes).toHaveLength(2);
    expect(imported.graph.nodes[0]).toMatchObject({
      id: 'a', title: 'Alpha', type: 'concept', description: 'first', tags: ['x'],
      createdAt: 100, updatedAt: 200, position: { x: 1, y: 2, z: 3 },
      metadata: { origin: 'test', priority: 2 },
    });
    expect(imported.graph.edges[0]).toMatchObject({
      id: 'e1', source: 'a', target: 'b', type: 'supports', label: 'backs',
      directed: true, strength: 0.75, createdAt: 500,
    });
    expect(imported.graph.tags[0]).toMatchObject({ id: 't1', name: 'x', color: '#ff0000', createdAt: 700 });
  });

  it('omits positions, timestamps and metadata when requested', () => {
    const result = exportJson(fixture(), {
      ...DEFAULT_EXPORT_OPTIONS,
      includePositions: false,
      includeTimestamps: false,
      includeMetadata: false,
      pretty: false,
      filename: 'custom.json',
    });
    expect(result.filename).toBe('custom.json');
    expect(result.content).not.toContain('\n');

    const payload = payloadOf(result.content);
    expect(payload.exportedAt).toEqual(expect.any(Number));
    for (const node of payload.nodes) {
      expect(node).not.toHaveProperty('position');
      expect(node).not.toHaveProperty('createdAt');
      expect(node).not.toHaveProperty('updatedAt');
      expect(node).not.toHaveProperty('metadata');
    }
    for (const edge of payload.edges) {
      expect(edge).not.toHaveProperty('createdAt');
      expect(edge).not.toHaveProperty('updatedAt');
      expect(edge).not.toHaveProperty('metadata');
    }
  });

  it('selects nodes and edges by scope', () => {
    const graph = fixture();
    expect(selectExportGraph(graph, { ...DEFAULT_EXPORT_OPTIONS, scope: 'all' })).toBe(graph);

    const onlyAlpha = exportJson(graph, { ...DEFAULT_EXPORT_OPTIONS, scope: 'selected', nodeIds: ['a'] });
    expect(onlyAlpha.nodeCount).toBe(1);
    expect(onlyAlpha.edgeCount).toBe(0);
    expect(payloadOf(onlyAlpha.content).nodes.map((node) => node.id)).toEqual(['a']);

    const both = exportJson(graph, { ...DEFAULT_EXPORT_OPTIONS, scope: 'selected', nodeIds: ['a', 'b'] });
    expect(both.nodeCount).toBe(2);
    expect(both.edgeCount).toBe(1);

    const cluster = exportJson(graph, { ...DEFAULT_EXPORT_OPTIONS, scope: 'cluster', nodeIds: ['a'] });
    expect(cluster.nodeCount).toBe(1);
    expect(cluster.edgeCount).toBe(0);

    const filtered = exportJson(graph, { ...DEFAULT_EXPORT_OPTIONS, scope: 'filtered' });
    expect(filtered.nodeCount).toBe(2);
    expect(filtered.edgeCount).toBe(1);
  });
});
