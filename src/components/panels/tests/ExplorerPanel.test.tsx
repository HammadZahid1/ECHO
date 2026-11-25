import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExplorerPanel } from '@/components/panels/ExplorerPanel';
import { createEdge, createGraphData, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

const DAY = 86_400_000;
const now = Date.now();

function fixture(): GraphData {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha', type: 'concept', tags: ['science'], importance: 0.9, createdAt: now - 30 * DAY }),
      createNode({ id: 'n2', title: 'Beta', type: 'idea', tags: ['science'], importance: 0.5 }),
      createNode({ id: 'n3', title: 'Gamma', type: 'note', tags: ['math'], importance: 0.3 }),
      createNode({ id: 'n4', title: 'Delta', type: 'question', importance: 0.1 }),
    ],
    edges: [
      createEdge('n1', 'n2', { id: 'e1' }),
      createEdge('n2', 'n3', { id: 'e2' }),
    ],
    tags: [],
  };
}

function renderPanel(graph: GraphData = fixture()): void {
  const workspace = createWorkspace({ name: 'Test universe', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({ toasts: [], modal: null });
  render(<ExplorerPanel />);
}

function nodeButton(title: string): HTMLElement {
  const element = screen.getByText(title);
  const button = element.closest('button');
  if (!button) throw new Error(`No node button for ${title}`);
  return button;
}

describe('ExplorerPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists the connected nodes sorted by importance and reports the visible count', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Explorer' })).toBeInTheDocument();
    expect(screen.getByText('4/4 nodes · 2 clusters')).toBeInTheDocument();
    const titles = screen.getAllByRole('button').map((button) => button.textContent ?? '');
    expect(titles.findIndex((text) => text.includes('Alpha'))).toBeLessThan(titles.findIndex((text) => text.includes('Beta')));
    expect(nodeButton('Alpha')).toBeInTheDocument();
    expect(nodeButton('Delta')).toBeInTheDocument();
  });

  it('restricts results to isolated nodes in isolated mode', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Exploration mode'), { target: { value: 'isolated' } });
    expect(screen.getByText('1/4 nodes · 2 clusters')).toBeInTheDocument();
    expect(nodeButton('Delta')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('offers hop controls centered on the selected node', () => {
    const graph = fixture();
    const workspace = createWorkspace({ name: 'Test universe', graph });
    useGraphStore.setState({
      workspaces: [workspace],
      activeWorkspaceId: workspace.id,
      histories: { [workspace.id]: createHistory() },
      selectedNodeIds: ['n1'],
      selectedEdgeId: null,
      focusedNodeId: null,
      filters: {},
    });
    render(<ExplorerPanel />);
    fireEvent.change(screen.getByLabelText('Exploration mode'), { target: { value: '1-hop' } });
    expect(screen.getByText('2/4 nodes · 2 clusters')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '1-hop' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: '2 · 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: '2-hop' }));
    expect(screen.getByText('3/4 nodes · 2 clusters')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('filters by node type', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'idea' } });
    expect(screen.getByText('1/4 nodes · 2 clusters')).toBeInTheDocument();
    expect(nodeButton('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('filters by tag and clears all filters again', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'science' }));
    expect(screen.getByText('2/4 nodes · 2 clusters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
    expect(screen.queryByText('Delta')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('4/4 nodes · 2 clusters')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('filters by minimum importance and by creation date', () => {
    renderPanel();
    fireEvent.change(screen.getByRole('slider', { name: 'Minimum importance' }), { target: { value: '0.6' } });
    expect(screen.getByText('1/4 nodes · 2 clusters')).toBeInTheDocument();
    expect(nodeButton('Alpha')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'created-7d' } });
    expect(screen.getByLabelText('Date')).toHaveValue('created-7d');
    expect(screen.getByText('0/4 nodes · 2 clusters')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('selects and focuses a node, with shift-click adding to the selection', () => {
    renderPanel();
    fireEvent.click(nodeButton('Alpha'));
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['n1']);
    expect(useGraphStore.getState().focusedNodeId).toBe('n1');
    fireEvent.click(nodeButton('Beta'), { shiftKey: true });
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['n1', 'n2']);
    expect(useGraphStore.getState().focusedNodeId).toBe('n2');
  });

  it('shows an empty state for a graph without nodes', () => {
    renderPanel(createGraphData());
    expect(screen.getByText('0/0 nodes · 0 clusters')).toBeInTheDocument();
    expect(screen.getByText('Nothing in this view')).toBeInTheDocument();
    expect(screen.getByText('No tags in this universe.')).toBeInTheDocument();
  });
});
