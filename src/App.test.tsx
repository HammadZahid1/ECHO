import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { createHistory, createNode, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';

vi.mock('@/lib/persistence/repository', () => ({
  loadWorkspaces: vi.fn(async () => ({ workspaces: [], issues: [], available: false })),
  saveWorkspace: vi.fn(async () => undefined),
  deleteWorkspace: vi.fn(async () => undefined),
  saveGraphSnapshot: vi.fn(async () => undefined),
  saveHistory: vi.fn(async () => undefined),
  loadHistory: vi.fn(async () => undefined),
  storageInfo: vi.fn(async () => ({ usage: 0, quota: 0 })),
  createDebouncedSaver: vi.fn(() => vi.fn()),
}));
vi.mock('@/components/graph/GraphViewport', () => ({
  GraphViewport: () => <div data-testid="graph-viewport">Graph viewport</div>,
}));
vi.mock('@/components/panels/Inspector', () => ({
  Inspector: () => <div data-testid="panel-inspector">Inspector body</div>,
}));
vi.mock('@/components/panels/ExplorerPanel', () => ({ ExplorerPanel: () => <div>Explorer body</div> }));
vi.mock('@/components/panels/AnalyticsPanel', () => ({ AnalyticsPanel: () => <div>Analytics body</div> }));
vi.mock('@/components/panels/HealthPanel', () => ({ HealthPanel: () => <div>Health body</div> }));
vi.mock('@/components/panels/PathFinderPanel', () => ({ PathFinderPanel: () => <div>Paths body</div> }));
vi.mock('@/components/panels/TimelinePanel', () => ({ TimelinePanel: () => <div>Timeline body</div> }));
vi.mock('@/components/panels/Onboarding', () => ({ Onboarding: () => <div data-testid="onboarding" /> }));
vi.mock('@/components/panels/CommandPalette', () => ({ CommandPalette: () => <div data-testid="command-palette" /> }));
vi.mock('@/components/panels/SettingsPanel', () => ({ SettingsPanel: () => <div>Settings body</div> }));
vi.mock('@/components/panels/SearchPanel', () => ({
  SearchPanel: ({ onClose }: { onClose?: () => void }) => (
    <div><button type="button" onClick={onClose}>Close search body</button></div>
  ),
}));
vi.mock('@/components/panels/ImportPanel', () => ({ ImportPanel: () => <div>Import body</div> }));
vi.mock('@/components/panels/ExportPanel', () => ({ ExportPanel: () => <div>Export body</div> }));
vi.mock('@/components/panels/WorkspacePanel', () => ({ WorkspacePanel: () => <div>Workspace body</div> }));
vi.mock('@/components/panels/SnapshotsPanel', () => ({ SnapshotsPanel: () => <div>Snapshots body</div> }));
vi.mock('@/components/panels/ComparePanel', () => ({ ComparePanel: () => <div>Compare body</div> }));
vi.mock('@/components/panels/ShortcutsPanel', () => ({ ShortcutsPanel: () => <div data-testid="panel-shortcuts">Shortcuts body</div> }));

describe('App', () => {
  beforeEach(() => {
    const workspace = createWorkspace({
      id: 'ws-1',
      name: 'Primary universe',
      graph: { nodes: [createNode({ id: 'n1', title: 'Existing' })], edges: [], tags: [] },
    });
    act(() => useGraphStore.setState({
      workspaces: [workspace],
      activeWorkspaceId: workspace.id,
      histories: { [workspace.id]: createHistory() },
      selectedNodeIds: [],
      storageStatus: 'idle',
      filters: {},
      initialized: true,
    }));
    useUIStore.setState({
      view: 'universe',
      commandPaletteOpen: false,
      searchOpen: false,
      modal: null,
      contextMenu: null,
      toasts: [],
      mobileNavOpen: false,
      panelVisibility: { sidebar: true, inspector: true, explorer: true, tools: true, status: true },
    });
    useSettingsStore.setState({
      theme: 'midnight',
      accent: 'cyan',
      accessibility: { reduceMotion: false, highContrast: false, largeText: false, screenReaderGraphSummary: true },
    });
  });

  afterEach(() => cleanup());

  it('renders the full ECHO shell with all primary regions', () => {
    render(<App />);
    expect(screen.getAllByRole('banner').length).toBeGreaterThan(0);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getAllByText('Library').length).toBeGreaterThan(0);
    expect(screen.getByTestId('graph-viewport')).toBeInTheDocument();
    expect(screen.getByTestId('panel-inspector')).toBeInTheDocument();
    expect(screen.getByText('1 nodes · 0 links')).toBeInTheDocument();
  });

  it('wires store toasts into the rendered notification host', () => {
    render(<App />);
    act(() => useUIStore.getState().pushToast({ kind: 'success', title: 'Saved locally', detail: 'All changes are on this device.' }));

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Saved locally');
    expect(toast).toHaveTextContent('All changes are on this device.');
    fireEvent.click(within(toast).getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('wires global shortcuts from the shell into the UI store', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: '?' });
    expect(useUIStore.getState().modal).toBe('shortcuts');
    expect(screen.getByTestId('panel-shortcuts')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it('applies persisted settings to the document root through the shell', () => {
    render(<App />);
    act(() => useSettingsStore.setState({ theme: 'obsidian', accent: 'blue' }));
    expect(document.documentElement.dataset.theme).toBe('obsidian');
    expect(document.documentElement.dataset.accent).toBe('blue');
  });
});
