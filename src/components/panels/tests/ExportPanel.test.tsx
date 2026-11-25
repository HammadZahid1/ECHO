import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExportPanel } from '@/components/panels/ExportPanel';
import { exportGraph } from '@/lib/exporters';
import { downloadBlob } from '@/lib/utils/download';
import { createCamera, createDefaultSettings, createEdge, createGraphData, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphSnapshot } from '@/types';

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
  return { ...actual, exportGraph: vi.fn(actual.exportGraph) };
});

function fixture(): ReturnType<typeof createGraphData> {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha' }),
      createNode({ id: 'n2', title: 'Beta' }),
      createNode({ id: 'n3', title: 'Gamma' }),
      createNode({ id: 'n4', title: 'Delta' }),
    ],
    edges: [
      createEdge('n1', 'n2', { id: 'e1' }),
      createEdge('n2', 'n3', { id: 'e2' }),
      createEdge('n3', 'n4', { id: 'e3' }),
    ],
    tags: [],
  };
}

function snapshot(): GraphSnapshot {
  return {
    id: 's1', name: 'Before refactor', description: '', createdAt: 1_000,
    graph: fixture(), settings: createDefaultSettings(), camera: createCamera(),
  };
}

function renderPanel(selectedNodeIds: string[] = []): void {
  const workspace = createWorkspace({ name: 'Test universe', graph: fixture(), snapshots: [snapshot()] });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds,
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useUIStore.setState({ toasts: [], modal: null });
  render(<ExportPanel />);
}

describe('ExportPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    renderPanel();
  });

  it('offers all formats and reports the full graph scope', () => {
    expect(screen.getByRole('heading', { name: 'Export' })).toBeInTheDocument();
    const options = screen.getByLabelText('Format').querySelectorAll('option');
    expect(Array.from(options).map((option) => option.textContent)).toEqual(['JSON', 'CSV · nodes', 'CSV · relationships', 'Markdown', 'SVG', 'PNG']);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export graph' })).toBeInTheDocument();
  });

  it('reflects and changes inclusion options', () => {
    const metadata = screen.getByRole('switch', { name: 'Metadata' });
    expect(metadata).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(metadata);
    expect(screen.getByRole('switch', { name: 'Metadata' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: 'Positions' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Timestamps' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: 'Pretty print' })).toHaveAttribute('aria-checked', 'true');
  });

  it('narrows the scope to selected nodes and their relationships', () => {
    act(() => { useGraphStore.setState({ selectedNodeIds: ['n1', 'n2'] }); });
    fireEvent.change(screen.getByLabelText('Scope'), { target: { value: 'selected' } });
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('exports JSON, downloads the file and reports the last export', async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Export graph' }));
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
    const [content, filename, mimeType] = vi.mocked(downloadBlob).mock.calls[0];
    expect(filename).toBe('test-universe.json');
    expect(mimeType).toBe('application/json');
    expect(String(content)).toMatch(/"format":\s*"echo-graph"/);
    expect(String(content)).toContain('Alpha');
    expect(screen.getByText('Last export: test-universe.json')).toBeInTheDocument();
    expect(useUIStore.getState().toasts[0]).toMatchObject({ kind: 'success', title: 'Export ready' });
  });

  it('requires a snapshot choice before exporting one', () => {
    const button = screen.getByRole('button', { name: 'Export snapshot (.json)' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Snapshot'), { target: { value: 's1' } });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(vi.mocked(downloadBlob).mock.calls[0]?.[1]).toBe('before-refactor.echo-snapshot.json');
  });

  it('exports a workspace bundle', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Export whole workspace (.json)' }));
    expect(vi.mocked(downloadBlob).mock.calls[0]?.[1]).toBe('test-universe.echo-workspace.json');
    expect(String(vi.mocked(downloadBlob).mock.calls[0]?.[0])).toMatch(/"format":\s*"echo-workspace"/);
  });

  it('shows an error when graph export fails', async () => {
    vi.mocked(exportGraph).mockRejectedValueOnce(new Error('Export blocked'));
    fireEvent.click(screen.getByRole('button', { name: 'Export graph' }));
    expect(await screen.findByText('Export error')).toBeInTheDocument();
    expect(screen.getByText('Export blocked')).toBeInTheDocument();
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(useUIStore.getState().toasts[0]).toMatchObject({ kind: 'error', title: 'Export failed' });
    expect(screen.getByRole('button', { name: 'Export graph' })).toBeEnabled();
  });
});
