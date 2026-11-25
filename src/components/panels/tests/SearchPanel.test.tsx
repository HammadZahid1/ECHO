import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SearchPanel } from '@/components/panels/SearchPanel';
import { createEdge, createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import type { GraphData } from '@/types';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return { ...actual, createDebouncedSaver: () => () => undefined, saveWorkspace: vi.fn().mockResolvedValue(undefined) };
});

function fixture(): GraphData {
  return {
    nodes: [
      createNode({ id: 'n1', title: 'Alpha', type: 'concept', tags: ['science'], description: 'Graph theory', importance: 0.9 }),
      createNode({ id: 'n2', title: 'Beta', type: 'idea', tags: ['math'], description: 'Quantum notes', importance: 0.5 }),
      createNode({ id: 'n3', title: 'Gamma', type: 'note', tags: ['science'], description: 'Unrelated', importance: 0.2 }),
    ],
    edges: [createEdge('n1', 'n2', { id: 'e1' })],
    tags: [],
  };
}

function renderPanel(onClose = vi.fn()): void {
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
  useUIStore.setState({ searchQuery: '', searchOpen: true, modal: null, toasts: [] });
  useSettingsStore.setState({ searchHistoryLimit: 5 });
  render(<SearchPanel onClose={onClose} />);
}

function searchInput(): HTMLInputElement {
  return screen.getByLabelText('Search knowledge');
}

describe('SearchPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows all indexed nodes and a live result count before typing', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Search knowledge' })).toBeInTheDocument();
    expect(screen.getByText('3 results')).toBeInTheDocument();
    expect(screen.getAllByTestId('search-result')).toHaveLength(3);
  });

  it('debounces the query and narrows the results', async () => {
    renderPanel();
    fireEvent.change(searchInput(), { target: { value: 'Alpha' } });
    expect(await screen.findByText('1 result for “Alpha”')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('search-result')).toHaveLength(1));
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  it('highlights the matched portion of a result title', async () => {
    renderPanel();
    fireEvent.change(searchInput(), { target: { value: 'Alpha' } });
    await waitFor(() => expect(screen.getAllByTestId('search-result')).toHaveLength(1));
    const result = screen.getAllByTestId('search-result')[0];
    expect(within(result).getByText('Alpha').tagName).toBe('MARK');
  });

  it('narrows results by node type when filters are open', () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText('Toggle search filters'));
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'idea' } });
    expect(screen.getAllByTestId('search-result')).toHaveLength(1);
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('combines tag and importance filters', () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText('Toggle search filters'));
    fireEvent.click(screen.getByRole('button', { name: 'science' }));
    expect(screen.getAllByTestId('search-result')).toHaveLength(2);
    fireEvent.change(screen.getByRole('slider', { name: 'Minimum importance' }), { target: { value: '0.6' } });
    expect(screen.getAllByTestId('search-result')).toHaveLength(1);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('selects a result, closes the search and records recent history', async () => {
    const onClose = vi.fn();
    renderPanel(onClose);
    fireEvent.change(searchInput(), { target: { value: 'Alpha' } });
    await waitFor(() => expect(screen.getAllByTestId('search-result')).toHaveLength(1));
    fireEvent.click(screen.getAllByTestId('search-result')[0]);
    expect(useGraphStore.getState().selectedNodeIds).toEqual(['n1']);
    expect(useGraphStore.getState().focusedNodeId).toBe('n1');
    expect(useUIStore.getState().searchOpen).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Clear search'));
    const recentLabel = await screen.findByText('Recent searches');
    const recentSection = recentLabel.parentElement?.parentElement;
    if (!recentSection) throw new Error('Recent searches section was not rendered');
    expect(within(recentSection).getByRole('button', { name: /Alpha/ })).toBeInTheDocument();
  });

  it('clears the query on the first Escape and closes on the second', async () => {
    const onClose = vi.fn();
    renderPanel(onClose);
    fireEvent.change(searchInput(), { target: { value: 'Alpha' } });
    await waitFor(() => expect(screen.getAllByTestId('search-result')).toHaveLength(1));
    fireEvent.keyDown(searchInput(), { key: 'Escape' });
    expect(useUIStore.getState().searchQuery).toBe('');
    fireEvent.keyDown(searchInput(), { key: 'Escape' });
    expect(useUIStore.getState().searchOpen).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('offers title suggestions while typing', async () => {
    renderPanel();
    fireEvent.change(searchInput(), { target: { value: 'Al' } });
    const label = await screen.findByText('Suggestions');
    const container = label.parentElement;
    if (!container) throw new Error('Suggestions container was not rendered');
    expect(within(container).getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
  });
});
