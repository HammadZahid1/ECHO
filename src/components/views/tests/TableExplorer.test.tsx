import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TableExplorer } from '@/components/views/TableExplorer';
import { createEdge, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', () => ({
  createDebouncedSaver: () => () => undefined,
  loadWorkspaces: async () => ({ workspaces: [], issues: [], available: false }),
  saveWorkspace: async () => undefined,
  deleteWorkspace: async () => undefined,
}));

function makeGraph(): GraphData {
  const stamp = { createdAt: 1_735_689_600_000, updatedAt: 1_735_689_600_000 };
  return {
    nodes: [
      createNode({ ...stamp, id: 'hub', title: 'Hub', description: 'central node', type: 'concept', tags: ['alpha'], importance: 0.9, createdAt: 1000, updatedAt: 5000 }),
      createNode({ ...stamp, id: 'alpha', title: 'Alpha', description: 'first', type: 'person', tags: ['beta'], importance: 0.6, createdAt: 2000, updatedAt: 4000 }),
      createNode({ ...stamp, id: 'bea', title: 'Bea', description: 'second', type: 'question', tags: ['gamma'], importance: 0.3, createdAt: 3000, updatedAt: 3000 }),
      createNode({ ...stamp, id: 'zed', title: 'Zed', description: 'third', type: 'resource', tags: ['alpha', 'remote'], importance: 0.8, createdAt: 4000, updatedAt: 2000 }),
    ],
    edges: [
      createEdge('hub', 'alpha', { ...stamp, id: 'e1' }),
      createEdge('hub', 'bea', { ...stamp, id: 'e2' }),
    ],
    tags: [],
  };
}

const graph = makeGraph();

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-table', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    histories: {},
  });
});

function rowTitles(container: HTMLElement): string[] {
  return [...container.querySelectorAll('tbody tr')].map((row) => row.querySelector('td')?.textContent ?? '');
}

describe('TableExplorer', () => {
  it('renders one row per node with its type label, degree and tags', () => {
    const { container } = render(<TableExplorer graph={graph} />);

    expect(container.querySelectorAll('tbody tr')).toHaveLength(graph.nodes.length);
    expect(screen.getByText('4 / 4 rows')).toBeInTheDocument();
    expect(rowTitles(container)).toHaveLength(4);
    expect(screen.getAllByText('alpha')).toHaveLength(2);
    expect(screen.getAllByText('Concept').length).toBeGreaterThan(0);
  });

  it('sorts by degree descending by default', () => {
    const { container } = render(<TableExplorer graph={graph} />);

    expect(rowTitles(container)[0]).toBe('Hub');
    expect(rowTitles(container)[3]).toBe('Zed');
    expect(container.querySelectorAll('tbody tr')[0].querySelectorAll('td')[2]).toHaveTextContent('2');
  });

  it('filters by free text across title, description and tags', () => {
    const { container } = render(<TableExplorer graph={graph} />);
    const input = screen.getByLabelText('Filter table');

    fireEvent.change(input, { target: { value: 'central' } });
    expect(rowTitles(container)).toEqual(['Hub']);
    expect(screen.getByText('1 / 4 rows')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'remote' } });
    expect(rowTitles(container)).toEqual(['Zed']);

    fireEvent.change(input, { target: { value: '' } });
    expect(rowTitles(container)).toHaveLength(4);
  });

  it('filters by node type using the select control', () => {
    const { container } = render(<TableExplorer graph={graph} />);

    fireEvent.change(screen.getByLabelText('Filter by node type'), { target: { value: 'person' } });
    expect(rowTitles(container)).toEqual(['Alpha']);
    expect(screen.getByText('1 / 4 rows')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filter by node type'), { target: { value: 'all' } });
    expect(rowTitles(container)).toHaveLength(4);
  });

  it('toggles title sort direction when the header is clicked twice', () => {
    const { container } = render(<TableExplorer graph={graph} />);
    const header = screen.getByText('Title');

    fireEvent.click(header);
    expect(rowTitles(container)).toEqual(['Zed', 'Hub', 'Bea', 'Alpha']);

    fireEvent.click(header);
    expect(rowTitles(container)).toEqual(['Alpha', 'Bea', 'Hub', 'Zed']);
  });

  it('selects a node on single click and sets focus on double click', () => {
    const { container } = render(<TableExplorer graph={graph} />);
    const rows = container.querySelectorAll('tbody tr');

    fireEvent.click(rows[1]);
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['alpha']);
    expect(useGraphStore.getState().focusedNodeId).toBeNull();

    fireEvent.doubleClick(rows[0]);
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['hub']);
    expect(useGraphStore.getState().focusedNodeId).toBe('hub');
  });

  it('shows an explanatory empty state when no rows match', () => {
    const { container } = render(<TableExplorer graph={graph} />);

    fireEvent.change(screen.getByLabelText('Filter table'), { target: { value: 'nothing-matches' } });

    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
    expect(screen.getByText('0 / 4 rows')).toBeInTheDocument();
    expect(screen.getByText('No knowledge matches the current filters.')).toBeInTheDocument();
  });
});
