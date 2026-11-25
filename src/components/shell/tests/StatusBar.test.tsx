import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StatusBar } from '@/components/shell/StatusBar';
import { createEdge, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphHistoryEntry, GraphWorkspace } from '@/types';

function makeWorkspace(updatedAt = Date.now() - 5 * 60_000): GraphWorkspace {
  return createWorkspace({
    id: 'ws-1',
    name: 'Primary universe',
    updatedAt,
    graph: {
      nodes: [
        createNode({ id: 'n1', title: 'One' }),
        createNode({ id: 'n2', title: 'Two' }),
        createNode({ id: 'n3', title: 'Three' }),
      ],
      edges: [createEdge('n1', 'n2', { id: 'e1' }), createEdge('n2', 'n3', { id: 'e2' })],
      tags: [],
    },
  });
}

function setWorkspace(workspace: GraphWorkspace, historyLength = 0): void {
  const entries = Array.from({ length: historyLength }, () => ({} as GraphHistoryEntry));
  act(() => useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: { ...createHistory(), entries } },
    storageStatus: 'idle',
    storageMessage: '',
    initialized: true,
  }));
}

describe('StatusBar', () => {
  beforeEach(() => {
    setWorkspace(makeWorkspace());
    useUIStore.setState({ view: 'universe' });
  });

  afterEach(() => cleanup());

  it('renders storage state, graph counts, clusters, history, view and updated time', () => {
    render(<StatusBar />);
    expect(screen.getByText('Local · idle')).toBeInTheDocument();
    expect(screen.getByText('3 nodes · 2 links')).toBeInTheDocument();
    expect(screen.getByText('1 clusters · 0 history')).toBeInTheDocument();
    expect(screen.getByText('universe')).toBeInTheDocument();
    expect(screen.getByText('Updated 5m ago')).toBeInTheDocument();
  });

  it('colors the storage indicator according to save status', () => {
    const { rerender } = render(<StatusBar />);

    act(() => useGraphStore.setState({ storageStatus: 'saved' }));
    rerender(<StatusBar />);
    expect(screen.getByText('Local · saved')).toBeInTheDocument();
    expect(screen.getByText('Local · saved').parentElement?.querySelector('svg')).toHaveClass('text-emerald-400');

    act(() => useGraphStore.setState({ storageStatus: 'error' }));
    rerender(<StatusBar />);
    expect(screen.getByText('Local · error')).toBeInTheDocument();
    expect(screen.getByText('Local · error').parentElement?.querySelector('svg')).toHaveClass('text-red-400');
  });

  it('reacts to graph and history changes in the active workspace', () => {
    const workspace = makeWorkspace();
    render(<StatusBar />);

    act(() => useGraphStore.setState({
      workspaces: [{
        ...workspace,
        graph: {
          nodes: [...workspace.graph.nodes, createNode({ id: 'n4', title: 'Four' })],
          edges: [createEdge('n1', 'n2', { id: 'e1' })],
          tags: [],
        },
      }],
      histories: { [workspace.id]: { ...createHistory(), entries: [{}, {}] as GraphHistoryEntry[] } },
    }));

    expect(screen.getByText('4 nodes · 1 links')).toBeInTheDocument();
    expect(screen.getByText('3 clusters · 2 history')).toBeInTheDocument();
  });

  it('reflects the active UI view', () => {
    render(<StatusBar />);
    act(() => useUIStore.setState({ view: 'radial' }));
    expect(screen.getByText('radial')).toBeInTheDocument();
    expect(screen.queryByText('universe')).not.toBeInTheDocument();
  });

  it('formats older workspace update times', () => {
    setWorkspace(makeWorkspace(Date.now() - 3 * 60 * 60_000));
    render(<StatusBar />);
    expect(screen.getByText(/Updated 3h ago/)).toBeInTheDocument();
  });
});
