import { beforeEach, describe, expect, it } from 'vitest';
import {
  useActiveWorkspace,
  useGraph,
  useGraphStore,
} from '@/store/graphStore';
import { createEdge, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { renderHook } from '@testing-library/react';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', () => ({
  createDebouncedSaver: () => () => undefined,
  loadWorkspaces: async () => ({ workspaces: [], issues: [], available: false }),
  saveWorkspace: async () => undefined,
  deleteWorkspace: async () => undefined,
}));

function makeGraph(): GraphData {
  const stamp = { createdAt: 1_735_689_600_000, updatedAt: 1_735_689_600_000 };
  return {
    nodes: [
      createNode({ ...stamp, id: 'a', title: 'Alpha' }),
      createNode({ ...stamp, id: 'b', title: 'Beta' }),
      createNode({ ...stamp, id: 'c', title: 'Gamma' }),
    ],
    edges: [
      createEdge('a', 'b', { ...stamp, id: 'e1' }),
      createEdge('b', 'c', { ...stamp, id: 'e2' }),
    ],
    tags: [],
  };
}

const graph = makeGraph();

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-store', name: 'Store test', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds: [],
    selectedEdgeId: null,
    hoveredNodeId: null,
    focusedNodeId: null,
    connectionSourceId: null,
    connectionMode: false,
    filters: {},
    initialized: false,
    storageStatus: 'idle',
    storageMessage: '',
  });
});

function activeGraph(): GraphData {
  const state = useGraphStore.getState();
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)!.graph;
}

function activeWorkspace() {
  const state = useGraphStore.getState();
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)!;
}

function activeHistory() {
  const state = useGraphStore.getState();
  return state.histories[state.activeWorkspaceId];
}

describe('graphStore', () => {
  it('exposes selector hooks and manages the workspace lifecycle', () => {
    const workspaceHook = renderHook(() => useActiveWorkspace());
    const data = renderHook(() => useGraph());
    expect(workspaceHook.result.current.id).toBe('ws-store');
    expect(data.result.current).toBe(activeGraph());
    expect(activeGraph().nodes).toHaveLength(3);
    workspaceHook.unmount();
    data.unmount();

    const store = useGraphStore.getState();
    const createdId = store.createWorkspace('Fresh');

    expect(useGraphStore.getState().activeWorkspaceId).toBe(createdId);
    expect(activeGraph()).toEqual({ nodes: [], edges: [], tags: [] });
    expect(useGraphStore.getState().workspaces).toHaveLength(2);

    useGraphStore.getState().renameWorkspace(createdId, 'Renamed');
    useGraphStore.getState().setWorkspaceColor(createdId, '#ff0000');
    let workspace = useGraphStore.getState().workspaces.find((item) => item.id === createdId)!;
    expect(workspace.name).toBe('Renamed');
    expect(workspace.color).toBe('#ff0000');

    const copyId = useGraphStore.getState().duplicateWorkspace('ws-store');
    expect(copyId).not.toBeNull();
    expect(activeGraph().nodes).toHaveLength(3);
    expect(useGraphStore.getState().workspaces.find((item) => item.id === copyId)!.name).toBe('Store test copy');

    useGraphStore.getState().switchWorkspace('ws-store');
    expect(useGraphStore.getState().activeWorkspaceId).toBe('ws-store');
    expect(useGraphStore.getState().selectedNodeIds).toEqual([]);

    useGraphStore.getState().deleteWorkspace(createdId);
    expect(useGraphStore.getState().workspaces.map((item) => item.id)).toEqual(['ws-store', copyId]);
    useGraphStore.getState().deleteWorkspace(copyId!);
    useGraphStore.getState().deleteWorkspace('ws-store');
    expect(useGraphStore.getState().workspaces).toHaveLength(1);
  });

  it('createNode adds a default node, selects it and records history', () => {
    const id = useGraphStore.getState().createNode({ title: 'New' });

    expect(activeGraph().nodes.find((node) => node.id === id)).toMatchObject({
      title: 'New',
      type: 'concept',
      importance: 0.5,
      pinned: false,
    });
    expect(useGraphStore.getState().selectedNodeIds).toEqual([id]);
    expect(activeHistory().entries).toHaveLength(1);
    expect(activeHistory().entries[0]).toMatchObject({ kind: 'node.add', label: 'Create New', affectedNodeIds: [id] });
    expect(useGraphStore.getState().canUndo()).toBe(true);
  });

  it('undo and redo restore node edits', () => {
    useGraphStore.getState().updateNode('a', { title: 'Renamed' });
    expect(activeGraph().nodes.find((node) => node.id === 'a')!.title).toBe('Renamed');

    useGraphStore.getState().undo();
    expect(activeGraph().nodes.find((node) => node.id === 'a')!.title).toBe('Alpha');
    expect(useGraphStore.getState().canRedo()).toBe(true);

    useGraphStore.getState().redo();
    expect(activeGraph().nodes.find((node) => node.id === 'a')!.title).toBe('Renamed');
    expect(useGraphStore.getState().canRedo()).toBe(false);
  });

  it('deleteNodes removes incident edges and clears those ids from the selection', () => {
    useGraphStore.setState({ selectedNodeIds: ['a', 'b'] });

    useGraphStore.getState().deleteNodes(['b']);

    expect(activeGraph().nodes.map((node) => node.id)).toEqual(['a', 'c']);
    expect(activeGraph().edges).toEqual([]);
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['a']);
    expect(activeHistory().entries[0].kind).toBe('node.remove');
  });

  it('createEdge validates endpoints and tracks the selected edge', () => {
    const id = useGraphStore.getState().createEdge('a', 'c', { type: 'influences' });

    expect(id).not.toBeNull();
    expect(activeGraph().edges).toHaveLength(3);
    expect(activeGraph().edges[2]).toMatchObject({ id, source: 'a', target: 'c', type: 'influences' });
    expect(useGraphStore.getState().selectedEdgeId).toBe(id);

    expect(useGraphStore.getState().createEdge('a', 'a')).toBeNull();
    expect(useGraphStore.getState().createEdge('a', 'missing')).toBeNull();
    expect(activeGraph().edges).toHaveLength(3);
  });

  it('tracks selection, hover, focus, connection and filter state', () => {
    const store = useGraphStore.getState();
    store.selectNode('a');
    store.selectNode('b', true);
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['a', 'b']);

    store.selectNode('a', true);
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['b']);

    store.setHovered('c');
    store.setFocus('c');
    store.setConnectionSource('b');
    store.setConnectionMode(true);
    store.setFilters({ query: 'alpha' });

    expect(useGraphStore.getState()).toMatchObject({
      hoveredNodeId: 'c',
      focusedNodeId: 'c',
      connectionSourceId: 'b',
      connectionMode: true,
      filters: { query: 'alpha' },
    });

    store.selectEdge('e1');
    expect(useGraphStore.getState().selectedNodeIds).toEqual([]);
    expect(useGraphStore.getState().selectedEdgeId).toBe('e1');

    store.setConnectionMode(false);
    store.clearFilters();
    store.selectNode(null);
    expect(useGraphStore.getState()).toMatchObject({
      connectionSourceId: null,
      filters: {},
      selectedEdgeId: null,
      selectedNodeIds: [],
    });
  });

  it('assigns and unassigns tags, creating the tag record once', () => {
    useGraphStore.getState().assignTag('a', 'research');
    useGraphStore.getState().assignTag('a', 'research');

    expect(activeGraph().nodes.find((node) => node.id === 'a')!.tags).toEqual(['research']);
    expect(activeGraph().tags).toHaveLength(1);
    expect(activeGraph().tags[0].name).toBe('research');

    useGraphStore.getState().unassignTag('a', 'research');
    expect(activeGraph().nodes.find((node) => node.id === 'a')!.tags).toEqual([]);
    expect(activeGraph().tags).toHaveLength(1);
  });

  it('creates, restores and deletes snapshots', () => {
    const snapshotId = useGraphStore.getState().createSnapshot('Baseline', 'before edits');
    expect(snapshotId).not.toBeNull();
    expect(activeWorkspace().snapshots[0]).toMatchObject({ id: snapshotId, name: 'Baseline', description: 'before edits' });

    useGraphStore.getState().deleteNodes(['a']);
    expect(activeGraph().nodes).toHaveLength(2);

    useGraphStore.getState().restoreSnapshot(snapshotId!);
    expect(activeGraph().nodes).toHaveLength(3);
    expect(activeGraph().edges).toHaveLength(2);

    useGraphStore.getState().deleteSnapshot(snapshotId!);
    expect(activeWorkspace().snapshots).toHaveLength(0);
  });

  it('imports and replaces graphs without sharing mutable data', () => {
    const incoming = makeGraph();
    incoming.nodes.push(createNode({ id: 'new', title: 'Incoming' }));
    incoming.edges.push(createEdge('new', 'a', { id: 'new-edge' }));

    useGraphStore.getState().importGraphIntoActive(incoming);
    expect(activeGraph().nodes).toHaveLength(4);
    expect(activeGraph().edges).toHaveLength(3);

    useGraphStore.getState().replaceActiveGraph(incoming, 'Replaced');
    expect(activeGraph().nodes).toHaveLength(4);
    expect(useGraphStore.getState().selectedNodeIds).toEqual([]);

    incoming.nodes[0].title = 'Mutated outside store';
    expect(activeGraph().nodes[0].title).toBe('Alpha');
  });

  it('loads known demos and ignores unknown demo ids', () => {
    const before = activeGraph();
    useGraphStore.getState().loadDemo('unknown-demo');
    expect(activeGraph()).toBe(before);

    useGraphStore.getState().loadDemo('astronomy');
    expect(activeGraph().nodes.length).toBeGreaterThan(10);
    expect(activeGraph().nodes.some((node) => node.id === 'astro-field')).toBe(true);
  });
});
