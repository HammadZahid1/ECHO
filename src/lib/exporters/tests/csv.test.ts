import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_EXPORT_OPTIONS } from '@/lib/exporters';
import { exportEdgesCsv, exportNodesCsv } from '@/lib/exporters/csv';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import { parseCsv } from '@/lib/importers/csv';
import type { GraphData } from '@/types';

afterEach(() => vi.restoreAllMocks());

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({
      id: 'a', title: 'Alpha, "Prime"', description: 'line1\nline2', type: 'concept',
      tags: ['x', 'y'], importance: 0.8, color: '#ff0000', source: 'book',
      references: ['ref-1', 'ref-2'], position: { x: 1, y: 2, z: 3 },
      createdAt: 100, updatedAt: 200,
    }),
    createNode({ id: 'b', title: 'Beta', type: 'idea', createdAt: 300, updatedAt: 400 }),
  );
  graph.edges.push(
    createEdge('a', 'b', {
      id: 'e1', type: 'supports', label: 'backs', strength: 0.75,
      description: 'quoted, "description"', createdAt: 500,
    }),
    createEdge('b', 'a', { id: 'e2', type: 'depends', label: 'needs', directed: true, strength: 0.5 }),
  );
  return graph;
}

describe('exportNodesCsv', () => {
  it('writes the documented header, CRLF rows and a safe filename', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const result = exportNodesCsv(fixture(), DEFAULT_EXPORT_OPTIONS, 'My Nodes!');

    expect(result.filename).toBe('my-nodes.csv');
    expect(result.mimeType).toBe('text/csv');
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(0);
    expect(result.content).toContain('\r\n');

    const rows = parseCsv(result.content as string);
    expect(rows[0]).toEqual([
      'id', 'title', 'description', 'type', 'tags', 'importance', 'color',
      'source', 'references', 'x', 'y', 'z', 'createdAt', 'updatedAt',
    ]);
    expect(rows[1]).toEqual([
      'a', 'Alpha, "Prime"', 'line1\nline2', 'concept', 'x|y', '0.8',
      '#ff0000', 'book', 'ref-1|ref-2', '1', '2', '3', '100', '200',
    ]);
  });

  it('escapes commas, quotes and newlines in cell values', () => {
    const content = exportNodesCsv(fixture(), DEFAULT_EXPORT_OPTIONS).content as string;
    expect(content).toContain('"Alpha, ""Prime"""');
    expect(content).toContain('"line1\nline2"');
  });

  it('leaves position and timestamp cells blank when those options are off', () => {
    const result = exportNodesCsv(fixture(), {
      ...DEFAULT_EXPORT_OPTIONS, includePositions: false, includeTimestamps: false, filename: 'nodes.csv',
    });
    expect(result.filename).toBe('nodes.csv');
    const rows = parseCsv(result.content as string);
    expect(rows[1].slice(9)).toEqual(['', '', '', '', '']);
    expect(rows[2].slice(9)).toEqual(['', '', '', '', '']);
    expect(rows[1][0]).toBe('a');
  });
});

describe('exportEdgesCsv', () => {
  it('writes relationship fields including direction and escaped descriptions', () => {
    const result = exportEdgesCsv(fixture(), DEFAULT_EXPORT_OPTIONS, 'links');

    expect(result.filename).toBe('links.csv');
    expect(result.mimeType).toBe('text/csv');
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(2);

    const rows = parseCsv(result.content as string);
    expect(rows[0]).toEqual([
      'id', 'source', 'target', 'type', 'label', 'directed', 'strength', 'description', 'createdAt',
    ]);
    expect(rows[1]).toEqual([
      'e1', 'a', 'b', 'supports', 'backs', 'false', '0.75', 'quoted, "description"', '500',
    ]);
    expect(rows[2].slice(0, 6)).toEqual(['e2', 'b', 'a', 'depends', 'needs', 'true']);
    expect(result.content).toContain('"quoted, ""description"""');
  });

  it('omits the timestamp column values when timestamps are excluded', () => {
    const result = exportEdgesCsv(fixture(), { ...DEFAULT_EXPORT_OPTIONS, includeTimestamps: false });
    const rows = parseCsv(result.content as string);
    expect(rows[1][8]).toBe('');
    expect(rows[2][8]).toBe('');
  });
});
