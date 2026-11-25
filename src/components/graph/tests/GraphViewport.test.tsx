import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GraphViewport } from '@/components/graph/GraphViewport';
import { createDefaultSettings, createEdge, createGraphData, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData } from '@/types';

vi.mock('@/components/graph/Universe3D', () => ({ Universe3D: () => <div data-testid="universe-3d" /> }));
vi.mock('@/components/graph/Graph2D', () => ({ Graph2D: () => <div data-testid="graph-2d" /> }));
vi.mock('@/components/graph/GraphControls', () => ({ GraphControls: () => <div data-testid="graph-controls" /> }));
vi.mock('@/components/views/RadialExplorer', () => ({ RadialExplorer: () => <div data-testid="radial-explorer" /> }));
vi.mock('@/components/views/HierarchyExplorer', () => ({ HierarchyExplorer: () => <div data-testid="hierarchy-explorer" /> }));
vi.mock('@/components/views/ClusterExplorer', () => ({ ClusterExplorer: () => <div data-testid="cluster-explorer" /> }));
vi.mock('@/components/views/TableExplorer', () => ({ TableExplorer: () => <div data-testid="table-explorer" /> }));
vi.mock('@/components/views/NetworkOverview', () => ({ NetworkOverview: () => <div data-testid="network-overview" /> }));
vi.mock('@/components/views/TimelineExplorer', () => ({ TimelineExplorer: () => <div data-testid="timeline-explorer" /> }));

function fixture(): GraphData {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha' }),
      createNode({ id: 'n2', title: 'Beta' }),
      createNode({ id: 'n3', title: 'Isolated note' }),
    ],
    edges: [createEdge('n1', 'n2', { id: 'e1' }), createEdge('n2', 'n1', { id: 'e2' })],
    tags: [],
  };
}

function renderViewport(graph: GraphData = fixture(), summaryEnabled = true): void {
  const workspace = createWorkspace({ id: 'viewport-ws', graph, settings: createDefaultSettings() });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds: ['n1'],
    selectedEdgeId: null,
    focusedNodeId: null,
    hoveredNodeId: null,
    filters: {},
  });
  useUIStore.setState({ view: 'universe', contextMenu: null, commandPaletteOpen: false, modal: null });
  useSettingsStore.setState({
    accessibility: {
      reduceMotion: false,
      highContrast: false,
      largeText: false,
      screenReaderGraphSummary: summaryEnabled,
    },
  });
  render(<GraphViewport />);
}

describe('GraphViewport', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => cleanup());

  it('renders the selected visualization with graph controls', () => {
    renderViewport();
    expect(screen.getByTestId('universe-3d')).toBeInTheDocument();
    expect(screen.getByTestId('graph-controls')).toBeInTheDocument();

    act(() => useUIStore.setState({ view: 'graph-2d' }));
    cleanup();
    render(<GraphViewport />);
    expect(screen.getByTestId('graph-2d')).toBeInTheDocument();
  });

  it('provides a live screen-reader summary when the preference is enabled', () => {
    renderViewport(fixture(), true);
    const summary = screen.getByText(/Graph summary:/);
    expect(summary).toHaveClass('sr-only');
    expect(summary).toHaveAttribute('aria-live', 'polite');
    expect(summary).toHaveTextContent('3 nodes and 2 relationships');
    expect(summary).toHaveTextContent('1 isolated nodes');
    expect(summary).toHaveTextContent('1 nodes selected');
    expect(summary).toHaveTextContent('Most connected:');
  });

  it('omits the screen-reader summary when the preference is disabled', () => {
    renderViewport(fixture(), false);
    expect(screen.queryByText(/Graph summary:/)).not.toBeInTheDocument();
  });

  it('offers recovery actions for an empty universe', () => {
    renderViewport(createGraphData());
    expect(screen.getByText('Your universe is empty')).toBeInTheDocument();
    expect(screen.queryByTestId('graph-controls')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create node' }));
    expect(useGraphStore.getState().activeWorkspaceId).toBe('viewport-ws');
  });

  it('opens a graph context menu from empty viewport space', () => {
    renderViewport();
    const viewport = screen.getByRole('region', { name: 'Knowledge graph viewport' });
    fireEvent.contextMenu(viewport, { clientX: 42, clientY: 63 });
    expect(useUIStore.getState().contextMenu).toMatchObject({ x: 42, y: 63, target: 'graph' });
  });
});
