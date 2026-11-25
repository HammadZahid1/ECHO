import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceSwitcher } from '@/components/shell/WorkspaceSwitcher';
import { createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';

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

function setWorkspaces(workspaces = [
  createWorkspace({
    id: 'ws-1',
    name: 'Primary universe',
    color: '#4fd8e8',
    graph: { nodes: [createNode({ id: 'n1' }), createNode({ id: 'n2' })], edges: [], tags: [] },
  }),
  createWorkspace({
    id: 'ws-2',
    name: 'Secondary universe',
    color: '#9d7bf5',
    graph: { nodes: [createNode({ id: 'n3' })], edges: [], tags: [] },
  }),
], activeId = 'ws-1'): void {
  const histories = Object.fromEntries(workspaces.map((workspace) => [workspace.id, createHistory()]));
  act(() => useGraphStore.setState({
    workspaces,
    activeWorkspaceId: activeId,
    histories,
    initialized: true,
  }));
}

describe('WorkspaceSwitcher', () => {
  beforeEach(() => {
    setWorkspaces();
    useUIStore.setState({ modal: null, contextMenu: null });
  });

  afterEach(() => cleanup());

  it('shows the active workspace and lists all workspaces with node counts when opened', () => {
    render(<WorkspaceSwitcher />);
    const trigger = screen.getByRole('button', { name: /Primary universe/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('span')).toHaveStyle({ background: '#4fd8e8' });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Knowledge universes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Secondary universe/ })).toHaveTextContent('1');
  });

  it('switches workspace and closes the dropdown', () => {
    render(<WorkspaceSwitcher />);
    const trigger = screen.getByRole('button', { name: /Primary universe/ });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: /Secondary universe/ }));

    expect(useGraphStore.getState().activeWorkspaceId).toBe('ws-2');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('Secondary universe');
  });

  it('ignores blank names and creates a new universe with a valid name', () => {
    render(<WorkspaceSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /Primary universe/ }));
    fireEvent.click(screen.getByRole('button', { name: 'New universe' }));

    const input = screen.getByLabelText('New universe name');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(useGraphStore.getState().workspaces).toHaveLength(2);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Fresh universe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(useGraphStore.getState().workspaces).toHaveLength(3);
    expect(useGraphStore.getState().workspaces[2].name).toBe('Fresh universe');
    expect(useGraphStore.getState().activeWorkspaceId).toBe(useGraphStore.getState().workspaces[2].id);
    expect(screen.getByRole('button', { name: /Fresh universe/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the workspace manager and closes the dropdown', () => {
    render(<WorkspaceSwitcher />);
    const trigger = screen.getByRole('button', { name: /Primary universe/ });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));

    expect(useUIStore.getState().modal).toBe('workspace');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Knowledge universes')).not.toBeInTheDocument();
  });

  it('falls back to No workspace when the store has no workspaces', () => {
    setWorkspaces([], '');
    render(<WorkspaceSwitcher />);
    expect(screen.getByRole('button', { name: /No workspace/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /No workspace/ }));
    expect(screen.getByText('Knowledge universes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New universe' }));
    fireEvent.change(screen.getByLabelText('New universe name'), { target: { value: 'Only universe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(useGraphStore.getState().workspaces[0].name).toBe('Only universe');
  });
});
