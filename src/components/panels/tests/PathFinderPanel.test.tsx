import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PathFinderPanel } from '@/components/panels/PathFinderPanel';
import { createEdge, createGraphData, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
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
      createNode({ id: 'n1', title: 'Alpha' }),
      createNode({ id: 'n2', title: 'Beta' }),
      createNode({ id: 'n3', title: 'Gamma' }),
      createNode({ id: 'n4', title: 'Delta' }),
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
  render(<PathFinderPanel />);
}

describe('PathFinderPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with a route prompt and default endpoints', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Path finder' })).toBeInTheDocument();
    expect(screen.getByText('Find a route')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toHaveValue('n1');
    expect(screen.getByLabelText('To')).toHaveValue('n2');
    expect(screen.getByLabelText('Maximum path length')).toHaveValue(6);
  });

  it('finds and displays a shortest path with clickable stops', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'n3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find paths' }));
    expect(screen.getByText('Shortest path')).toBeInTheDocument();
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
    expect(screen.getByText('Route 1')).toBeInTheDocument();
    expect(screen.getByText(/2 hops · strength 1.00/)).toBeInTheDocument();
    const intermediate = screen.getAllByTitle('Focus this node')[0];
    fireEvent.click(intermediate);
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['n2']);
    expect(useGraphStore.getState().focusedNodeId).toBe('n2');
  });

  it('reports when no route exists within the hop limit', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'n3' } });
    fireEvent.change(screen.getByLabelText('Maximum path length'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find paths' }));
    expect(screen.getByText('No path found')).toBeInTheDocument();
    expect(screen.getByText(/No simple path of up to 1 hops/)).toBeInTheDocument();
  });

  it('clamps the hop limit to the supported range', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Maximum path length'), { target: { value: '99' } });
    expect(screen.getByLabelText('Maximum path length')).toHaveValue(12);
    fireEvent.change(screen.getByLabelText('Maximum path length'), { target: { value: '0' } });
    expect(screen.getByLabelText('Maximum path length')).toHaveValue(1);
  });

  it('discards the previous results when an endpoint changes', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'n3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find paths' }));
    expect(screen.getByText('Route 1')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'n4' } });
    expect(screen.getByText('Find a route')).toBeInTheDocument();
    expect(screen.queryByText('Route 1')).not.toBeInTheDocument();
  });

  it('disables search when both endpoints are the same', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'n1' } });
    expect(screen.getByRole('button', { name: 'Find paths' })).toBeDisabled();
  });

  it('lists alternative routes in an interconnected graph', () => {
    const graph = fixture();
    graph.edges.push(createEdge('n1', 'n3', { id: 'e3', type: 'supports' }));
    renderPanel(graph);
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'n3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find paths' }));
    expect(screen.getByText('2 candidate routes')).toBeInTheDocument();
    expect(screen.getByText('Route 1')).toBeInTheDocument();
    expect(screen.getByText('Route 2')).toBeInTheDocument();
  });

  it('disables search for an empty graph', () => {
    renderPanel(createGraphData());
    expect(screen.getByRole('button', { name: 'Find paths' })).toBeDisabled();
    expect(screen.getByText('Find a route')).toBeInTheDocument();
  });
});
