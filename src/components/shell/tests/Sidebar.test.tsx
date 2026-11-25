import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/components/shell/Sidebar';
import { createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphCollection, GraphWorkspace, KnowledgeNode } from '@/types';

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

const collection: GraphCollection = {
  id: 'c1',
  name: 'Research',
  description: '',
  color: '#4fd8e8',
  parentId: null,
  createdAt: 1,
  updatedAt: 1,
};

function makeWorkspace(nodes: KnowledgeNode[] = [], collections: GraphCollection[] = []): GraphWorkspace {
  return createWorkspace({
    id: 'ws-1',
    name: 'Primary universe',
    graph: { nodes, edges: [], tags: [] },
    collections,
  });
}

function setWorkspace(workspace: GraphWorkspace): void {
  act(() => useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    filters: {},
    selectedNodeIds: [],
    selectedEdgeId: null,
    initialized: true,
  }));
}

describe('Sidebar', () => {
  beforeEach(() => {
    setWorkspace(makeWorkspace());
    useUIStore.setState({ modal: null, confirmMessage: '', confirmAction: null, toasts: [] });
  });

  afterEach(() => cleanup());

  it('opens library dialogs and applies library filters', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(useUIStore.getState().modal).toBe('import');
    fireEvent.click(screen.getByRole('button', { name: 'Workspaces' }));
    expect(useUIStore.getState().modal).toBe('workspace');
    fireEvent.click(screen.getByRole('button', { name: 'Snapshots' }));
    expect(useUIStore.getState().modal).toBe('snapshot');

    fireEvent.click(screen.getByRole('button', { name: 'Connected only' }));
    expect(useGraphStore.getState().filters).toMatchObject({ onlyConnected: true });
    fireEvent.click(screen.getByRole('button', { name: 'All knowledge' }));
    expect(useGraphStore.getState().filters).toEqual({});
  });

  it('adds a collection from the inline form and ignores blank names', () => {
    render(<Sidebar />);
    expect(screen.getByText(/No collections yet/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+' }));
    const input = screen.getByLabelText('Collection name');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(useGraphStore.getState().workspaces[0].collections).toHaveLength(0);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Research' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(useGraphStore.getState().workspaces[0].collections[0].name).toBe('Research');
    expect(screen.getByRole('button', { name: /Research/ })).toBeInTheDocument();
    expect(screen.queryByText(/No collections yet/)).not.toBeInTheDocument();
  });

  it('toggles a collection filter and selects the nodes it contains', () => {
    setWorkspace(makeWorkspace([
      createNode({ id: 'n1', title: 'Included', collectionIds: ['c1'] }),
      createNode({ id: 'n2', title: 'Excluded' }),
    ], [collection]));
    render(<Sidebar />);

    const button = screen.getByRole('button', { name: /Research/ });
    fireEvent.click(button);
    expect(useGraphStore.getState().filters.collectionId).toBe('c1');
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['n1']);

    fireEvent.click(button);
    expect(useGraphStore.getState().filters.collectionId).toBeNull();
  });

  it('aggregates tag counts and toggles tag filters', () => {
    setWorkspace(makeWorkspace([
      createNode({ id: 'n1', title: 'One', tags: ['alpha', 'beta'] }),
      createNode({ id: 'n2', title: 'Two', tags: ['alpha'] }),
      createNode({ id: 'n3', title: 'Three' }),
    ]));
    render(<Sidebar />);

    expect(screen.getByText('2 in this universe')).toBeInTheDocument();
    const alpha = screen.getByRole('button', { name: /alpha/ });
    const beta = screen.getByRole('button', { name: /beta/ });
    expect(alpha).toHaveTextContent('2');
    expect(beta).toHaveTextContent('1');

    fireEvent.click(alpha);
    expect(useGraphStore.getState().filters.tags).toEqual(['alpha']);
    fireEvent.click(beta);
    expect(useGraphStore.getState().filters.tags).toEqual(['alpha', 'beta']);
    fireEvent.click(alpha);
    expect(useGraphStore.getState().filters.tags).toEqual(['beta']);
  });

  it('shows an empty state when the universe has no tags', () => {
    setWorkspace(makeWorkspace([createNode({ id: 'n1', title: 'Untagged' })]));
    render(<Sidebar />);
    expect(screen.getByText('No tags yet')).toBeInTheDocument();
    expect(screen.getByText('0 in this universe')).toBeInTheDocument();
  });

  it('renders the demo universes header but no dataset list (known source defect)', () => {
    render(<Sidebar />);
    expect(screen.getByText('Demo universes')).toBeInTheDocument();
    // Panel has defaultCollapsed without collapsible, so its body is unreachable.
    expect(screen.queryByRole('button', { name: 'Expand Demo universes' })).not.toBeInTheDocument();
    expect(screen.queryByText('Astronomy & Cosmology')).not.toBeInTheDocument();
  });
});
