import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WorkspacePanel } from '@/components/panels/WorkspacePanel';
import { downloadBlob, readFileAsText } from '@/lib/utils/download';
import { createEdge, createGraphData, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphWorkspace } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return {
    ...actual,
    createDebouncedSaver: () => () => undefined,
    saveWorkspace: vi.fn().mockResolvedValue(undefined),
    deleteWorkspace: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/lib/utils/download', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/download')>();
  return { ...actual, downloadBlob: vi.fn(), readFileAsText: vi.fn() };
});

function workspace(id: string, name: string, titles: string[], withEdge = false): GraphWorkspace {
  const graph = createGraphData();
  graph.nodes = titles.map((title, index) => createNode({ id: `${id}-n${index}`, title }));
  if (withEdge && graph.nodes.length >= 2) graph.edges = [createEdge(graph.nodes[0].id, graph.nodes[1].id, { id: `${id}-e1` })];
  return createWorkspace({ id, name, graph });
}

function defaultWorkspaces(): GraphWorkspace[] {
  return [workspace('w1', 'Primary', ['Alpha', 'Beta'], true), workspace('w2', 'Secondary', ['Gamma'])];
}

function renderPanel(workspaces: GraphWorkspace[] = defaultWorkspaces()): void {
  const histories: Record<string, ReturnType<typeof createHistory>> = {};
  for (const item of workspaces) histories[item.id] = createHistory();
  useGraphStore.setState({
    workspaces,
    activeWorkspaceId: workspaces[0].id,
    histories,
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({ modal: null, confirmAction: null, confirmMessage: '', toasts: [] });
  render(<WorkspacePanel />);
}

function workspacesInStore() {
  return useGraphStore.getState().workspaces;
}

describe('WorkspacePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('lists local universes with their active badge and graph counts', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Workspaces' })).toBeInTheDocument();
    expect(screen.getByText('2 local universes')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2 nodes · 1 relationships')).toBeInTheDocument();
    expect(screen.getByText('1 nodes · 0 relationships')).toBeInTheDocument();
  });

  it('creates a workspace from the name field', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('New workspace name'), { target: { value: 'Fresh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(workspacesInStore()).toHaveLength(3);
    expect(workspacesInStore()[2].name).toBe('Fresh');
    expect(useGraphStore.getState().activeWorkspaceId).toBe(workspacesInStore()[2].id);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Workspace “Fresh” created' });
  });

  it('switches to an inactive workspace', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Switch' }));
    expect(useGraphStore.getState().activeWorkspaceId).toBe('w2');
    expect(useGraphStore.getState().selectedNodeIds).toEqual([]);
  });

  it('renames a workspace inline', () => {
    renderPanel();
    fireEvent.click(screen.getAllByRole('button', { name: 'Rename' })[1]);
    const input = screen.getByLabelText('Workspace name');
    expect(input).toHaveValue('Secondary');
    fireEvent.change(input, { target: { value: 'Renamed universe' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(workspacesInStore()[1].name).toBe('Renamed universe');
    expect(screen.queryByLabelText('Workspace name')).not.toBeInTheDocument();
  });

  it('duplicates a workspace and activates the copy', () => {
    renderPanel();
    fireEvent.click(screen.getAllByRole('button', { name: 'Duplicate' })[0]);
    expect(workspacesInStore()).toHaveLength(3);
    expect(workspacesInStore()[2].name).toBe('Primary copy');
    expect(useGraphStore.getState().activeWorkspaceId).toBe(workspacesInStore()[2].id);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Workspace duplicated' });
  });

  it('prevents deleting the last workspace', () => {
    renderPanel([defaultWorkspaces()[0]]);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('deletes a workspace after confirmation', () => {
    renderPanel();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(useUIStore.getState().modal).toBe('confirm');
    expect(useUIStore.getState().confirmMessage).toContain('Delete workspace “Secondary”');
    act(() => { useUIStore.getState().confirmAction?.(); });
    expect(workspacesInStore()).toHaveLength(1);
    expect(workspacesInStore()[0].name).toBe('Primary');
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Deleted “Secondary”' });
  });

  it('loads a demo universe after confirmation', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /Software Engineering/ }));
    expect(useUIStore.getState().confirmMessage).toContain('Replace the current graph');
    act(() => { useUIStore.getState().confirmAction?.(); });
    const titles = useGraphStore.getState().workspaces[0].graph.nodes.map((node) => node.title);
    expect(titles).toContain('Software engineering');
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Software Engineering loaded' });
  });

  it('exports the active workspace as a downloadable backup', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Export workspace JSON' }));
    expect(downloadBlob).toHaveBeenCalledTimes(1);
    expect(vi.mocked(downloadBlob).mock.calls[0][1]).toBe('primary.echo-workspace.json');
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Workspace exported' });
  });

  it('imports a workspace bundle into a new workspace', async () => {
    const payload = JSON.stringify({
      format: 'echo-workspace',
      workspace: {
        name: 'Bundle',
        graph: { nodes: [createNode({ id: 'b1', title: 'Bundle node' })], edges: [], tags: [] },
      },
    });
    vi.mocked(readFileAsText).mockResolvedValueOnce(payload);
    renderPanel();
    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error('File input was not rendered');
    fireEvent.change(input, { target: { files: [new File([payload], 'bundle.json', { type: 'application/json' })] } });
    await waitFor(() => expect(workspacesInStore()).toHaveLength(3));
    expect(workspacesInStore()[2].name).toBe('Bundle (imported)');
    expect(useGraphStore.getState().workspaces[2].graph.nodes.map((node) => node.title)).toEqual(['Bundle node']);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Imported “Bundle”' });
  });
});
