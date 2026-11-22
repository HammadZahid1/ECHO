import { describe, expect, it } from 'vitest';
import { buildDocument, buildIndex } from '@/lib/search/indexer';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({
      id: 'a',
      title: 'Café Quantum',
      description: 'Field Theory Notes',
      type: 'research',
      tags: ['Machine Learning', 'Physics'],
      createdAt: 100,
      updatedAt: 200,
      importance: 0.9,
      metadata: { author: 'Ada', draft: null, count: 3 },
    }),
    createNode({ id: 'b', title: 'Neighbor', description: '', createdAt: 300, updatedAt: 400 }),
    createNode({ id: 'c', title: 'Isolated', createdAt: 500, updatedAt: 600 }),
  );
  graph.edges.push(
    createEdge('a', 'b', { id: 'e1', label: 'Supports', type: 'supports' }),
    createEdge('b', 'a', { id: 'e2', label: 'Depends On', type: 'depends' }),
    createEdge('b', 'c', { id: 'e3', label: 'Links', type: 'related' }),
  );
  return graph;
}

describe('buildDocument', () => {
  it('normalizes text fields and flattens metadata locally', () => {
    const graph = fixture();
    const document = buildDocument(graph.nodes[0], graph);

    expect(document.normalizedTitle).toBe('cafe quantum');
    expect(document.description).toBe('field theory notes');
    expect(document.type).toBe('research');
    expect(document.tags).toEqual(['machine learning', 'physics']);
    expect(document.metadataText).toContain('author ada');
    expect(document.metadataText).toContain('draft');
    expect(document.metadataText).toContain('count 3');
    expect(document.createdAt).toBe(100);
    expect(document.updatedAt).toBe(200);
    expect(document.importance).toBe(0.9);
  });

  it('collects relationship text only from edges touching the node', () => {
    const graph = fixture();
    const first = buildDocument(graph.nodes[0], graph);
    const third = buildDocument(graph.nodes[2], graph);

    expect(first.relationshipText).toContain('supports');
    expect(first.relationshipText).toContain('depends');
    expect(first.relationshipText).not.toContain('links');

    expect(third.relationshipText).toContain('links related');
    expect(third.relationshipText).not.toContain('supports');
  });

  it('keeps type and metadata in searchText but out of the token set', () => {
    const graph = fixture();
    const document = buildDocument(graph.nodes[0], graph);

    expect(document.searchText).toContain(document.normalizedTitle);
    expect(document.searchText).toContain(document.description);
    expect(document.searchText).toContain('machine learning');
    expect(document.searchText).toContain('research');
    expect(document.searchText).toContain('author ada');
    expect(document.searchText).toContain('supports');

    expect(document.tokens.has('quantum')).toBe(true);
    expect(document.tokens.has('machine')).toBe(true);
    expect(document.tokens.has('supports')).toBe(true);
    expect(document.tokens.has('research')).toBe(false);
    expect(document.tokens.has('author')).toBe(false);
  });
});

describe('buildIndex', () => {
  it('creates one document per node keyed by node id', () => {
    const index = buildIndex(fixture());
    expect([...index.keys()]).toEqual(['a', 'b', 'c']);
    expect(index.get('a')?.normalizedTitle).toBe('cafe quantum');
    expect(index.get('b')?.relationshipText).toContain('supports');
    expect(index.get('c')?.relationshipText).toContain('links related');
  });

  it('returns an empty map for an empty graph', () => {
    const index = buildIndex(createGraphData());
    expect(index.size).toBe(0);
    expect([...index.values()]).toEqual([]);
  });

  it('snapshot-isolates documents from later graph mutations', () => {
    const graph = fixture();
    const index = buildIndex(graph);
    const snapshot = index.get('a');

    graph.nodes[0].title = 'Mutated title';
    graph.edges.length = 0;

    expect(snapshot?.title).toBe('Café Quantum');
    expect(snapshot?.searchText).toContain('supports');
    expect(index.get('a')?.title).toBe('Café Quantum');
  });
});
