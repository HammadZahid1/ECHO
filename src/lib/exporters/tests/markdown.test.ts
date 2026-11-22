import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_EXPORT_OPTIONS } from '@/lib/exporters';
import { exportMarkdown } from '@/lib/exporters/markdown';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import { formatDate } from '@/lib/utils/time';
import type { GraphData } from '@/types';

afterEach(() => vi.restoreAllMocks());

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({
      id: 'a', title: 'Alpha', type: 'concept', description: 'first', tags: ['x', 'y'],
      importance: 0.8, source: 'book', metadata: { origin: 'test' },
      createdAt: 100, updatedAt: 200,
    }),
    createNode({ id: 'b', title: 'Beta', type: 'idea', importance: 0.5, createdAt: 300, updatedAt: 400 }),
  );
  graph.edges.push(createEdge('a', 'b', {
    id: 'e1', type: 'supports', label: 'backs', directed: true, strength: 0.7,
    createdAt: 500, updatedAt: 600,
  }));
  return graph;
}

describe('exportMarkdown', () => {
  it('renders a document heading, node headings and type labels', () => {
    const result = exportMarkdown(fixture(), DEFAULT_EXPORT_OPTIONS, 'Knowledge Base');

    expect(result.filename).toBe('knowledge-base.md');
    expect(result.mimeType).toBe('text/markdown');
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(1);
    expect((result.content as string).startsWith('# Knowledge Base\n\n2 nodes · 1 relationships\n')).toBe(true);
    expect(result.content).toContain('## Alpha');
    expect(result.content).toContain('## Beta');
    expect(result.content).toContain('_Concept · importance 80%_');
    expect(result.content).toContain('_Idea · importance 50%_');
    expect(result.content).toContain('first');
    expect(result.content).toContain('Source: book');
  });

  it('writes tag back-links and optional metadata blocks', () => {
    const full = exportMarkdown(fixture(), DEFAULT_EXPORT_OPTIONS);
    expect(full.content).toContain('Tags: [[#x]] [[#y]]');
    expect(full.content).toContain('Metadata:');
    expect(full.content).toContain('- origin: test');

    const withoutMetadata = exportMarkdown(fixture(), { ...DEFAULT_EXPORT_OPTIONS, includeMetadata: false });
    expect(withoutMetadata.content).not.toContain('Metadata:');
    expect(withoutMetadata.content).not.toContain('- origin: test');
    expect(withoutMetadata.content).toContain('Tags: [[#x]] [[#y]]');
  });

  it('renders directed and undirected relationship links', () => {
    const directed = exportMarkdown(fixture(), DEFAULT_EXPORT_OPTIONS);
    expect(directed.content).toContain('- → [[Beta]] — backs (Supports, 70%)');
    expect(directed.content).toContain('- ← [[Alpha]] — backs (Supports, 70%)');

    const graph = fixture();
    graph.edges.push(createEdge('a', 'b', { id: 'e2', type: 'related', label: 'link', strength: 0.5 }));
    const undirected = exportMarkdown(graph, DEFAULT_EXPORT_OPTIONS);
    expect(undirected.content).toContain('- ↔ [[Beta]] — link (Related to, 50%)');
    expect(undirected.edgeCount).toBe(2);
  });

  it('includes formatted timestamps only when requested', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const graph = createGraphData();
    graph.nodes.push(createNode({ id: 'a', title: 'Alpha' }));

    const stamped = exportMarkdown(graph, DEFAULT_EXPORT_OPTIONS);
    expect(stamped.content).toContain(`Created ${formatDate(1000)} · Updated ${formatDate(1000)}`);

    const plain = exportMarkdown(graph, { ...DEFAULT_EXPORT_OPTIONS, includeTimestamps: false });
    expect(plain.content).not.toContain('Created ');
    expect(plain.content).not.toContain('Updated ');
  });
});
