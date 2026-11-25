import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createEdge, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
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
    ],
    edges: [createEdge('a', 'b', { ...stamp, id: 'e1' })],
    tags: [],
  };
}

const graph = makeGraph();

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-shortcuts', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: { entries: [], cursor: -1, limit: 120 } },
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({
    view: 'universe',
    commandPaletteOpen: false,
    searchOpen: false,
    modal: null,
    contextMenu: null,
    mobileNavOpen: false,
    activeTool: 'select',
    toasts: [],
    confirmMessage: '',
    confirmAction: null,
    panelVisibility: { sidebar: true, inspector: true, explorer: true, tools: true, status: true },
  });
});

function press(key: string, options: Partial<KeyboardEventInit> = {}): void {
  fireEvent.keyDown(window, { key, ...options });
}

function activeGraph(): GraphData {
  const state = useGraphStore.getState();
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)!.graph;
}

describe('useKeyboardShortcuts', () => {
  it('Ctrl+K toggles the command palette', () => {
    renderHook(() => useKeyboardShortcuts());

    press('k', { ctrlKey: true });
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    press('k', { ctrlKey: true });
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('Escape closes overlays and clears the node selection', () => {
    useUIStore.setState({ commandPaletteOpen: true, modal: 'settings', contextMenu: { x: 1, y: 2, target: 'graph' } });
    useGraphStore.setState({ selectedNodeIds: ['a'], selectedEdgeId: 'e1' });
    renderHook(() => useKeyboardShortcuts());

    press('Escape');

    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    expect(useUIStore.getState().modal).toBeNull();
    expect(useUIStore.getState().contextMenu).toBeNull();
    expect(useGraphStore.getState().selectedNodeIds).toEqual([]);
    expect(useGraphStore.getState().selectedEdgeId).toBeNull();
  });

  it('Ctrl+Z undoes and Ctrl+Y redoes a node creation', () => {
    useGraphStore.getState().createNode({ title: 'Shortcut node' });
    expect(activeGraph().nodes).toHaveLength(3);
    renderHook(() => useKeyboardShortcuts());

    press('z', { ctrlKey: true });
    expect(activeGraph().nodes).toHaveLength(2);
    expect(activeGraph().nodes.some((node) => node.title === 'Shortcut node')).toBe(false);

    press('y', { ctrlKey: true });
    expect(activeGraph().nodes).toHaveLength(3);
    expect(activeGraph().nodes.some((node) => node.title === 'Shortcut node')).toBe(true);
  });

  it('Delete removes the selected nodes', () => {
    useGraphStore.setState({ selectedNodeIds: ['a'] });
    renderHook(() => useKeyboardShortcuts());

    press('Delete');

    expect(activeGraph().nodes.map((node) => node.id)).toEqual(['b']);
    expect(activeGraph().edges).toHaveLength(0);
    expect(useGraphStore.getState().selectedNodeIds).toEqual([]);
  });

  it('Backspace deletes the selected edge when no node is selected', () => {
    useGraphStore.setState({ selectedEdgeId: 'e1' });
    renderHook(() => useKeyboardShortcuts());

    press('Backspace');

    expect(activeGraph().edges).toHaveLength(0);
    expect(useGraphStore.getState().selectedEdgeId).toBeNull();
  });

  it('F focuses the first selected node, N creates a node, G toggles the tool', () => {
    useGraphStore.setState({ selectedNodeIds: ['b'] });
    renderHook(() => useKeyboardShortcuts());

    press('f');
    expect(useGraphStore.getState().focusedNodeId).toBe('b');

    press('n');
    const created = activeGraph().nodes.find((node) => node.title === 'New concept');
    expect(created).toBeDefined();
    expect(created?.type).toBe('concept');
    expect(useGraphStore.getState().selectedNodeIds).toEqual([created!.id]);

    press('g');
    expect(useUIStore.getState().activeTool).toBe('connect');
    press('g');
    expect(useUIStore.getState().activeTool).toBe('select');
  });

  it('H toggles the inspector panel and ? opens the shortcuts modal', () => {
    renderHook(() => useKeyboardShortcuts());

    press('h');
    expect(useUIStore.getState().panelVisibility.inspector).toBe(false);
    press('h');
    expect(useUIStore.getState().panelVisibility.inspector).toBe(true);

    press('?');
    expect(useUIStore.getState().modal).toBe('shortcuts');
  });

  it('ignores plain shortcuts while typing but still allows Ctrl+K', () => {
    render(<input aria-label="shortcut probe" />);
    renderHook(() => useKeyboardShortcuts());
    const input = screen.getByLabelText('shortcut probe');

    fireEvent.keyDown(input, { key: 'n' });
    expect(activeGraph().nodes).toHaveLength(2);

    fireEvent.keyDown(input, { key: 'k', ctrlKey: true });
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it('stops handling keys after unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();

    press('n');

    expect(activeGraph().nodes).toHaveLength(2);
  });
});
