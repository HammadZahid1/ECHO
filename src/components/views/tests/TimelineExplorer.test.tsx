import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TimelineExplorer } from '@/components/views/TimelineExplorer';
import { createEdge, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', () => ({
  createDebouncedSaver: () => () => undefined,
  loadWorkspaces: async () => ({ workspaces: [], issues: [], available: false }),
  saveWorkspace: async () => undefined,
  deleteWorkspace: async () => undefined,
}));

const day1 = Date.UTC(2025, 0, 1);
const day2 = Date.UTC(2025, 0, 2);
const day3 = Date.UTC(2025, 0, 3);

function makeGraph(): GraphData {
  const node = (id: string, title: string, createdAt: number) => createNode({
    id, title, createdAt, updatedAt: createdAt, tags: ['timeline'],
  });
  return {
    nodes: [
      node('n1', 'First', day1),
      node('n2', 'Second', day1),
      node('n3', 'Third', day2),
      node('n4', 'Fourth', day3),
    ],
    edges: [
      createEdge('n1', 'n3', { id: 'e1', createdAt: day2, updatedAt: day2, type: 'supports', label: 'supports' }),
      createEdge('n2', 'n4', { id: 'e2', createdAt: day3, updatedAt: day3, type: 'depends', label: 'depends on' }),
    ],
    tags: [],
  };
}

const graph = makeGraph();

beforeEach(() => {
  const workspace = createWorkspace({ id: 'ws-timeline', graph });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    histories: {},
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TimelineExplorer', () => {
  it('groups activity by UTC day and starts at the most recent day', () => {
    const { container } = render(<TimelineExplorer graph={graph} />);

    const buckets = [...container.querySelectorAll('button')]
      .filter((button) => /2025-01-0\d/.test(button.textContent ?? ''))
      .map((button) => button.textContent);
    expect(buckets).toHaveLength(3);
    expect(buckets[0]).toContain('2025-01-01');
    expect(buckets[2]).toContain('2025-01-03');
    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-03');
    expect(screen.getByText('4 nodes · 2 links')).toBeInTheDocument();
  });

  it('reduces visible nodes and links when an earlier day is selected', () => {
    render(<TimelineExplorer graph={graph} />);

    const first = screen.getByRole('button', { name: /2025-01-01/ });
    fireEvent.click(first);

    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-01');
    expect(screen.getByText('2 nodes · 0 links')).toBeInTheDocument();
  });

  it('clamps the previous and next day controls at the ends of the range', () => {
    render(<TimelineExplorer graph={graph} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-03');

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-02');

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-01');
  });

  it('selects and focuses a node created on the current day', () => {
    render(<TimelineExplorer graph={graph} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fourth' }));

    expect(useGraphStore.getState().selectedNodeIds).toEqual(['n4']);
    expect(useGraphStore.getState().focusedNodeId).toBe('n4');
  });

  it('limits the timeline with start and end date inputs', () => {
    render(<TimelineExplorer graph={graph} />);

    fireEvent.change(screen.getByLabelText('Timeline start date'), { target: { value: '2025-01-03' } });
    expect(screen.getByText('1 nodes · 0 links')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /2025-01-01/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Timeline start date'), { target: { value: '2025-01-04' } });
    expect(screen.getByText('No activity in this date range.')).toBeInTheDocument();
  });

  it('advances one day per playback tick and stops at the end', () => {
    vi.useFakeTimers();
    render(<TimelineExplorer graph={graph} />);

    fireEvent.click(screen.getByRole('button', { name: /2025-01-01/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Play timeline' }));

    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-02');

    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-03');

    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-03');
    expect(screen.getByRole('button', { name: 'Play timeline' })).toBeInTheDocument();
  });

  it('renders edge details and an empty node list for an edge-only day', () => {
    const edgeOnly: GraphData = {
      nodes: [
        createNode({ id: 'a', title: 'Alpha', createdAt: day1, updatedAt: day1 }),
        createNode({ id: 'b', title: 'Beta', createdAt: day1, updatedAt: day1 }),
      ],
      edges: [createEdge('a', 'b', { id: 'e', createdAt: day2, updatedAt: day2, type: 'related', label: 'related to' })],
      tags: [],
    };
    render(<TimelineExplorer graph={edgeOnly} />);

    expect(screen.getByText(/Showing history through/)).toHaveTextContent('2025-01-02');
    expect(screen.getByText('No nodes created.')).toBeInTheDocument();
    expect(screen.getByText(/Alpha → Beta/)).toBeInTheDocument();
    expect(screen.getByText('related')).toBeInTheDocument();
  });
});
