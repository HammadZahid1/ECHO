import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/graph/validate';
import { importPlainText, parsePlainText } from '@/lib/importers/plaintext';

afterEach(() => vi.restoreAllMocks());

describe('parsePlainText', () => {
  it('splits blank-line blocks into notes with titles, tags and descriptions', () => {
    const parsed = parsePlainText('Alpha\n- tag-one\n#tag:tag-two\nA description line\n\nBeta\nAnother note');

    expect(parsed.title).toBe('Alpha');
    expect(parsed.nodes.map((node) => node.title)).toEqual(['Alpha', 'Beta']);
    expect(parsed.nodes[0]).toMatchObject({
      type: 'note', tags: ['tag-one', 'tag-two'], description: 'A description line',
    });
    expect(parsed.nodes[1].description).toBe('Another note');
    expect(parsed.tags).toEqual(['tag-one', 'tag-two']);
  });

  it('strips colon titles and truncates long first lines', () => {
    const longLine = 'x'.repeat(100);
    const parsed = parsePlainText(`Topic:\nDetail\n\n${longLine}`);

    expect(parsed.nodes[0].title).toBe('Topic');
    expect(parsed.nodes[0].description).toBe('Detail');
    expect(parsed.nodes[1].title).toBe(`${'x'.repeat(59)}…`);
    expect(parsed.nodes[1].description).toBe(longLine);
  });

  it('extracts relations only when relation parsing is enabled', () => {
    const text = 'Seed\nfirst note\n\nGrowth\nsecond note\n\nSeed -> Growth\nbridge note';
    const withRelations = parsePlainText(text, DEFAULT_IMPORT_OPTIONS);
    expect(withRelations.edges).toEqual([{
      sourceIndex: 0, targetIndex: 1, label: 'relates to', type: 'related',
    }]);

    const withoutRelations = parsePlainText(text, { ...DEFAULT_IMPORT_OPTIONS, relationParsing: false });
    expect(withoutRelations.edges).toEqual([]);
    expect(withoutRelations.nodes).toHaveLength(3);
  });

  it('recognizes causal relations with explicit labels', () => {
    const parsed = parsePlainText('Seed\nfirst\n\nGrowth\nsecond\n\nSeed causes Growth: direct cause\nlink');
    expect(parsed.edges).toEqual([{
      sourceIndex: 0, targetIndex: 1, label: 'direct cause', type: 'causes',
    }]);
  });
});

describe('importPlainText', () => {
  it('normalizes parsed notes and relations into a graph', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const result = importPlainText('Seed\nfirst\n\nGrowth\nsecond\n\nSeed -> Growth\nbridge');

    expect(result.ok).toBe(true);
    expect(result.format).toBe('text');
    expect(result.importedNodes).toBe(3);
    expect(result.importedEdges).toBe(1);
    expect(result.graph.nodes.every((node) => node.createdAt === 1000)).toBe(true);
    expect(result.graph.edges[0]).toMatchObject({
      source: result.graph.nodes[0].id,
      target: result.graph.nodes[1].id,
      label: 'relates to', type: 'related',
    });
    expect(result.issues).toEqual([]);
  });

  it('returns an empty result for empty input', () => {
    expect(parsePlainText('')).toEqual({ title: 'Imported text', nodes: [], edges: [], tags: [] });
    const result = importPlainText('');
    expect(result.ok).toBe(false);
    expect(result.graph).toEqual({ nodes: [], edges: [], tags: [] });
    expect(result.importedNodes).toBe(0);
    expect(result.importedEdges).toBe(0);
    expect(result.issues).toEqual([]);
  });
});
