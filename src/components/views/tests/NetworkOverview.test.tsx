import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NetworkOverview } from '@/components/views/NetworkOverview';
import { computeStatistics } from '@/lib/graph/stats';
import { createEdge, createNode, createWorkspace } from '@/lib/graph/factory';
import { NODE_TYPE_INFO } from '@/lib/graph/registry';
import { useGraphStore } from '@/store/graphStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', () => ({
  createDebouncedSaver: () => () => undefined,
  loadWorkspaces: async () => ({ workspaces: [], issues: [], available: false }),
  saveWorkspace: async () => undefined,
  deleteWorkspace: async () => undefined,
}));

const stamp = { createdAt: 1_735_689_600_000, updatedAt: 1_735_689_600_000 };

function makeGraph(): GraphData {
  return {
    nodes: [
      createNode({ ...stamp, id: 'hub', title: 'Hub', type: 'concept' }),
      createNode({ ...stamp, id: 'a', title: 'Alpha', type: 'concept' }),
      createNode({ ...stamp, id: 'b', title: 'Bea', type: 'person' }),
      createNode({ ...stamp, id: 'c', title: 'Cora', type: 'resource' }),
      createNode({ ...stamp, id: 'd', title: 'Dara', type: 'question' }),
    ],
    edges: [
      createEdge('hub', 'a', { ...stamp, id: 'e1' }),
      createEdge('hub', 'b', { ...stamp, id: 'e2' }),
      createEdge('hub', 'c', { ...stamp, id: 'e3' }),
    ],
    tags: [],
  };
}

const graph = makeGraph();
const statistics = computeStatistics(graph);

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-network', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    histories: {},
  });
});

function card(label: string): HTMLElement {
  const element = screen.getByText(label).closest('article');
  if (!element) throw new Error(`No metric card for ${label}`);
  return element;
}

describe('NetworkOverview', () => {
  it('renders the six headline metrics from the supplied statistics', () => {
    render(<NetworkOverview graph={graph} statistics={statistics} />);

    expect(screen.getByText('Network overview')).toBeInTheDocument();
    expect(card('Knowledge nodes')).toHaveTextContent(String(statistics.nodeCount));
    expect(card('Relationships')).toHaveTextContent(String(statistics.edgeCount));
    expect(card('Connected components')).toHaveTextContent(String(statistics.componentCount));
    expect(card('Average degree')).toHaveTextContent(statistics.averageDegree.toFixed(2));
    expect(card('Graph density')).toHaveTextContent(`${(statistics.density * 100).toFixed(1)}%`);
    expect(card('Isolated nodes')).toHaveTextContent(String(statistics.isolatedNodeIds.length));
  });

  it('lists node-type buckets with registry labels and counts', () => {
    render(<NetworkOverview graph={graph} statistics={statistics} />);

    expect(screen.getByText('Node types')).toBeInTheDocument();
    for (const bucket of statistics.typeDistribution) {
      expect(screen.getByText(bucket.label)).toBeInTheDocument();
      expect(bucket.label).toBe(NODE_TYPE_INFO[bucket.key as keyof typeof NODE_TYPE_INFO].label);
    }
    expect(statistics.typeDistribution).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'concept', count: 2 }),
    ]));
  });

  it('renders most-connected hubs with their degree and selects/focuses on click', () => {
    render(<NetworkOverview graph={graph} statistics={statistics} />);

    expect(screen.getByText('Most connected')).toBeInTheDocument();
    const hub = screen.getByRole('button', { name: 'Hub' });
    expect(hub.parentElement).toHaveTextContent('3');

    fireEvent.click(hub);
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['hub']);
    expect(useGraphStore.getState().focusedNodeId).toBe('hub');
  });

  it('skips hub ids that do not resolve to nodes', () => {
    const withGhost = {
      ...statistics,
      mostConnectedNodeIds: ['hub', 'missing-node', 'another-missing-node'],
    };
    render(<NetworkOverview graph={graph} statistics={withGhost} />);

    expect(screen.queryByRole('button', { name: 'missing-node' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hub' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('shows an empty graph as zero-valued metrics with no hub list', () => {
    const emptyGraph: GraphData = { nodes: [], edges: [], tags: [] };
    const emptyStats = computeStatistics(emptyGraph);
    render(<NetworkOverview graph={emptyGraph} statistics={emptyStats} />);

    expect(card('Knowledge nodes')).toHaveTextContent('0');
    expect(card('Relationships')).toHaveTextContent('0');
    expect(card('Graph density')).toHaveTextContent('0.0%');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
