import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { HealthPanel } from '@/components/panels/HealthPanel';
import { createEdge, createGraphData, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

function healthyGraph(): GraphData {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha', description: 'The first concept', tags: ['one'] }),
      createNode({ id: 'n2', title: 'Beta', description: 'The second concept', tags: ['two'] }),
      createNode({ id: 'n3', title: 'Gamma', description: 'The third concept', tags: ['three'] }),
    ],
    edges: [
      createEdge('n1', 'n2', { id: 'e1' }),
      createEdge('n2', 'n3', { id: 'e2' }),
      createEdge('n3', 'n1', { id: 'e3' }),
    ],
    tags: [],
  };
}

function problemGraph(): GraphData {
  return {
    nodes: [
      createNode({ id: 'orphan', title: 'Orphan', description: '', tags: [] }),
      createNode({ id: 'p1', title: 'Peer one', description: 'A documented idea', tags: ['peer'] }),
      createNode({ id: 'p2', title: 'Peer two', description: 'Another documented idea', tags: ['peer'] }),
    ],
    edges: [createEdge('p1', 'p2', { id: 'e1' })],
    tags: [],
  };
}

function renderPanel(graph: GraphData): void {
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
  render(<HealthPanel />);
}

function cardFor(title: string): HTMLElement {
  const element = screen.getByText(title);
  const card = element.parentElement?.parentElement;
  if (!card) throw new Error(`No issue card for ${title}`);
  return card;
}

describe('HealthPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reports a perfect score and no findings for a healthy graph', () => {
    renderPanel(healthyGraph());
    expect(screen.getByRole('heading', { name: 'Graph health' })).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('3 nodes · 3 relationships')).toBeInTheDocument();
    expect(screen.getByText('0 findings')).toBeInTheDocument();
    expect(screen.getByText('No issues found')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'All 0' })).toHaveAttribute('aria-selected', 'true');
  });

  it('lists local findings and severity counts for a problematic graph', () => {
    renderPanel(problemGraph());
    expect(screen.getByText(/findings/)).toBeInTheDocument();
    expect(screen.getByText('Unconnected: Orphan')).toBeInTheDocument();
    expect(screen.getByText('No description: Orphan')).toBeInTheDocument();
    expect(screen.getByText('No tags: Orphan')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Warning 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Info 4' })).toBeInTheDocument();
  });

  it('filters findings by severity', () => {
    renderPanel(problemGraph());
    fireEvent.click(screen.getByRole('tab', { name: 'Warning 1' }));
    expect(screen.getByText('Unconnected: Orphan')).toBeInTheDocument();
    expect(screen.queryByText('No tags: Orphan')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Info 4' }));
    expect(screen.getByText('No tags: Orphan')).toBeInTheDocument();
    expect(screen.queryByText('Unconnected: Orphan')).not.toBeInTheDocument();
  });

  it('applies the add-tag fix and removes the resolved finding', () => {
    renderPanel(problemGraph());
    fireEvent.click(within(cardFor('No tags: Orphan')).getByRole('button', { name: 'Add “untagged” tag' }));
    expect(useGraphStore.getState().workspaces[0].graph.nodes[0].tags).toContain('untagged');
    expect(screen.queryByText('No tags: Orphan')).not.toBeInTheDocument();
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Tagged as untagged' });
  });

  it('selects a node for the describe fix and from the Inspect action', () => {
    renderPanel(problemGraph());
    fireEvent.click(within(cardFor('No description: Orphan')).getByRole('button', { name: 'Describe' }));
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['orphan']);
    expect(useGraphStore.getState().focusedNodeId).toBe('orphan');
    expect(useUIStore.getState().toasts[0]).toMatchObject({ kind: 'info', title: 'Node selected' });
    fireEvent.click(within(cardFor('Unconnected: Orphan')).getByRole('button', { name: 'Inspect' }));
    expect(useGraphStore.getState().focusedNodeId).toBe('orphan');
  });

  it('flags a critical broken relationship and removes it with the fix', () => {
    const graph: GraphData = {
      ...createGraphData(),
      nodes: [createNode({ id: 'n1', title: 'Alone' })],
      edges: [createEdge('n1', 'missing', { id: 'broken' })],
    };
    renderPanel(graph);
    expect(screen.getByRole('tab', { name: 'Critical 1' })).toBeInTheDocument();
    expect(screen.getByText('Broken relationship')).toBeInTheDocument();
    fireEvent.click(within(cardFor('Broken relationship')).getByRole('button', { name: 'Delete edge' }));
    expect(useGraphStore.getState().workspaces[0].graph.edges).toHaveLength(0);
    expect(screen.queryByText('Broken relationship')).not.toBeInTheDocument();
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Broken relationship removed' });
  });
});
