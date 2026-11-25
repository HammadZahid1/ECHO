import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from '@/components/shell/TopBar';
import { createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';

vi.mock('@/components/shell/WorkspaceSwitcher', () => ({
  WorkspaceSwitcher: () => <div data-testid="workspace-switcher">Workspace switcher</div>,
}));
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

describe('TopBar', () => {
  beforeEach(() => {
    const workspace = createWorkspace({
      id: 'ws-1',
      name: 'Primary universe',
      graph: { nodes: [createNode({ id: 'n1', title: 'Existing' })], edges: [], tags: [] },
    });
    act(() => useGraphStore.setState({
      workspaces: [workspace],
      activeWorkspaceId: workspace.id,
      histories: { [workspace.id]: createHistory() },
      initialized: true,
    }));
    useUIStore.setState({
      view: 'universe',
      commandPaletteOpen: false,
      searchOpen: false,
      modal: null,
      contextMenu: null,
    });
  });

  afterEach(() => cleanup());

  it('renders the brand, workspace switcher and all visualization modes', () => {
    render(<TopBar />);
    expect(screen.getByText('ECHO')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-switcher')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Visualization modes' });
    expect(within(nav).getAllByRole('button')).toHaveLength(8);
    expect(within(nav).getByRole('button', { name: '3D Universe' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Radial Explorer' })).not.toHaveAttribute('aria-current');
  });

  it('changes the active view from the visualization navigation', () => {
    const { rerender } = render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Radial Explorer' }));

    expect(useUIStore.getState().view).toBe('radial');
    rerender(<TopBar />);
    expect(screen.getByRole('button', { name: 'Radial Explorer' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '3D Universe' })).not.toHaveAttribute('aria-current');
  });

  it('opens search and the command palette from icon buttons', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Search knowledge' }));
    expect(useUIStore.getState().searchOpen).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Command palette (Ctrl+K)' }));
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    expect(useUIStore.getState().contextMenu).toBeNull();
  });

  it('opens import and export dialogs from toolbar buttons', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Import knowledge' }));
    expect(useUIStore.getState().modal).toBe('import');
    fireEvent.click(screen.getByRole('button', { name: 'Export knowledge' }));
    expect(useUIStore.getState().modal).toBe('export');
  });

  it('switches to specialized views from health, analytics and overview buttons', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Graph health' }));
    expect(useUIStore.getState().view).toBe('network');
    fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));
    expect(useUIStore.getState().view).toBe('timeline');
    fireEvent.click(screen.getByRole('button', { name: 'Network overview' }));
    expect(useUIStore.getState().view).toBe('network');
  });

  it('reacts to history changes and applies undo and redo', () => {
    const { rerender } = render(<TopBar />);
    const undoButton = screen.getByRole('button', { name: 'Undo (Ctrl+Z)' });
    const redoButton = screen.getByRole('button', { name: 'Redo (Ctrl+Shift+Z)' });
    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();

    act(() => useGraphStore.getState().createNode({ title: 'Added' }));
    expect(useGraphStore.getState().canUndo()).toBe(true);
    expect(screen.getByRole('button', { name: 'Undo (Ctrl+Z)' })).toBeEnabled();

    rerender(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo (Ctrl+Z)' }));
    expect(useGraphStore.getState().workspaces[0].graph.nodes.map((node) => node.title)).toEqual(['Existing']);

    rerender(<TopBar />);
    expect(screen.getByRole('button', { name: 'Redo (Ctrl+Shift+Z)' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Redo (Ctrl+Shift+Z)' }));
    expect(useGraphStore.getState().workspaces[0].graph.nodes.map((node) => node.title)).toEqual(['Existing', 'Added']);
  });
});
