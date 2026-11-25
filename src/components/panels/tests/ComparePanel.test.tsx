import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ComparePanel } from '@/components/panels/ComparePanel';
import { createCamera, createDefaultSettings, createEdge, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData, GraphSnapshot } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

function snapshot(id: string, name: string, graph: GraphData, createdAt: number): GraphSnapshot {
  return { id, name, description: '', createdAt, graph, settings: createDefaultSettings(), camera: createCamera() };
}

function baselineGraph(): GraphData {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha', description: 'old description' }),
      createNode({ id: 'n2', title: 'Beta' }),
    ],
    edges: [createEdge('n1', 'n2', { id: 'e1' })],
    tags: [],
  };
}

function expandedGraph(): GraphData {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha updated', description: 'new description' }),
      createNode({ id: 'n2', title: 'Beta' }),
      createNode({ id: 'n3', title: 'Gamma' }),
    ],
    edges: [
      createEdge('n1', 'n2', { id: 'e1' }),
      createEdge('n1', 'n3', { id: 'e2' }),
    ],
    tags: [],
  };
}

function reducedGraph(): GraphData {
  const graph = baselineGraph();
  return { nodes: [graph.nodes[0]], edges: [], tags: [] };
}

describe('ComparePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    const snapshots = [
      snapshot('a', 'Baseline', baselineGraph(), 1_000),
      snapshot('b', 'Expanded', expandedGraph(), 2_000),
      snapshot('c', 'Reduced', reducedGraph(), 3_000),
    ];
    const workspace = createWorkspace({ name: 'Test universe', snapshots });
    useGraphStore.setState({
      workspaces: [workspace],
      activeWorkspaceId: workspace.id,
      histories: { [workspace.id]: createHistory() },
      selectedNodeIds: [],
      selectedEdgeId: null,
      focusedNodeId: null,
    });
    useUIStore.setState({ compareSelection: [null, null], modal: null, toasts: [] });
  });

  it('asks for two snapshots when there is no selection', () => {
    render(<ComparePanel />);
    expect(screen.getByRole('heading', { name: 'Compare snapshots' })).toBeInTheDocument();
    expect(screen.getByText('Choose two snapshots')).toBeInTheDocument();
    expect(screen.getByText('Structural delta between two saved states')).toBeInTheDocument();
  });

  it('offers every workspace snapshot in both selectors and records changes', () => {
    render(<ComparePanel />);
    const baseline = screen.getByLabelText('Baseline (A)');
    expect(withinOptions(baseline)).toEqual(['Select snapshot…', 'Baseline', 'Expanded', 'Reduced']);
    fireEvent.change(baseline, { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Comparison (B)'), { target: { value: 'b' } });
    expect(useUIStore.getState().compareSelection).toEqual(['a', 'b']);
  });

  function withinOptions(select: HTMLElement): string[] {
    return Array.from(select.querySelectorAll('option')).map((option) => option.textContent ?? '');
  }

  function itemsFor(title: string): HTMLElement {
    const heading = screen.getByText(title);
    const card = heading.parentElement;
    if (!card) throw new Error(`No change list found for ${title}`);
    return card;
  }

  it('shows statistic deltas and added nodes and relationships', () => {
    useUIStore.setState({ compareSelection: ['a', 'b'] });
    render(<ComparePanel />);
    expect(screen.queryByText('Choose two snapshots')).not.toBeInTheDocument();
    expect(screen.getByText('+1 from 2')).toBeInTheDocument();
    expect(screen.getByText('Added nodes')).toBeInTheDocument();
    expect(within(itemsFor('Added nodes')).getByText(/Gamma$/)).toBeInTheDocument();
    expect(screen.getByText('Added relationships')).toBeInTheDocument();
    expect(within(itemsFor('Added relationships')).getByText(/Alpha updated → Gamma$/)).toBeInTheDocument();
    expect(screen.getByText('Modified nodes')).toBeInTheDocument();
    expect(within(itemsFor('Modified nodes')).getByText(/Alpha updated$/)).toBeInTheDocument();
  });

  it('lists removed items when the comparison snapshot is smaller', () => {
    useUIStore.setState({ compareSelection: ['a', 'c'] });
    render(<ComparePanel />);
    expect(screen.getByText('Removed nodes')).toBeInTheDocument();
    expect(within(itemsFor('Removed nodes')).getByText(/Beta$/)).toBeInTheDocument();
    expect(screen.getByText('Removed relationships')).toBeInTheDocument();
    expect(screen.getByText('-1 from 1')).toBeInTheDocument();
  });

  it('warns when the same snapshot is selected on both sides', () => {
    useUIStore.setState({ compareSelection: ['a', 'a'] });
    render(<ComparePanel />);
    expect(screen.getByText('Both selectors point to the same snapshot, so every delta is zero.')).toBeInTheDocument();
    expect(screen.getByText('+0 from 2')).toBeInTheDocument();
    expect(screen.getAllByText('None').length).toBeGreaterThan(0);
  });

  it('returns to the empty state when a selection is cleared', () => {
    useUIStore.setState({ compareSelection: ['a', 'b'] });
    render(<ComparePanel />);
    fireEvent.change(screen.getByLabelText('Baseline (A)'), { target: { value: '' } });
    expect(useUIStore.getState().compareSelection).toEqual([null, 'b']);
    expect(screen.getByText('Choose two snapshots')).toBeInTheDocument();
  });
});
