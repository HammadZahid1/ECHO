import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Inspector } from '@/components/panels/Inspector';
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
      createNode({
        id: 'n1', title: 'Alpha', description: 'Documented concept', type: 'concept',
        tags: ['science'], metadata: { author: 'Ada' }, references: ['ref-1'], importance: 0.65,
      }),
      createNode({ id: 'n2', title: 'Beta', description: 'Another concept' }),
    ],
    edges: [createEdge('n1', 'n2', { id: 'e1', type: 'supports', label: 'supports' })],
    tags: [],
  };
}

function renderPanel(selectedNodeIds: string[] = [], selectedEdgeId: string | null = null): void {
  const workspace = createWorkspace({ name: 'Test universe', graph: fixture() });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds,
    selectedEdgeId,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({ toasts: [], modal: null, activeTool: 'select', confirmAction: null, confirmMessage: '' });
  render(<Inspector />);
}

function activeNode() {
  return useGraphStore.getState().workspaces[0].graph.nodes.find((node) => node.id === 'n1');
}

describe('Inspector', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('invites the user to create a node when nothing is selected', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Inspector' })).toBeInTheDocument();
    expect(screen.getByText('Nothing selected')).toBeInTheDocument();
    expect(screen.getByText('Select something to inspect')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create a node' }));
    const state = useGraphStore.getState();
    expect(state.workspaces[0].graph.nodes).toHaveLength(3);
    expect(state.selectedNodeIds).toHaveLength(1);
  });

  it('shows editable identity fields and structure for the selected node', () => {
    renderPanel(['n1']);
    expect(screen.getByLabelText('Title')).toHaveValue('Alpha');
    expect(screen.getByLabelText('Type')).toHaveValue('concept');
    expect(screen.getByLabelText('Description')).toHaveValue('Documented concept');
    expect(screen.getByLabelText('References (one per line)')).toHaveValue('ref-1');
    expect(screen.getByText('Degree')).toBeInTheDocument();
    expect(screen.getByText('Cluster size')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('updates the node title as it is edited', () => {
    renderPanel(['n1']);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Alpha prime' } });
    expect(activeNode()?.title).toBe('Alpha prime');
    expect(screen.getByLabelText('Title')).toHaveValue('Alpha prime');
  });

  it('pins and unpins the node', () => {
    renderPanel(['n1']);
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    expect(activeNode()?.pinned).toBe(true);
    expect(screen.getByRole('button', { name: 'Pinned' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pinned' }));
    expect(activeNode()?.pinned).toBe(false);
  });

  it('adds and removes tags', () => {
    renderPanel(['n1']);
    fireEvent.change(screen.getByLabelText('New tag'), { target: { value: 'math' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(activeNode()?.tags).toEqual(['science', 'math']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove math' }));
    expect(activeNode()?.tags).toEqual(['science']);
  });

  it('adds and removes metadata entries', () => {
    renderPanel(['n1']);
    fireEvent.change(screen.getByLabelText('New metadata key'), { target: { value: 'year' } });
    fireEvent.change(screen.getByLabelText('New metadata value'), { target: { value: '2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add metadata' }));
    expect(activeNode()?.metadata).toMatchObject({ author: 'Ada', year: '2026' });
    fireEvent.click(screen.getByRole('button', { name: 'Remove author' }));
    expect(activeNode()?.metadata).toEqual({ year: '2026' });
  });

  it('shows connections and switches to relationship editing', () => {
    renderPanel(['n1']);
    expect(screen.getByText('Connections (1)')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText(/supports/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit relationship' }));
    expect(useGraphStore.getState().selectedEdgeId).toBe('e1');
    expect(screen.getAllByText('Relationship', { selector: 'p' }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Label')).toHaveValue('supports');
    expect(screen.getByRole('switch', { name: 'Directed' })).toBeInTheDocument();
  });

  it('duplicates, focuses and starts a connection from the node', () => {
    renderPanel(['n1']);
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    expect(useGraphStore.getState().workspaces[0].graph.nodes).toHaveLength(3);
    const duplicateId = useGraphStore.getState().selectedNodeIds[0];
    expect(duplicateId).not.toBe('n1');
    fireEvent.click(screen.getByRole('button', { name: 'Focus' }));
    expect(useGraphStore.getState().focusedNodeId).toBe(duplicateId);
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(useGraphStore.getState().connectionSourceId).toBe(duplicateId);
    expect(useUIStore.getState().activeTool).toBe('connect');
  });

  it('opens a confirmation dialog before deleting the node', () => {
    renderPanel(['n1']);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(useUIStore.getState().modal).toBe('confirm');
    expect(useUIStore.getState().confirmMessage).toContain('Delete “Alpha”');
    act(() => { useUIStore.getState().confirmAction?.(); });
    expect(useGraphStore.getState().workspaces[0].graph.nodes).toHaveLength(1);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Node deleted' });
  });
});
