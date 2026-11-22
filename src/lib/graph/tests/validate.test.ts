import { describe, expect, it } from 'vitest';
import {
  DEFAULT_IMPORT_OPTIONS,
  findDanglingEdges,
  findDuplicateIds,
  normalizeGraph,
  validateEdge,
  validateGraph,
  validateNode,
} from '@/lib/graph/validate';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';

describe('validateNode', () => {
  it('accepts a factory-built node and rejects non-objects', () => {
    expect(validateNode(createNode({ id: 'a', title: 'Alpha' }))).toEqual([]);
    expect(validateNode(null, 'node')).toEqual([
      { severity: 'error', code: 'node.not-object', message: 'Node must be an object', path: 'node' },
    ]);
  });

  it('flags required-field errors and optional-field warnings with paths', () => {
    const issues = validateNode({
      id: '  ',
      title: '',
      type: 'alien',
      tags: [1],
      importance: Number.NaN,
      color: 'red',
      position: { x: 1, y: 2 },
      metadata: [],
    }, 'nodes[0]');
    const codes = issues.map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      'node.invalid-id',
      'node.missing-title',
      'node.unknown-type',
      'node.invalid-tags',
      'node.invalid-importance',
      'node.invalid-color',
      'node.invalid-position',
      'node.invalid-metadata',
    ]));
    expect(issues.find((issue) => issue.code === 'node.missing-title')?.severity).toBe('error');
    expect(issues.find((issue) => issue.code === 'node.invalid-id')?.path).toBe('nodes[0].id');
    expect(issues.find((issue) => issue.code === 'node.unknown-type')?.severity).toBe('warning');
  });
});

describe('validateEdge', () => {
  it('accepts a factory-built edge and rejects non-objects', () => {
    expect(validateEdge(createEdge('a', 'b', { id: 'e1' }))).toEqual([]);
    expect(validateEdge('nope')).toEqual([
      { severity: 'error', code: 'edge.not-object', message: 'Edge must be an object', path: 'edge' },
    ]);
  });

  it('flags missing endpoints, unknown types and non-numeric strengths', () => {
    const issues = validateEdge({ type: 'weird', strength: Number.NaN });
    expect(issues.map((issue) => issue.code)).toEqual([
      'edge.missing-source',
      'edge.missing-target',
      'edge.unknown-type',
      'edge.invalid-strength',
    ]);
    expect(issues[0]?.severity).toBe('error');
  });
});

describe('findDuplicateIds and findDanglingEdges', () => {
  it('finds each duplicated id once', () => {
    expect(findDuplicateIds([
      createNode({ id: 'a', title: 'One' }),
      createNode({ id: 'b', title: 'Two' }),
      createNode({ id: 'a', title: 'Three' }),
      createNode({ id: 'a', title: 'Four' }),
    ])).toEqual(['a']);
    expect(findDuplicateIds([createNode({ id: 'a' })])).toEqual([]);
  });

  it('returns only edges with at least one missing endpoint', () => {
    const graph = createGraphData();
    graph.nodes.push(createNode({ id: 'a', title: 'Alpha' }));
    graph.edges.push(
      createEdge('a', 'a', { id: 'ok' }),
      createEdge('a', 'ghost', { id: 'bad-target' }),
      createEdge('ghost', 'a', { id: 'bad-source' }),
    );
    expect(findDanglingEdges(graph).map((edge) => edge.id)).toEqual(['bad-target', 'bad-source']);
  });
});

describe('normalizeGraph', () => {
  const input = {
    nodes: [
      {
        id: 'a',
        title: 'Alpha',
        type: 'concept',
        tags: ['X', 'x'],
        description: 'first',
        createdAt: 100,
        updatedAt: 200,
        position: { x: 1, y: 2, z: 3 },
        metadata: { keep: 'yes', nested: { drop: true } },
      },
      { id: 'a', title: 'Alpha merged', type: 'idea', tags: ['y'] },
      { id: 'b', title: 'Beta', type: 'alien', tags: 'not-an-array' },
      { title: 'Generated', type: 'note' },
      { id: 'blank', title: '   ' },
    ],
    edges: [
      { id: 'e1', source: 'a', target: 'b', type: 'weird', strength: 5 },
      { id: 'e2', source: 'a', target: 'missing', type: 'related' },
    ],
    tags: [{ name: 'x', color: 'nope' }],
  };

  it('repairs nodes and edges, merging duplicate ids and dropping invalid records', () => {
    const { graph, issues } = normalizeGraph(input);
    const codes = issues.map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      'node.id-merged',
      'node.unknown-type',
      'node.invalid-tags',
      'node.missing-title',
      'edge.unknown-type',
      'edge.dangling',
    ]));
    expect(issues.filter((issue) => issue.severity === 'error').map((issue) => issue.code).sort())
      .toEqual(['edge.dangling', 'node.missing-title']);

    expect(graph.nodes).toHaveLength(3);
    const merged = graph.nodes.find((node) => node.id === 'a');
    expect(merged).toMatchObject({ title: 'Alpha merged', type: 'idea', tags: ['y'], createdAt: 100 });
    expect(graph.nodes.find((node) => node.id === 'b')).toMatchObject({ type: 'concept', tags: [] });
    const generated = graph.nodes.find((node) => node.title === 'Generated');
    expect(generated?.id).toBeTruthy();
    expect(generated?.type).toBe('note');

    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({ id: 'e1', source: 'a', target: 'b', type: 'related', strength: 1 });
    expect(graph.tags).toHaveLength(1);
    expect(graph.tags[0]?.color).toBe('#4fd8e8');
  });

  it('honors import options for id generation, merging and metadata', () => {
    const regenerated = normalizeGraph(input, { ...DEFAULT_IMPORT_OPTIONS, mergeById: false });
    expect(regenerated.graph.nodes).toHaveLength(4);
    expect(regenerated.issues.some((issue) => issue.code === 'node.id-regenerated')).toBe(true);

    const noIds = normalizeGraph(input, { ...DEFAULT_IMPORT_OPTIONS, generateMissingIds: false });
    expect(noIds.graph.nodes.map((node) => node.id).sort()).toEqual(['a', 'b']);

    const noMetadata = normalizeGraph(input, { ...DEFAULT_IMPORT_OPTIONS, importMetadata: false });
    expect(noMetadata.graph.nodes[0]?.metadata).toEqual({});
  });

  it('returns an empty graph with warnings when no arrays are supplied', () => {
    const { graph, issues } = normalizeGraph(null);
    expect(graph).toEqual({ nodes: [], edges: [], tags: [] });
    expect(issues.map((issue) => issue.code)).toEqual(['graph.nodes-missing', 'graph.edges-missing']);
  });
});

describe('validateGraph', () => {
  it('reports duplicate node ids and dangling edges as errors', () => {
    const graph = createGraphData();
    graph.nodes.push(
      createNode({ id: 'a', title: 'One' }),
      createNode({ id: 'a', title: 'Two' }),
    );
    graph.edges.push(createEdge('a', 'ghost', { id: 'bad' }));
    expect(validateGraph(graph)).toEqual([
      { severity: 'error', code: 'graph.duplicate-node-id', message: 'Duplicate node id "a"', path: 'a' },
      { severity: 'error', code: 'graph.dangling-edge', message: 'Edge "bad" references a missing node', path: 'bad' },
    ]);
    expect(validateGraph(createGraphData())).toEqual([]);
  });
});
