import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RadialExplorer } from '@/components/views/RadialExplorer';
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
const longTitle = 'A deliberately very long node title';

function makeGraph(): GraphData {
  return {
    nodes: [
      createNode({ ...stamp, id: 'hub', title: 'Hub' }),
      createNode({ ...stamp, id: 'left', title: 'Left' }),
      createNode({ ...stamp, id: 'right', title: 'Right' }),
      createNode({ ...stamp, id: 'long', title: longTitle }),
      createNode({ ...stamp, id: 'isolated', title: 'Isolated' }),
    ],
    edges: [
      createEdge('hub', 'left', { ...stamp, id: 'e1' }),
      createEdge('hub', 'right', { ...stamp, id: 'e2' }),
      createEdge('hub', 'long', { ...stamp, id: 'e3' }),
    ],
    tags: [],
  };
}

const graph = makeGraph();

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-radial', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: 'hub',
    histories: {},
  });
});

describe('RadialExplorer', () => {
  it('renders a button for every node with the full title as tooltip', () => {
    render(<RadialExplorer graph={graph} />);

    expect(screen.getByRole('button', { name: 'Hub' })).toBeInTheDocument();
    expect(screen.getByTitle(longTitle)).toBeInTheDocument();
    expect(screen.getByTitle('Isolated')).toBeInTheDocument();
  });

  it('truncates long labels while keeping the title attribute intact', () => {
    render(<RadialExplorer graph={graph} />);

    const button = screen.getByTitle(longTitle);
    expect(button.textContent).toBe(`${longTitle.slice(0, 21)}…`);
    expect(button).toHaveAttribute('title', longTitle);
  });

  it('centers the graph on the focused node and displays its name and coordinates', () => {
    const { container } = render(<RadialExplorer graph={graph} />);

    expect(container.textContent).toContain('Center: Hub');
    expect(container.textContent).toContain('(0, 0)');
    expect((screen.getByRole('button', { name: 'Hub' }) as HTMLElement).style.left).toBe('50%');
    expect((screen.getByRole('button', { name: 'Hub' }) as HTMLElement).style.top).toBe('50%');
  });

  it('re-centers when the focused node changes in the store', () => {
    useGraphStore.setState({ focusedNodeId: 'left' });
    const { container } = render(<RadialExplorer graph={graph} />);

    expect(container.textContent).toContain('Center: Left');
    expect((screen.getByRole('button', { name: 'Left' }) as HTMLElement).style.left).toBe('50%');
    expect((screen.getByRole('button', { name: 'Hub' }) as HTMLElement).style.left).not.toBe('50%');
  });

  it('draws one edge line per relationship', () => {
    const { container } = render(<RadialExplorer graph={graph} />);

    const lines = container.querySelectorAll('svg line');
    expect(lines).toHaveLength(graph.edges.length);
    expect(lines[0]).toHaveAttribute('stroke', '#3d4a56');
  });

  it('selects a node on click and highlights it with a white border', () => {
    useGraphStore.setState({ selectedNodeIds: ['right'] });
    render(<RadialExplorer graph={graph} />);

    const selected = screen.getByRole('button', { name: 'Right' }) as HTMLElement;
    expect(selected.style.borderColor).toBe('rgb(255, 255, 255)');

    fireEvent.click(screen.getByRole('button', { name: 'Left' }));
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['left']);
    expect((screen.getByRole('button', { name: 'Right' }) as HTMLElement).style.borderColor)
      .not.toBe('rgb(255, 255, 255)');
  });

  it('shows an empty center label when there are no nodes', () => {
    const { container } = render(<RadialExplorer graph={{ nodes: [], edges: [], tags: [] }} />);

    expect(container.textContent).toContain('Center: —');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
