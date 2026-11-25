import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextMenuHost } from '@/components/shell/ContextMenuHost';
import { createEdge, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { ContextMenuState, GraphWorkspace } from '@/types';

vi.mock('@/lib/persistence/repository', () => ({
  loadWorkspaces: vi.fn(async () => ({ workspaces: [], issues: [], available: false })),
  saveWorkspace: vi.fn(async () => undefined),
  deleteWorkspace: vi.fn(async () => undefined),
  saveGraphSnapshot: vi.fn(async () => undefined),
  saveHistory: vi.fn(async () => undefined),
  loadHistory: vi.fn(async () => undefined),
  storageInfo: vi.fn(async () => ({ usage: 0, quota: 0 })),
  createDebouncedSaver: vi.fn(() => vi.fn()),
}));

function makeWorkspace(): GraphWorkspace {
  return createWorkspace({
    id: 'ws-1',
    name: 'Primary universe',
    graph: {
      nodes: [
        createNode({ id: 'n1', title: 'Alpha node' }),
        createNode({ id: 'n2', title: 'Beta node' }),
        createNode({ id: 'n3', title: 'Lonely node' }),
      ],
      edges: [createEdge('n1', 'n2', { id: 'e1' })],
      tags: [],
    },
  });
}

function openMenu(menu: ContextMenuState): void {
  act(() => useUIStore.setState({ contextMenu: menu }));
}

const graphMenu: ContextMenuState = { x: 120, y: 140, target: 'graph' };

describe('ContextMenuHost', () => {
  beforeEach(() => {
    const workspace = makeWorkspace();
    useGraphStore.setState({
      workspaces: [workspace],
      activeWorkspaceId: workspace.id,
      histories: { [workspace.id]: createHistory() },
      selectedNodeIds: [],
      selectedEdgeId: null,
      focusedNodeId: null,
      connectionSourceId: null,
      filters: {},
      initialized: true,
    });
    useUIStore.setState({
      contextMenu: null,
      searchOpen: false,
      modal: null,
      activeTool: 'select',
      commandPaletteOpen: true,
      toasts: [],
    });
  });

  afterEach(() => cleanup());

  it('renders nothing when no context menu is open', () => {
    const { container } = render(<ContextMenuHost />);
    expect(container).toBeEmptyDOMElement();
  });

  it('creates a node from the graph menu and closes the menu', () => {
    openMenu(graphMenu);
    render(<ContextMenuHost />);

    fireEvent.click(screen.getByRole('menuitem', { name: /Create node here/ }));

    expect(useGraphStore.getState().workspaces[0].graph.nodes.some((node) => node.title === 'New concept')).toBe(true);
    expect(useUIStore.getState().contextMenu).toBeNull();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens local search from the graph menu', () => {
    openMenu(graphMenu);
    render(<ContextMenuHost />);

    fireEvent.click(screen.getByRole('menuitem', { name: /Search knowledge/ }));

    expect(useUIStore.getState().searchOpen).toBe(true);
  });

  it('opens import, export and settings dialogs from the graph menu', () => {
    const { unmount } = render(<ContextMenuHost />);
    const cases = [
      { label: 'Import knowledge', modal: 'import' },
      { label: 'Export knowledge', modal: 'export' },
      { label: 'Graph settings', modal: 'settings' },
    ] as const;

    for (const { label, modal } of cases) {
      openMenu(graphMenu);
      fireEvent.click(screen.getByRole('menuitem', { name: new RegExp(label) }));
      expect(useUIStore.getState().modal).toBe(modal);
    }
    unmount();
  });

  it('focuses, duplicates and starts a connection from a node menu', () => {
    openMenu({ x: 120, y: 140, target: 'node', targetId: 'n1' });
    render(<ContextMenuHost />);
    const menu = screen.getByRole('menu', { name: 'Alpha node' });
    expect(within(menu).getByRole('menuitem', { name: /Focus node.*F/ })).toBeInTheDocument();

    fireEvent.click(within(menu).getByRole('menuitem', { name: /Focus node/ }));
    expect(useGraphStore.getState().focusedNodeId).toBe('n1');

    openMenu({ x: 120, y: 140, target: 'node', targetId: 'n1' });
    fireEvent.click(screen.getByRole('menuitem', { name: /Duplicate node/ }));
    expect(useGraphStore.getState().workspaces[0].graph.nodes).toHaveLength(4);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ kind: 'success', title: 'Node duplicated' });

    openMenu({ x: 120, y: 140, target: 'node', targetId: 'n1' });
    fireEvent.click(screen.getByRole('menuitem', { name: /Connect from here.*G/ }));
    expect(useGraphStore.getState().connectionSourceId).toBe('n1');
    expect(useUIStore.getState().activeTool).toBe('connect');
  });

  it('pins, selects neighbors and deletes nodes from a node menu', () => {
    const { rerender } = render(<ContextMenuHost />);

    openMenu({ x: 120, y: 140, target: 'node', targetId: 'n3' });
    rerender(<ContextMenuHost />);
    expect(screen.getByRole('menuitem', { name: /Pin position/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Select 0 neighbors/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('menuitem', { name: /Pin position/ }));
    expect(useGraphStore.getState().workspaces[0].graph.nodes.find((node) => node.id === 'n3')?.pinned).toBe(true);

    openMenu({ x: 120, y: 140, target: 'node', targetId: 'n3' });
    rerender(<ContextMenuHost />);
    expect(screen.getByRole('menuitem', { name: /Unpin position/ })).toBeInTheDocument();

    openMenu({ x: 120, y: 140, target: 'node', targetId: 'n1' });
    rerender(<ContextMenuHost />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Select 1 neighbors/ }));
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['n2']);

    openMenu({ x: 120, y: 140, target: 'node', targetId: 'n1' });
    rerender(<ContextMenuHost />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete node/ }));
    expect(useGraphStore.getState().workspaces[0].graph.nodes.map((node) => node.id)).toEqual(['n2', 'n3']);
    expect(useGraphStore.getState().workspaces[0].graph.edges).toHaveLength(0);
  });

  it('selects, focuses endpoints and deletes a relationship from an edge menu', () => {
    const { rerender } = render(<ContextMenuHost />);
    const menuState: ContextMenuState = { x: 120, y: 140, target: 'edge', targetId: 'e1' };

    openMenu(menuState);
    rerender(<ContextMenuHost />);
    expect(screen.getByRole('menu', { name: 'Relationship' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: /Select relationship/ }));
    expect(useGraphStore.getState().selectedEdgeId).toBe('e1');

    openMenu(menuState);
    rerender(<ContextMenuHost />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Focus source/ }));
    expect(useGraphStore.getState().focusedNodeId).toBe('n1');

    openMenu(menuState);
    rerender(<ContextMenuHost />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Focus target/ }));
    expect(useGraphStore.getState().focusedNodeId).toBe('n2');

    openMenu(menuState);
    rerender(<ContextMenuHost />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete relationship/ }));
    expect(useGraphStore.getState().workspaces[0].graph.edges).toHaveLength(0);
  });

  it('resets focus and opens search from a cluster menu', () => {
    const { rerender } = render(<ContextMenuHost />);
    act(() => useGraphStore.setState({ focusedNodeId: 'n1' }));
    const clusterMenu: ContextMenuState = { x: 120, y: 140, target: 'cluster' };

    openMenu(clusterMenu);
    rerender(<ContextMenuHost />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Reset focus/ }));
    expect(useGraphStore.getState().focusedNodeId).toBeNull();

    openMenu(clusterMenu);
    rerender(<ContextMenuHost />);
    fireEvent.click(screen.getByRole('menuitem', { name: /Search knowledge/ }));
    expect(useUIStore.getState().searchOpen).toBe(true);
  });

  it('closes on Escape and on an outside pointer press', () => {
    const { rerender } = render(<ContextMenuHost />);

    openMenu(graphMenu);
    rerender(<ContextMenuHost />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useUIStore.getState().contextMenu).toBeNull();

    openMenu(graphMenu);
    rerender(<ContextMenuHost />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
