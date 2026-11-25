import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SnapshotsPanel } from '@/components/panels/SnapshotsPanel';
import { exportSnapshot } from '@/lib/exporters';
import { downloadBlob } from '@/lib/utils/download';
import { createCamera, createDefaultSettings, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData, GraphSnapshot } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('@/lib/utils/download', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/download')>();
  return { ...actual, downloadBlob: vi.fn() };
});

vi.mock('@/lib/exporters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/exporters')>();
  return { ...actual, exportSnapshot: vi.fn(actual.exportSnapshot) };
});

function fixture(): GraphData {
  return { nodes: [createNode({ id: 'n1', title: 'Original' })], edges: [], tags: [] };
}

function snapshot(name: string, createdAt: number, description = ''): GraphSnapshot {
  return {
    id: `snapshot-${createdAt}`,
    name,
    description,
    createdAt,
    graph: fixture(),
    settings: createDefaultSettings(),
    camera: createCamera(),
  };
}

function renderPanel(snapshots: GraphSnapshot[] = [], compareSelection: [string | null, string | null] = [null, null]): void {
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
  useUIStore.setState({ toasts: [], modal: null, compareSelection });
  render(<SnapshotsPanel />);
}

function snapshotsInStore() {
  return useGraphStore.getState().workspaces[0].snapshots;
}

describe('SnapshotsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows an empty state and disables saving without a name', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Snapshots' })).toBeInTheDocument();
    expect(screen.getByText('0 saved states')).toBeInTheDocument();
    expect(screen.getByText('No snapshots yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save snapshot' })).toBeDisabled();
  });

  it('saves a named snapshot when Enter is pressed in the name field', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Snapshot name'), { target: { value: '  Before refactor  ' } });
    fireEvent.keyDown(screen.getByLabelText('Snapshot name'), { key: 'Enter' });
    expect(snapshotsInStore()).toHaveLength(1);
    expect(snapshotsInStore()[0].name).toBe('Before refactor');
    expect(screen.getByText('1 saved state')).toBeInTheDocument();
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Snapshot “Before refactor” saved' });
    expect(screen.getByLabelText('Snapshot name')).toHaveValue('');
  });

  it('saves a snapshot with a description from the save button', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Snapshot name'), { target: { value: 'Milestone' } });
    fireEvent.change(screen.getByLabelText('Description (optional)'), { target: { value: 'Ready for review' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save snapshot' }));
    expect(snapshotsInStore()).toHaveLength(1);
    expect(snapshotsInStore()[0].description).toBe('Ready for review');
    expect(screen.getByText('Ready for review')).toBeInTheDocument();
  });

  it('restores a snapshot and reports the restore', () => {
    renderPanel([snapshot('Milestone', 1_000)]);
    act(() => { useGraphStore.getState().deleteNodes(['n1']); });
    expect(useGraphStore.getState().workspaces[0].graph.nodes).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(useGraphStore.getState().workspaces[0].graph.nodes.map((node) => node.title)).toEqual(['Original']);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Restored “Milestone”' });
  });

  it('selects two snapshots for comparison and opens the compare dialog', () => {
    renderPanel([snapshot('Older', 1_000), snapshot('Newer', 2_000)]);
    const aButtons = screen.getAllByTitle('Select as comparison A');
    fireEvent.click(aButtons[1]);
    const bButtons = screen.getAllByTitle('Select as comparison B');
    fireEvent.click(bButtons[0]);
    expect(useUIStore.getState().compareSelection).toEqual(['snapshot-1000', 'snapshot-2000']);
    fireEvent.click(screen.getByRole('button', { name: 'Compare selected snapshots' }));
    expect(useUIStore.getState().modal).toBe('compare');
  });

  it('exports a snapshot through the local download helper', () => {
    renderPanel([snapshot('Before refactor', 1_000)]);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(exportSnapshot).toHaveBeenCalledTimes(1);
    expect(downloadBlob).toHaveBeenCalledTimes(1);
    expect(vi.mocked(downloadBlob).mock.calls[0][1]).toBe('before-refactor.echo-snapshot.json');
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Snapshot exported' });
  });

  it('deletes a snapshot and clears its comparison slot', () => {
    renderPanel([snapshot('Milestone', 1_000)], ['snapshot-1000', null]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(snapshotsInStore()).toHaveLength(0);
    expect(useUIStore.getState().compareSelection).toEqual([null, null]);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Deleted “Milestone”' });
  });

  it('lists snapshots newest first', () => {
    renderPanel([snapshot('Older', 1_000), snapshot('Newer', 2_000)]);
    const body = document.body.textContent ?? '';
    expect(body.indexOf('Newer')).toBeLessThan(body.indexOf('Older'));
  });
});
