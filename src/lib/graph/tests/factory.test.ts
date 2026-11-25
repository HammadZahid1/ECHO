import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cloneGraph,
  createCamera,
  createDefaultSettings,
  createEdge,
  createGraphData,
  createHistory,
  createNode,
  createTag,
  createWorkspace,
} from '@/lib/graph/factory';
import { NODE_TYPE_INFO, RELATIONSHIP_TYPE_INFO } from '@/lib/graph/registry';
import type { GraphData } from '@/types';

const NOW = Date.UTC(2025, 5, 1);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('graph factories', () => {
  it('creates nodes with documented defaults', () => {
    const node = createNode();

    expect(node).toMatchObject({
      id: expect.stringMatching(/^node_/),
      title: 'Untitled node',
      description: '',
      type: 'concept',
      tags: [],
      references: [],
      metadata: {},
      collectionIds: [],
      importance: 0.5,
      pinned: false,
      position: { x: 0, y: 0, z: 0 },
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(node.color).toBe(NODE_TYPE_INFO.concept.color);
    expect(node.source).toBeUndefined();
  });

  it('applies node overrides and defensively copies mutable inputs', () => {
    const tags = ['alpha'];
    const references = ['reference'];
    const metadata = { score: 7 };
    const collectionIds = ['collection'];
    const node = createNode({
      id: 'node-1',
      title: 'Named',
      description: 'Detailed',
      type: 'question',
      tags,
      references,
      metadata,
      collectionIds,
      position: { x: 5 },
      color: '#123456',
      importance: 0.9,
      pinned: true,
      source: 'manual',
      createdAt: 10,
      updatedAt: 20,
    });

    expect(node).toMatchObject({
      id: 'node-1',
      title: 'Named',
      description: 'Detailed',
      type: 'question',
      tags: ['alpha'],
      references: ['reference'],
      metadata: { score: 7 },
      collectionIds: ['collection'],
      position: { x: 5, y: 0, z: 0 },
      color: '#123456',
      importance: 0.9,
      pinned: true,
      source: 'manual',
      createdAt: 10,
      updatedAt: 20,
    });
    expect(node.color).not.toBe(NODE_TYPE_INFO.question.color);

    tags.push('beta');
    references.push('another');
    metadata.score = 99;
    collectionIds.push('second');

    expect(node.tags).toEqual(['alpha']);
    expect(node.references).toEqual(['reference']);
    expect(node.metadata).toEqual({ score: 7 });
    expect(node.collectionIds).toEqual(['collection']);
  });

  it('creates edges with documented defaults', () => {
    const edge = createEdge('source', 'target');

    expect(edge).toMatchObject({
      id: expect.stringMatching(/^edge_/),
      source: 'source',
      target: 'target',
      type: 'related',
      label: RELATIONSHIP_TYPE_INFO.related.defaultLabel,
      directed: false,
      strength: 0.5,
      metadata: {},
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(edge.description).toBeUndefined();
  });

  it('applies edge overrides and derives missing labels from the relationship type', () => {
    const metadata = { weight: 3 };
    const edge = createEdge('a', 'b', {
      id: 'edge-1',
      type: 'depends',
      label: 'needs',
      description: 'dependency',
      directed: true,
      strength: 0.2,
      metadata,
      createdAt: 1,
      updatedAt: 2,
    });
    const derived = createEdge('a', 'b', { type: 'causes', metadata });

    expect(edge).toEqual({
      id: 'edge-1',
      source: 'a',
      target: 'b',
      type: 'depends',
      label: 'needs',
      description: 'dependency',
      directed: true,
      strength: 0.2,
      metadata: { weight: 3 },
      createdAt: 1,
      updatedAt: 2,
    });
    expect(derived.label).toBe(RELATIONSHIP_TYPE_INFO.causes.defaultLabel);
    expect(derived.metadata).not.toBe(metadata);

    metadata.weight = 99;
    expect(edge.metadata).toEqual({ weight: 3 });
    expect(derived.metadata).toEqual({ weight: 3 });
  });

  it('creates tags with defaults and overrides', () => {
    const tag = createTag('alpha');

    expect(tag).toMatchObject({
      id: expect.stringMatching(/^tag_/),
      name: 'alpha',
      color: '#4fd8e8',
      createdAt: NOW,
    });
    expect(tag.description).toBeUndefined();

    expect(createTag('beta', { id: 'tag-beta', color: '#ffffff', description: 'Custom', createdAt: 42 })).toEqual({
      id: 'tag-beta',
      name: 'beta',
      color: '#ffffff',
      description: 'Custom',
      createdAt: 42,
    });
  });

  it('creates independent empty graphs and a default camera', () => {
    const graph = createGraphData();
    const another = createGraphData();

    expect(graph).toEqual({ nodes: [], edges: [], tags: [] });
    expect(graph).not.toBe(another);
    expect(graph.nodes).not.toBe(another.nodes);
    graph.nodes.push(createNode({ id: 'only-here' }));
    expect(another.nodes).toEqual([]);

    expect(createCamera()).toEqual({
      position: { x: 0, y: 4, z: 90 },
      target: { x: 0, y: 0, z: 0 },
      zoom: 1,
    });
  });

  it('creates default settings with independent nested objects', () => {
    const settings = createDefaultSettings();
    const another = createDefaultSettings();

    expect(settings.layout).toMatchObject({
      kind: 'force',
      repulsion: 68,
      attraction: 0.018,
      linkDistance: 16,
      gravity: 0.012,
      damping: 0.86,
      collision: 3.2,
      strength: 1,
      speed: 1,
      running: true,
      focusNodeId: null,
    });
    expect(settings.visual).toMatchObject({
      showLabels: true,
      showEdgeLabels: false,
      showParticles: true,
      showClusterHulls: true,
      showGrid: false,
      showStarfield: true,
      nodeScale: 1,
      edgeOpacity: 0.5,
      edgeCurvature: 0.12,
      animateFlow: true,
      quality: 'high',
      background: 'void',
    });
    expect(settings.layout).not.toBe(another.layout);
    expect(settings.visual).not.toBe(another.visual);

    settings.layout.kind = 'radial';
    settings.visual.showGrid = true;
    expect(another.layout.kind).toBe('force');
    expect(another.visual.showGrid).toBe(false);
  });

  it('creates workspaces with defaults and honours overrides', () => {
    const defaults = createWorkspace();

    expect(defaults).toMatchObject({
      id: expect.stringMatching(/^workspace_/),
      name: 'Untitled universe',
      description: '',
      createdAt: NOW,
      updatedAt: NOW,
      color: '#4fd8e8',
      collections: [],
      snapshots: [],
    });
    expect(defaults.graph).toEqual(createGraphData());
    expect(defaults.settings).toEqual(createDefaultSettings());
    expect(defaults.camera).toEqual(createCamera());

    const graph = createGraphData();
    graph.nodes.push(createNode({ id: 'seed' }));
    const settings = createDefaultSettings();
    settings.layout.kind = 'grid';
    const camera = createCamera();
    camera.zoom = 3;
    const collections = [{ id: 'c1', name: 'Group', description: '', color: '#ffffff', parentId: null, createdAt: 1, updatedAt: 1 }];

    const workspace = createWorkspace({
      id: 'ws-1',
      name: 'Named',
      description: 'Description',
      createdAt: 10,
      updatedAt: 20,
      color: '#ff0000',
      graph,
      settings,
      collections,
      camera,
    });

    expect(workspace).toMatchObject({
      id: 'ws-1',
      name: 'Named',
      description: 'Description',
      createdAt: 10,
      updatedAt: 20,
      color: '#ff0000',
      snapshots: [],
    });
    expect(workspace.graph).toBe(graph);
    expect(workspace.settings).toBe(settings);
    expect(workspace.camera).toBe(camera);
    expect(workspace.collections).toBe(collections);
  });

  it('creates empty history records with the requested limit', () => {
    const defaults = createHistory();
    const limited = createHistory(7);

    expect(defaults).toEqual({ entries: [], cursor: -1, limit: 120 });
    expect(limited).toEqual({ entries: [], cursor: -1, limit: 7 });
    expect(defaults).not.toBe(limited);
    expect(defaults.entries).not.toBe(limited.entries);
    expect(createHistory(0)).toEqual({ entries: [], cursor: -1, limit: 0 });
  });

  it('deep-clones graphs without sharing nested mutable data', () => {
    const graph: GraphData = {
      nodes: [createNode({ id: 'n1', tags: ['t'], references: ['r'], collectionIds: ['c'], metadata: { k: 1 }, position: { x: 1, y: 2, z: 3 } })],
      edges: [createEdge('n1', 'n2', { id: 'e1', metadata: { weight: 2 } })],
      tags: [createTag('t', { id: 't1', description: 'Tag' })],
    };
    const clone = cloneGraph(graph);

    expect(clone).toEqual(graph);
    expect(clone).not.toBe(graph);
    expect(clone.nodes[0]).not.toBe(graph.nodes[0]);
    expect(clone.nodes[0].position).not.toBe(graph.nodes[0].position);
    expect(clone.nodes[0].tags).not.toBe(graph.nodes[0].tags);
    expect(clone.nodes[0].references).not.toBe(graph.nodes[0].references);
    expect(clone.nodes[0].collectionIds).not.toBe(graph.nodes[0].collectionIds);
    expect(clone.nodes[0].metadata).not.toBe(graph.nodes[0].metadata);
    expect(clone.edges[0].metadata).not.toBe(graph.edges[0].metadata);
    expect(clone.tags[0]).not.toBe(graph.tags[0]);

    clone.nodes[0].position.x = 99;
    clone.nodes[0].tags.push('extra');
    clone.nodes[0].metadata.k = 99;
    clone.edges[0].metadata.weight = 99;
    clone.tags[0].name = 'changed';

    expect(graph.nodes[0].position).toEqual({ x: 1, y: 2, z: 3 });
    expect(graph.nodes[0].tags).toEqual(['t']);
    expect(graph.nodes[0].metadata).toEqual({ k: 1 });
    expect(graph.edges[0].metadata).toEqual({ weight: 2 });
    expect(graph.tags[0].name).toBe('t');
    expect(cloneGraph(createGraphData())).toEqual({ nodes: [], edges: [], tags: [] });
  });
});
