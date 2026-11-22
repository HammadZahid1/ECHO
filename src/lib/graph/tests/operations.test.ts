import { describe, expect, it } from 'vitest';
import {
  addEdge,
  addNode,
  assignTag,
  duplicateNode,
  removeEdge,
  removeNode,
  setNodePositions,
  togglePin,
  unassignTag,
  updateEdge,
  updateNode,
} from '@/lib/graph/operations';
import { createEdge, createGraphData, createNode } from '@/lib/graph/factory';
import type { GraphData } from '@/types';

function fixture(): GraphData {
  const graph = createGraphData();
  graph.nodes.push(
    createNode({ id: 'a', title: 'Alpha', tags: ['x'], createdAt: 100, updatedAt: 100, position: { x: 1, y: 2, z: 3 }, pinned: true }),
    createNode({ id: 'b', title: 'Beta', tags: ['y'], createdAt: 200, updatedAt: 200 }),
  );
  graph.edges.push(createEdge('a', 'b', { id: 'e1', strength: 0.5, createdAt: 100, updatedAt: 100 }));
  return graph;
}

describe('node operations', () => {
  it('adds a node but refuses to add a duplicate id', () => {
    const graph = fixture();
    const added = addNode(graph, createNode({ id: 'c', title: 'Gamma' }));
    expect(added.nodes.map((node) => node.id)).toEqual(['a', 'b', 'c']);
    expect(addNode(graph, createNode({ id: 'a', title: 'Other' }))).toBe(graph);
  });

  it('updates fields while preserving the id and honoring an explicit updatedAt', () => {
    const graph = fixture();
    const updated = updateNode(graph, 'a', { title: 'Renamed', id: 'hacked', updatedAt: 999 });
    expect(updated.nodes[0]?.title).toBe('Renamed');
    expect(updated.nodes[0]?.id).toBe('a');
    expect(updated.nodes[0]?.updatedAt).toBe(999);
    expect(updateNode(graph, 'missing', { title: 'Noop' })).toBe(graph);
  });

  it('removes a node together with all of its incident edges', () => {
    const graph = fixture();
    const removed = removeNode(graph, 'a');
    expect(removed.nodes.map((node) => node.id)).toEqual(['b']);
    expect(removed.edges).toEqual([]);
    expect(removeNode(graph, 'missing')).toBe(graph);
  });

  it('duplicates a node with a fresh id, shifted position and copied properties', () => {
    const graph = fixture();
    const result = duplicateNode(graph, 'a');
    expect(result.newId).not.toBeNull();
    expect(result.newId).not.toBe('a');
    expect(result.graph.nodes).toHaveLength(3);
    const copy = result.graph.nodes.find((node) => node.id === result.newId);
    expect(copy?.title).toBe('Alpha copy');
    expect(copy?.position).toEqual({ x: 7, y: 6, z: 3 });
    expect(copy?.tags).toEqual(['x']);
    expect(copy?.pinned).toBe(false);
    expect(result.graph.nodes[0]?.position).toEqual({ x: 1, y: 2, z: 3 });

    const missing = duplicateNode(graph, 'missing');
    expect(missing.newId).toBeNull();
    expect(missing.graph).toBe(graph);
  });
});

describe('edge operations', () => {
  it('adds valid edges and rejects duplicates, self edges and missing endpoints', () => {
    const graph = fixture();
    const added = addEdge(graph, createEdge('b', 'a', { id: 'e2' }));
    expect(added.edges.map((edge) => edge.id)).toEqual(['e1', 'e2']);
    expect(addEdge(graph, createEdge('a', 'b', { id: 'e1' }))).toBe(graph);
    expect(addEdge(graph, createEdge('a', 'a', { id: 'loop' }))).toBe(graph);
    expect(addEdge(graph, createEdge('a', 'ghost', { id: 'bad' }))).toBe(graph);
  });

  it('updates an edge without changing its id and removes edges by id', () => {
    const graph = fixture();
    const updated = updateEdge(graph, 'e1', { label: 'supports', strength: 0.9, updatedAt: 777 });
    expect(updated.edges[0]).toMatchObject({ id: 'e1', label: 'supports', strength: 0.9, updatedAt: 777 });
    expect(updateEdge(graph, 'missing', { label: 'noop' })).toBe(graph);

    const removed = removeEdge(graph, 'e1');
    expect(removed.edges).toEqual([]);
    expect(removed.nodes).toHaveLength(2);
    expect(removeEdge(graph, 'missing')).toBe(graph);
  });
});

describe('position, pin and tag operations', () => {
  it('sets positions on unpinned nodes only and skips unknown ids', () => {
    const graph = fixture();
    const target = { x: 9, y: 8, z: 7 };
    const moved = setNodePositions(graph, new Map([['a', target], ['b', target], ['ghost', target]]));
    expect(moved.nodes[0]?.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(moved.nodes[1]?.position).toEqual(target);
    expect(setNodePositions(graph, new Map([['ghost', target]]))).toBe(graph);
  });

  it('toggles the pinned flag for an existing node only', () => {
    const graph = fixture();
    const toggled = togglePin(graph, 'a');
    expect(toggled.nodes[0]?.pinned).toBe(false);
    expect(togglePin(toggled, 'a').nodes[0]?.pinned).toBe(true);
    expect(togglePin(graph, 'missing')).toBe(graph);
  });

  it('assigns normalized tags once and unassigns them from a single node', () => {
    const graph = fixture();
    const tagged = assignTag(graph, 'a', '  fresh  ');
    expect(tagged.nodes[0]?.tags).toEqual(['x', 'fresh']);
    expect(tagged.tags.map((tag) => tag.name)).toEqual(['fresh']);
    expect(assignTag(tagged, 'a', 'fresh')).toBe(tagged);
    expect(assignTag(graph, 'a', '   ')).toBe(graph);

    const untagged = unassignTag(tagged, 'a', 'x');
    expect(untagged.nodes[0]?.tags).toEqual(['fresh']);
    expect(untagged.nodes[1]?.tags).toEqual(['y']);
    expect(untagged.tags.map((tag) => tag.name)).toEqual(['fresh']);
  });
});
