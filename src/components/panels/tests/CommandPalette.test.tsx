import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CommandPalette } from '@/components/panels/CommandPalette';
import { createEdge, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

function fixture(): GraphData {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha', type: 'concept' }),
      createNode({ id: 'n2', title: 'Beta', type: 'idea' }),
    ],
    edges: [createEdge('n1', 'n2', { id: 'e1' })],
    tags: [],
  };
}

function setupStore(selectedNodeIds: string[] = []): void {
  const workspace = createWorkspace({ name: 'Test universe', graph: fixture() });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds,
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({
    commandPaletteOpen: false,
    modal: null,
    toasts: [],
    searchOpen: false,
    view: 'universe',
    panelVisibility: { sidebar: true, inspector: true, explorer: true, tools: true, status: true },
  });
}

function renderPalette(selectedNodeIds: string[] = []): void {
  setupStore(selectedNodeIds);
  useUIStore.setState({ commandPaletteOpen: true });
  render(<CommandPalette />);
}

function searchInput(): HTMLInputElement {
  return screen.getByLabelText('Command palette search');
}

describe('CommandPalette', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders only while the palette is open', () => {
    setupStore();
    render(<CommandPalette />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => { useUIStore.setState({ commandPaletteOpen: true }); });
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    expect(searchInput()).toHaveAttribute('placeholder', 'Type a command or search knowledge…');
  });

  it('lists commands in groups with a live match count', () => {
    renderPalette();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Navigate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create node/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View: 3D Universe' })).toBeInTheDocument();
    expect(screen.getByText(/\d+ matches/)).toBeInTheDocument();
  });

  it('filters commands as the user types and reports no matches', () => {
    renderPalette();
    fireEvent.change(searchInput(), { target: { value: 'snapshot' } });
    expect(screen.getByRole('button', { name: 'Create snapshot' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create node/ })).not.toBeInTheDocument();
    fireEvent.change(searchInput(), { target: { value: 'zzzzz' } });
    expect(screen.getByText('No commands or nodes match “zzzzz”.')).toBeInTheDocument();
  });

  it('runs the highlighted command and closes the palette', () => {
    renderPalette();
    fireEvent.change(searchInput(), { target: { value: 'settings' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(useUIStore.getState().modal).toBe('settings');
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('supports arrow-key navigation before running a command', () => {
    renderPalette();
    fireEvent.keyDown(searchInput(), { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput(), { key: 'Enter' });
    const nodes = useGraphStore.getState().workspaces[0].graph.nodes;
    expect(nodes).toHaveLength(3);
    expect(nodes[nodes.length - 1].title).toBe('New idea');
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('selects and focuses a knowledge node chosen from the results', () => {
    renderPalette();
    fireEvent.change(searchInput(), { target: { value: 'Alpha' } });
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }));
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['n1']);
    expect(useGraphStore.getState().focusedNodeId).toBe('n1');
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('closes on Escape', () => {
    renderPalette();
    fireEvent.keyDown(searchInput(), { key: 'Escape' });
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides commands that are disabled for the current selection', () => {
    renderPalette();
    expect(screen.queryByRole('button', { name: /Connect selected nodes/ })).not.toBeInTheDocument();
    act(() => { useGraphStore.setState({ selectedNodeIds: ['n1', 'n2'] }); });
    expect(screen.getByRole('button', { name: /Connect selected nodes/ })).toBeEnabled();
  });
});
