import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/graph/validate';
import { importCsvEdges, importCsvNodes, parseCsv } from '@/lib/importers/csv';

afterEach(() => vi.restoreAllMocks());

describe('parseCsv', () => {
  it('parses quoted fields, escaped quotes and multi-line cells', () => {
    const rows = parseCsv('id,title,description\r\n1,"Alpha, ""Prime""","line one\nline two"\r\n\r\n2,Beta,\r\n');
    expect(rows).toEqual([
      ['id', 'title', 'description'],
      ['1', 'Alpha, "Prime"', 'line one\nline two'],
      ['2', 'Beta', ''],
    ]);
  });

  it('supports custom delimiters and trims unquoted cells', () => {
    expect(parseCsv('id ; title\n 1 ; Alpha \n', ';')).toEqual([
      ['id', 'title'],
      ['1', 'Alpha'],
    ]);
  });
});

describe('importCsvNodes', () => {
  it('normalizes headers and maps fields, tags, positions and metadata', () => {
    vi.spyOn(Date, 'now').mockReturnValue(999);
    const csv = [
      'id,title,description,tags,importance,x,y,z,pinned,createdAt,metadata',
      '1,"Alpha, ""Prime""",first,"x|y",0.8,10,20,30,YES,100,"origin:test"',
      '2,Beta,,z,,,,,,200,',
    ].join('\n');

    const result = importCsvNodes(csv);
    expect(result.ok).toBe(true);
    expect(result.format).toBe('csv-nodes');
    expect(result.importedNodes).toBe(2);
    expect(result.importedEdges).toBe(0);
    expect(result.graph.nodes[0]).toMatchObject({
      id: '1', title: 'Alpha, "Prime"', description: 'first', tags: ['x', 'y'],
      importance: 0.8, position: { x: 10, y: 20, z: 30 }, pinned: true,
      createdAt: 100, updatedAt: 999, metadata: { csv: 'origin:test' },
    });
    expect(result.graph.nodes[1]).toMatchObject({
      id: '2', title: 'Beta', tags: ['z'], pinned: false,
      createdAt: 200, position: { x: 0, y: 0, z: 0 },
    });
  });

  it('reports a missing title column and does not invent nodes', () => {
    const result = importCsvNodes('id,name\n1,Alpha\n');
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({
      severity: 'error', code: 'csv.missing-column', message: 'Missing required column: title', path: 'header',
    }));
    expect(result.graph.nodes).toEqual([]);
    expect(result.skippedNodes).toBe(1);
  });

  it('skips blank titles and merges repeated ids', () => {
    const result = importCsvNodes('id,title,importance\n1,\n2,Beta,0.25\n2,Beta again,0.75');
    expect(result.graph.nodes).toHaveLength(1);
    expect(result.graph.nodes[0]).toMatchObject({ id: '2', title: 'Beta again', importance: 0.75 });
    expect(result.skippedNodes).toBe(2);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'node.missing-title', 'node.id-merged',
    ]));
  });

  it('honors the importMetadata option', () => {
    const csv = 'id,title,metadata\n1,Alpha,"origin:test"';
    expect(importCsvNodes(csv).graph.nodes[0].metadata).toEqual({ csv: 'origin:test' });
    expect(importCsvNodes(csv, { ...DEFAULT_IMPORT_OPTIONS, importMetadata: false }).graph.nodes[0].metadata).toEqual({});
  });

  it('reports an empty CSV instead of throwing', () => {
    const result = importCsvNodes('');
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ severity: 'error', code: 'csv.empty' }));
    expect(result.graph).toEqual({ nodes: [], edges: [], tags: [] });
  });
});

describe('importCsvEdges', () => {
  const nodesCsv = 'id,title\n1,Alpha\n2,Beta';

  it('imports edges against a supplied node CSV', () => {
    const csv = 'id,source,target,type,label,directed,strength,description\ne1,1,2,depends,needs,TRUE,0.9,"uses, heavily"';
    const result = importCsvEdges(csv, nodesCsv);

    expect(result.ok).toBe(true);
    expect(result.format).toBe('csv-edges');
    expect(result.importedNodes).toBe(2);
    expect(result.importedEdges).toBe(1);
    expect(result.skippedEdges).toBe(0);
    expect(result.graph.edges[0]).toMatchObject({
      id: 'e1', source: '1', target: '2', type: 'depends', label: 'needs',
      directed: true, strength: 0.9, description: 'uses, heavily',
    });
  });

  it('requires source and target columns', () => {
    const result = importCsvEdges('id,label\ne1,link', nodesCsv);
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({
      severity: 'error', code: 'csv.missing-endpoints',
    }));
    expect(result.graph.edges).toEqual([]);
    expect(result.skippedEdges).toBe(1);
  });

  it('uses defaults for omitted edge fields', () => {
    const result = importCsvEdges('source,target\n1,2', nodesCsv);
    expect(result.graph.edges[0]).toMatchObject({
      type: 'related', label: 'related', directed: false, strength: 0.5,
    });
  });

  it('drops dangling edges and records the normalization issue', () => {
    const result = importCsvEdges('source,target\n1,2');
    expect(result.graph.edges).toEqual([]);
    expect(result.issues.some((issue) => issue.code === 'edge.dangling')).toBe(true);
    expect(result.skippedEdges).toBe(1);
    expect(result.importedNodes).toBe(0);
  });

  it('reports an empty edge CSV', () => {
    const result = importCsvEdges('source,target');
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe('csv.empty');
    expect(result.importedEdges).toBe(0);
  });
});
