import { afterEach, describe, expect, it, vi } from 'vitest';
import { projectGraph } from '@/lib/exporters/projection';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

afterEach(() => vi.restoreAllMocks());

function fixture(): GraphData {
  const graph = createGraphData();
  const first = createNode({
    id: 'a', title: 'Alpha', importance: 0.8, color: '#ff0000',
    position: { x: 0, y: 0, z: -10 },
  });
  const second = createNode({
    id: 'b', title: 'Beta', importance: 2, position: { x: 10, y: 5, z: 10 },
  });
  second.color = undefined;
  graph.nodes.push(first, second);
  graph.edges.push(createEdge('a', 'b', { id: 'e1', strength: 0.7, label: 'supports' }));
  return graph;
}

describe('projectGraph', () => {
  it('scales positions into the padded viewport using x and z bounds', () => {
    const projection = projectGraph(fixture());

    expect(projection.width).toBe(1600);
    expect(projection.height).toBe(1000);
    expect(projection.nodes.map((node) => node.id)).toEqual(['a', 'b']);
    expect(projection.nodes[0]).toMatchObject({
      id: 'a', x: 590, y: 500, color: '#ff0000', title: 'Alpha',
    });
    expect(projection.nodes[1]).toMatchObject({
      id: 'b', x: 1010, y: 710, color: '#4fd8e8', title: 'Beta',
    });
    expect(projection.nodes[0].radius).toBeCloseTo(13.8);
    expect(projection.nodes[1].radius).toBe(18);

    for (const node of projection.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(projection.width);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(projection.height);
    }
    expect(projection.edges).toEqual([{
      id: 'e1', x1: 590, y1: 500, x2: 1010, y2: 710,
      color: '#4a5561', strength: 0.7, label: 'supports',
    }]);
  });

  it('respects custom viewport size and padding', () => {
    const projection = projectGraph(fixture(), 400, 300, 20);
    expect(projection.width).toBe(400);
    expect(projection.height).toBe(300);
    expect(projection.nodes[0]).toMatchObject({ x: 135, y: 150 });
    expect(projection.nodes[1]).toMatchObject({ x: 265, y: 215 });
  });

  it('handles empty graphs and zero spans without division errors', () => {
    expect(projectGraph(createGraphData())).toEqual({ width: 1600, height: 1000, nodes: [], edges: [] });

    const single = createGraphData();
    single.nodes.push(createNode({ id: 's', title: 'Solo', position: { x: 5, y: 5, z: 5 } }));
    const projection = projectGraph(single);
    expect(projection.nodes).toHaveLength(1);
    expect(projection.nodes[0]).toMatchObject({ x: 380, y: 80 });
    expect(Number.isFinite(projection.nodes[0].x)).toBe(true);
    expect(Number.isFinite(projection.nodes[0].y)).toBe(true);
  });

  it('is deterministic and skips edges with missing endpoints', () => {
    const graph = fixture();
    graph.edges.push(createEdge('a', 'ghost', { id: 'bad' }));
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);

    const first = projectGraph(graph);
    const second = projectGraph(graph);
    expect(second).toEqual(first);
    expect(now).not.toHaveBeenCalled();
    expect(first.edges.map((edge) => edge.id)).toEqual(['e1']);
    expect(graph.nodes[0].position).toEqual({ x: 0, y: 0, z: -10 });
  });
});
