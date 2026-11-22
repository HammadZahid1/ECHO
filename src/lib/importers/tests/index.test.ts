import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/graph/validate';
import { detectFormat, importContent } from '@/lib/importers';

afterEach(() => vi.restoreAllMocks());

describe('detectFormat', () => {
  it('uses the file extension ahead of file contents', () => {
    expect(detectFormat('anything at all', 'graph.JSON')).toBe('json');
    expect(detectFormat('{"nodes":[]}', 'notes.MARKDOWN')).toBe('markdown');
    expect(detectFormat('{"nodes":[]}', 'data.md')).toBe('markdown');
    expect(detectFormat('title,x\n1,2', 'nodes.CSV')).toBe('csv-nodes');
    expect(detectFormat('source,target\n1,2', 'edges.csv')).toBe('csv-edges');
  });

  it('infers the format from content when the extension is unknown', () => {
    expect(detectFormat('  {"nodes":[]}')).toBe('json');
    expect(detectFormat('[1, 2, 3]', 'blob')).toBe('json');
    expect(detectFormat('text\n# Heading\nmore')).toBe('markdown');
    expect(detectFormat('id,title\n1,Alpha')).toBe('csv-nodes');
    expect(detectFormat('title,id\nAlpha,1')).toBe('csv-nodes');
    expect(detectFormat('name,age\nAlpha,30')).toBe('text');
    expect(detectFormat('just a few words')).toBe('text');
  });
});

describe('importContent', () => {
  it('dispatches to the importer matching the detected format', () => {
    const json = importContent(JSON.stringify({ nodes: [{ id: 'a', title: 'Alpha' }], edges: [] }), 'graph.json');
    expect(json.format).toBe('json');
    expect(json.ok).toBe(true);

    const markdown = importContent('# Heading\nbody', 'note.md');
    expect(markdown.format).toBe('markdown');
    expect(markdown.importedNodes).toBe(1);

    const text = importContent('just words', 'notes.txt');
    expect(text.format).toBe('text');
    expect(text.importedNodes).toBe(1);

    const csv = importContent('id,title\n1,Alpha', 'nodes.csv');
    expect(csv.format).toBe('csv-nodes');
    expect(csv.graph.nodes[0].title).toBe('Alpha');
  });

  it('passes node CSV context through to the edge importer', () => {
    const nodesCsv = 'id,title\n1,Alpha\n2,Beta';
    const result = importContent('source,target\n1,2', 'links.csv', DEFAULT_IMPORT_OPTIONS, nodesCsv);
    expect(result.format).toBe('csv-edges');
    expect(result.importedNodes).toBe(2);
    expect(result.importedEdges).toBe(1);
    expect(result.graph.edges[0]).toMatchObject({ source: '1', target: '2' });
  });

  it('forwards import options to the selected importer', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const text = JSON.stringify({
      nodes: [{ id: 'a', title: 'Alpha', metadata: { origin: 'test' } }],
      edges: [],
    });

    const stripped = importContent(text, 'graph.json', {
      ...DEFAULT_IMPORT_OPTIONS, importMetadata: false, preserveTimestamps: false,
    });
    expect(stripped.graph.nodes[0].metadata).toEqual({});
    expect(stripped.graph.nodes[0].createdAt).toBe(1000);

    const kept = importContent(text, 'graph.json');
    expect(kept.graph.nodes[0].metadata).toEqual({ origin: 'test' });
  });

  it('falls back to the plain-text importer for unrecognized content', () => {
    const result = importContent('   ', 'mystery.bin');
    expect(result.format).toBe('text');
    expect(result.ok).toBe(false);
    expect(result.graph.nodes).toEqual([]);
  });
});
