import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HierarchyExplorer } from '@/components/views/HierarchyExplorer';
import { createEdge, createNode, createWorkspace } from '@/lib/graph/factory';
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
      createNode({ ...stamp, id: 'root', title: 'Root' }),
      createNode({ ...stamp, id: 'child', title: 'Child' }),
      createNode({ ...stamp, id: 'grandchild', title: 'Grandchild' }),
      createNode({ ...stamp, id: 'isolated', title: 'Isolated' }),
    ],
    edges: [
      createEdge('root', 'child', { ...stamp, id: 'e1', directed: true }),
      createEdge('child', 'grandchild', { ...stamp, id: 'e2', directed: true }),
      createEdge('isolated', 'root', { ...stamp, id: 'e3', directed: true }),
    ],
    tags: [],
  };
}

const graph = makeGraph();

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-hierarchy', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    selectedNodeIds: [],
    selectedEdgeId: null,
    filters: {},
    histories: {},
  });
});

describe('HierarchyExplorer', () => {
  it('renders a clickable button for every node in the graph', () => {
    render(<HierarchyExplorer graph={graph} />);

    for (const node of graph.nodes) {
      expect(screen.getByRole('button', { name: node.title })).toBeInTheDocument();
    }
  });

  it('draws one connector path for every edge whose endpoints have positions', () => {
    const { container } = render(<HierarchyExplorer graph={graph} />);

    const paths = container.querySelectorAll('svg path');
    expect(paths).toHaveLength(graph.edges.length);
    expect(paths[0].getAttribute('d')).toMatch(/^M [\d.]+ [\d.]+ C /);
    expect(paths[0].getAttribute('stroke')).toBe('#394653');
  });

  it('places directed descendants below their parent', () => {
    render(<HierarchyExplorer graph={graph} />);

    const top = (name: string): number =>
      Number.parseFloat((screen.getByRole('button', { name }) as HTMLElement).style.top);

    expect(top('Root')).toBeGreaterThan(top('Child'));
    expect(top('Child')).toBeGreaterThan(top('Grandchild'));
    expect(top('Root')).toBeGreaterThan(0);
    expect(top('Grandchild')).toBeLessThan(100);
  });

  it('highlights the currently selected node with a white border', () => {
    useGraphStore.setState({ selectedNodeIds: ['child'] });
    render(<HierarchyExplorer graph={graph} />);

    expect((screen.getByRole('button', { name: 'Child' }) as HTMLElement).style.borderColor)
      .toBe('rgb(255, 255, 255)');
    expect((screen.getByRole('button', { name: 'Root' }) as HTMLElement).style.borderColor)
      .not.toBe('rgb(255, 255, 255)');
  });

  it('clicking a node replaces the selection with a single id', () => {
    useGraphStore.setState({ selectedNodeIds: ['root', 'isolated'] });
    render(<HierarchyExplorer graph={graph} />);

    fireEvent.click(screen.getByRole('button', { name: 'Grandchild' }));

    expect(useGraphStore.getState().selectedNodeIds).toEqual(['grandchild']);
    expect(useGraphStore.getState().selectedEdgeId).toBeNull();
  });

  it('renders nothing for an empty graph', () => {
    const { container } = render(<HierarchyExplorer graph={{ nodes: [], edges: [], tags: [] }} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('svg path')).toHaveLength(0);
  });
});
