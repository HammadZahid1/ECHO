import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClusterExplorer } from '@/components/views/ClusterExplorer';
import { labelPropagationClusters } from '@/lib/graph/clusters';
import { createEdge, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
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
      createNode({ ...stamp, id: 'alpha', title: 'Alpha', tags: ['core'] }),
      createNode({ ...stamp, id: 'beta', title: 'Beta', tags: ['core'] }),
      createNode({ ...stamp, id: 'gamma', title: 'Gamma', tags: ['core'] }),
      createNode({ ...stamp, id: 'yak', title: 'Yak', tags: ['edge'] }),
      createNode({ ...stamp, id: 'zebra', title: 'Zebra', tags: ['edge'] }),
    ],
    edges: [
      createEdge('alpha', 'beta', { ...stamp, id: 'e1' }),
      createEdge('beta', 'gamma', { ...stamp, id: 'e2' }),
      createEdge('gamma', 'alpha', { ...stamp, id: 'e3' }),
      createEdge('yak', 'zebra', { ...stamp, id: 'e4' }),
    ],
    tags: [],
  };
}

const graph = makeGraph();
const clusters = labelPropagationClusters(graph).clusters;

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-cluster', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
    histories: {},
  });
  useUIStore.setState({ toasts: [], commandPaletteOpen: false, modal: null });
});

describe('ClusterExplorer', () => {
  it('renders one card per detected community and reports the community count', () => {
    const { container } = render(<ClusterExplorer graph={graph} />);

    expect(clusters).toHaveLength(2);
    expect(container.querySelectorAll('article')).toHaveLength(clusters.length);
    expect(screen.getByText(`${clusters.length} communities`)).toBeInTheDocument();
    expect(screen.getByText('Knowledge clusters')).toBeInTheDocument();
  });

  it('shows cluster names, sizes, density and keyword chips from the analysis', () => {
    render(<ClusterExplorer graph={graph} />);

    expect(screen.getByText('Beta +2')).toBeInTheDocument();
    expect(screen.getByText('Yak +1')).toBeInTheDocument();
    expect(screen.getByText('3n / 100%')).toBeInTheDocument();
    expect(screen.getByText('2n / 100%')).toBeInTheDocument();
    expect(screen.getByText('core')).toBeInTheDocument();
    expect(screen.getByText('edge')).toBeInTheDocument();
  });

  it('lists the member node titles for each community', () => {
    const { container } = render(<ClusterExplorer graph={graph} />);
    const memberLabels = [...container.querySelectorAll('li')].map((item) =>
      item.textContent?.replace(/^·\s*/, '').trim(),
    );

    expect(memberLabels).toHaveLength(graph.nodes.length);
    for (const node of graph.nodes) {
      expect(memberLabels).toContain(node.title);
    }
  });

  it('Select selects every node in the community and focuses its first member', () => {
    render(<ClusterExplorer graph={graph} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Select' })[0]);

    expect(useGraphStore.getState().selectedNodeIds).toEqual(clusters[0].nodeIds);
    expect(useGraphStore.getState().focusedNodeId).toBe(clusters[0].nodeIds[0]);
    expect(useGraphStore.getState().selectedEdgeId).toBeNull();
  });

  it('Focus view applies a cluster filter and raises a toast', () => {
    render(<ClusterExplorer graph={graph} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Focus view' })[1]);

    expect(useGraphStore.getState().filters.clusterNodeIds).toEqual(clusters[1].nodeIds);
    expect(useUIStore.getState().toasts).toEqual([
      expect.objectContaining({ kind: 'info', title: 'Cluster filter applied' }),
    ]);
  });

  it('handles an empty graph without rendering cards', () => {
    const { container } = render(<ClusterExplorer graph={{ nodes: [], edges: [], tags: [] }} />);

    expect(screen.getByText('0 communities')).toBeInTheDocument();
    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Select' })).not.toBeInTheDocument();
  });
});
