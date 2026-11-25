import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TimelinePanel } from '@/components/panels/TimelinePanel';
import { createCamera, createDefaultSettings, createEdge, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData, GraphSnapshot } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

function dateAt(offset = 0): Date {
  return new Date(2024, 0, 10 + offset);
}

function isoDay(offset = 0): string {
  const date = dateAt(offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fixture(): GraphData {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha', createdAt: dateAt(0).getTime() }),
      createNode({ id: 'n2', title: 'Beta', createdAt: dateAt(1).getTime() }),
    ],
    edges: [createEdge('n1', 'n2', { id: 'e1', createdAt: dateAt(1).getTime() })],
    tags: [],
  };
}

function snapshot(): GraphSnapshot {
  return {
    id: 's1',
    name: 'Baseline',
    description: '',
    createdAt: dateAt(0).getTime(),
    graph: fixture(),
    settings: createDefaultSettings(),
    camera: createCamera(),
  };
}

function renderPanel(snapshots: GraphSnapshot[] = []): void {
  const workspace = createWorkspace({ name: 'Test universe', graph: fixture(), snapshots });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({ modal: null, toasts: [] });
  render(<TimelinePanel />);
}

function dayButtons(): HTMLElement[] {
  return screen.getAllByTitle(/nodes, \d+ relationships/);
}

describe('TimelinePanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the heading, day count and playback controls', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
    expect(screen.getByText('2 days')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
    expect(screen.getByText(/No snapshots yet/)).toBeInTheDocument();
  });

  it('groups nodes and relationships into activity days', () => {
    renderPanel();
    const titles = dayButtons().map((button) => button.getAttribute('title'));
    expect(titles.some((title) => title?.includes('1 nodes, 0 relationships'))).toBe(true);
    expect(titles.some((title) => title?.includes('1 nodes, 1 relationships'))).toBe(true);
  });

  it('filters the graph to a selected day', () => {
    renderPanel();
    fireEvent.click(dayButtons()[0]);
    expect(screen.getByText(/1 nodes and 0 relationships created · graph filtered to this day/)).toBeInTheDocument();
    expect(useGraphStore.getState().filters.clusterNodeIds).toEqual(['n1']);
    expect(screen.getByRole('button', { name: 'Clear filter' })).toBeEnabled();
  });

  it('clears the selected day filter', () => {
    renderPanel();
    fireEvent.click(dayButtons()[1]);
    expect(useGraphStore.getState().filters.clusterNodeIds).toEqual(['n2']);
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(useGraphStore.getState().filters.clusterNodeIds).toBeNull();
    expect(screen.queryByText(/graph filtered to this day/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filter' })).toBeDisabled();
  });

  it('narrows the visible days with a date range', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: isoDay(1) } });
    expect(screen.getByText('1 day')).toBeInTheDocument();
    expect(dayButtons()).toHaveLength(1);
  });

  it('shows an empty state when the range contains no activity', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2023-12-31' } });
    expect(screen.getByText('No activity in range')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.queryByText('2 days')).not.toBeInTheDocument();
  });

  it('advances through days while playing and stops on pause', () => {
    vi.useFakeTimers();
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/1 nodes and 0 relationships created/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/1 nodes and 1 relationships created/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/1 nodes and 1 relationships created/)).toBeInTheDocument();
  });

  it('opens the comparison dialog from a snapshot entry', () => {
    renderPanel([snapshot()]);
    fireEvent.click(screen.getByRole('button', { name: /Baseline/ }));
    expect(useUIStore.getState().modal).toBe('compare');
  });
});
