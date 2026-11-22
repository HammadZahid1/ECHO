import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/graph/validate';
import { importMarkdown, parseMarkdown } from '@/lib/importers/markdown';

afterEach(() => vi.restoreAllMocks());

describe('parseMarkdown', () => {
  it('builds note and concept nodes from headings', () => {
    const parsed = parseMarkdown('# Root\nintro\n## Child A\ntext\n### Grandchild\nmore\n## Child B\nlast');

    expect(parsed.title).toBe('Root');
    expect(parsed.nodes.map((node) => node.title)).toEqual(['Root', 'Child A', 'Grandchild', 'Child B']);
    expect(parsed.nodes.map((node) => node.type)).toEqual(['note', 'concept', 'concept', 'concept']);
    expect(parsed.nodes.map((node) => node.description)).toEqual(['intro', 'text', 'more', 'last']);
    expect(parsed.edges).toEqual([]);
  });

  it('extracts hashtags, wiki tags and reference links between headings', () => {
    const parsed = parseMarkdown('# Index\nSee [Detail](detail.md) and #alpha and [[beta]].\n\n## Detail\nMore text');

    expect(parsed.nodes[0]).toMatchObject({ title: 'Index', tags: ['alpha', 'beta'], references: ['detail.md'] });
    expect(parsed.nodes[1]).toMatchObject({ title: 'Detail', tags: [], references: [] });
    expect(parsed.tags).toEqual(['alpha', 'beta']);
    expect(parsed.edges).toEqual([{ sourceIndex: 0, targetIndex: 1, label: 'references', type: 'references' }]);
  });

  it('keeps a preamble paragraph and uses the default document title', () => {
    const parsed = parseMarkdown('a loose paragraph\n\n## Later\nbody');
    expect(parsed.title).toBe('Imported document');
    expect(parsed.nodes.map((node) => ({ title: node.title, type: node.type }))).toEqual([
      { title: 'Imported document', type: 'note' },
      { title: 'Later', type: 'concept' },
    ]);
    expect(parsed.edges).toEqual([]);
  });
});

describe('importMarkdown', () => {
  it('normalizes nodes, tags and reference relationships', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const result = importMarkdown('# Root\n#alpha note\n## Child\n[Root](root.md)\n## Other\n[Root](root.md)');

    expect(result.ok).toBe(true);
    expect(result.format).toBe('markdown');
    expect(result.importedNodes).toBe(3);
    expect(result.importedEdges).toBe(2);
    expect(result.skippedNodes).toBe(0);
    expect(result.skippedEdges).toBe(0);
    expect(result.graph.nodes[0]).toMatchObject({
      title: 'Root', type: 'note', tags: ['alpha'], createdAt: 1000, updatedAt: 1000,
    });
    expect(result.graph.tags).toMatchObject([{ name: 'alpha', color: '#4fd8e8' }]);

    const titles = new Map(result.graph.nodes.map((node) => [node.id, node.title]));
    expect(result.graph.edges.map((edge) => [titles.get(edge.source), titles.get(edge.target)]))
      .toEqual([['Child', 'Root'], ['Other', 'Root']]);
    expect(result.graph.edges.every((edge) => edge.type === 'references')).toBe(true);
  });

  it('gates parsed relationships with hierarchy and relation options', () => {
    const text = '# Root\n## Child\n[Root](root.md)';
    expect(importMarkdown(text).graph.edges).toHaveLength(1);

    const noEdges = importMarkdown(text, {
      ...DEFAULT_IMPORT_OPTIONS, nodeHierarchy: false, relationParsing: false,
    });
    expect(noEdges.graph.nodes).toHaveLength(2);
    expect(noEdges.graph.edges).toEqual([]);
    expect(noEdges.skippedEdges).toBe(0);

    const relationsOnly = importMarkdown(text, { ...DEFAULT_IMPORT_OPTIONS, nodeHierarchy: false });
    expect(relationsOnly.graph.edges).toHaveLength(1);

    const hierarchyOnly = importMarkdown(text, { ...DEFAULT_IMPORT_OPTIONS, relationParsing: false });
    expect(hierarchyOnly.graph.nodes).toHaveLength(2);
    expect(hierarchyOnly.graph.edges).toHaveLength(1);
  });

  it('warns and returns an empty graph for whitespace-only documents', () => {
    const result = importMarkdown('   \n');
    expect(result.ok).toBe(false);
    expect(result.format).toBe('markdown');
    expect(result.graph).toEqual({ nodes: [], edges: [], tags: [] });
    expect(result.issues).toContainEqual(expect.objectContaining({
      severity: 'warning', code: 'markdown.empty',
    }));
  });
});
