import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_EXPORT_OPTIONS } from '@/lib/exporters';
import { exportSvg } from '@/lib/exporters/svg';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

afterEach(() => vi.restoreAllMocks());

const markup = (result: { content: string | Blob }): string => result.content as string;

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha <A> & "B\'', importance: 0.8, color: '#ff0000', position: { x: 0, y: 0, z: -10 } }),
    createNode({ id: 'b', title: 'Beta', importance: 0.5, position: { x: 10, y: 5, z: 10 } }),
  );
  graph.edges.push(createEdge('a', 'b', { id: 'e1', strength: 0.8, label: 'supports' }));
  return graph;
}

describe('exportSvg', () => {
  it('emits valid SVG scaffolding and escapes XML-sensitive text', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const result = exportSvg(fixture(), DEFAULT_EXPORT_OPTIONS, 'Graph & <Test>');
    const content = markup(result);

    expect(result.filename).toBe('graph-test.svg');
    expect(result.mimeType).toBe('image/svg+xml');
    expect(content.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">')).toBe(true);
    expect(content).toContain('<rect width="100%" height="100%" fill="#08090b"/>');
    expect(content).toContain('<title>Graph &amp; &lt;Test&gt;</title>');
    expect(content).toContain('Alpha &lt;A&gt; &amp; &quot;B&apos;');
    expect(content).not.toContain('<A> & "B');
    expect(content.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('draws one line per edge and one circle per node', () => {
    const result = exportSvg(fixture(), DEFAULT_EXPORT_OPTIONS);
    const content = markup(result);
    expect(result.nodeCount).toBe(2);
    expect(result.edgeCount).toBe(1);
    expect(content.match(/<line /g)).toHaveLength(result.edgeCount);
    expect(content.match(/<circle /g)).toHaveLength(result.nodeCount);
    expect(content).toContain('stroke-opacity="0.60"');
    expect(content).toContain('r="13.8"');
    expect(content).toContain('fill="#ff0000"');
  });

  it('omits labels when a selection is exported without pretty mode', () => {
    const all = markup(exportSvg(fixture(), DEFAULT_EXPORT_OPTIONS));
    expect(all.match(/<text /g)).toHaveLength(2);

    const unlabeled = markup(exportSvg(fixture(), {
      ...DEFAULT_EXPORT_OPTIONS, scope: 'selected', nodeIds: ['a', 'b'], pretty: false,
    }));
    expect(unlabeled.match(/<text /g)).toBeNull();
    expect(unlabeled.match(/<circle /g)).toHaveLength(2);

    const pretty = markup(exportSvg(fixture(), {
      ...DEFAULT_EXPORT_OPTIONS, scope: 'selected', nodeIds: ['a', 'b'], pretty: true,
    }));
    expect(pretty.match(/<text /g)).toHaveLength(2);
  });

  it('applies node selection to the counts and drawn shapes', () => {
    const result = exportSvg(fixture(), { ...DEFAULT_EXPORT_OPTIONS, scope: 'selected', nodeIds: ['a'] });
    const content = markup(result);
    expect(result.nodeCount).toBe(1);
    expect(result.edgeCount).toBe(0);
    expect(content.match(/<circle /g)).toHaveLength(1);
    expect(content.match(/<line /g)).toBeNull();
    expect(content).not.toContain('>Beta</text>');
  });

  it('produces identical markup for repeated exports of the same graph', () => {
    const graph = fixture();
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    const first = exportSvg(graph, DEFAULT_EXPORT_OPTIONS);
    now.mockReturnValue(2000);
    const second = exportSvg(graph, DEFAULT_EXPORT_OPTIONS);
    expect(markup(second)).toBe(markup(first));
  });
});
