import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ImportPanel } from '@/components/panels/ImportPanel';
import { readFileAsText } from '@/lib/utils/download';
import { createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

vi.mock('@/lib/utils/download', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/download')>();
  return { ...actual, readFileAsText: vi.fn() };
});

const JSON_TEXT = JSON.stringify({
  nodes: [
    { id: 'new1', title: 'Imported alpha', type: 'concept', description: 'From JSON' },
    { id: 'new2', title: 'Imported beta', type: 'idea', description: 'Also from JSON' },
  ],
  edges: [{ id: 'ie1', source: 'new1', target: 'new2', type: 'related' }],
});

function fixture(): GraphData {
  return {
    nodes: [createNode({ id: 'old', title: 'Existing' })],
    edges: [],
    tags: [],
  };
}

function renderPanel(): void {
  const workspace = createWorkspace({ name: 'Test universe', graph: fixture() });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({ toasts: [], modal: null });
  render(<ImportPanel />);
}

describe('ImportPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    renderPanel();
  });

  it('shows an empty state and disables import actions without content', () => {
    expect(screen.getByRole('heading', { name: 'Import' })).toBeInTheDocument();
    expect(screen.getByText('Nothing to import')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge into current' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Replace current' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument();
  });

  it('previews pasted JSON with detected format and counts', () => {
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: JSON_TEXT } });
    expect(screen.getByText('json')).toBeInTheDocument();
    expect(screen.getByText('No issues reported by the local parser.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge into current' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Replace current' })).toBeEnabled();
  });

  it('merges imported nodes into the active graph and clears the draft', () => {
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: JSON_TEXT } });
    fireEvent.click(screen.getByRole('button', { name: 'Merge into current' }));
    const graph = useGraphStore.getState().workspaces[0].graph;
    expect(graph.nodes.map((node) => node.title)).toEqual(['Existing', 'Imported alpha', 'Imported beta']);
    expect(graph.edges).toHaveLength(1);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ kind: 'success', title: 'Imported into universe' });
    expect(screen.getByText('Nothing to import')).toBeInTheDocument();
  });

  it('replaces the active graph when replace is chosen', () => {
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: JSON_TEXT } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace current' }));
    const graph = useGraphStore.getState().workspaces[0].graph;
    expect(graph.nodes.map((node) => node.title)).toEqual(['Imported alpha', 'Imported beta']);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'Universe replaced' });
  });

  it('reports blocking issues for malformed JSON', () => {
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: '{"nodes": ' } });
    expect(screen.getByText('1 blocking issue')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge into current' })).toBeDisabled();
  });

  it('reads an uploaded file and uses its name for the import label', async () => {
    vi.mocked(readFileAsText).mockResolvedValueOnce(JSON_TEXT);
    const file = new File([JSON_TEXT], 'ideas.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]');
    if (!input) throw new Error('File input was not rendered');
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('ideas.json')).toBeInTheDocument();
    expect(readFileAsText).toHaveBeenCalledWith(file);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('toggles import options', () => {
    const toggle = screen.getByRole('switch', { name: 'Create missing nodes' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('switch', { name: 'Create missing nodes' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Parse relationships' })).toHaveAttribute('aria-checked', 'true');
  });
});
