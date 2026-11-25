import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/shell/AppShell';
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
vi.mock('@/components/panels/ExplorerPanel', () => ({
  ExplorerPanel: () => <div data-testid="panel-explorer">Explorer body</div>,
}));
vi.mock('@/components/panels/AnalyticsPanel', () => ({
  AnalyticsPanel: () => <div data-testid="panel-analytics">Analytics body</div>,
}));
vi.mock('@/components/panels/HealthPanel', () => ({
  HealthPanel: () => <div data-testid="panel-health">Health body</div>,
}));
vi.mock('@/components/panels/PathFinderPanel', () => ({
  PathFinderPanel: () => <div data-testid="panel-paths">Paths body</div>,
}));
vi.mock('@/components/panels/TimelinePanel', () => ({
  TimelinePanel: () => <div data-testid="panel-timeline">Timeline body</div>,
}));
vi.mock('@/components/panels/Onboarding', () => ({
  Onboarding: () => <div data-testid="onboarding">Onboarding</div>,
}));
vi.mock('@/components/panels/CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette">Command palette body</div>,
}));
vi.mock('@/components/panels/SettingsPanel', () => ({
  SettingsPanel: () => <div data-testid="panel-settings">Settings body</div>,
}));
vi.mock('@/components/panels/SearchPanel', () => ({
  SearchPanel: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="panel-search"><button type="button" onClick={onClose}>Close search body</button></div>
  ),
}));
vi.mock('@/components/panels/ImportPanel', () => ({
  ImportPanel: () => <div data-testid="panel-import">Import body</div>,
}));
vi.mock('@/components/panels/ExportPanel', () => ({
  ExportPanel: () => <div data-testid="panel-export">Export body</div>,
}));
vi.mock('@/components/panels/WorkspacePanel', () => ({
  WorkspacePanel: () => <div data-testid="panel-workspace">Workspace body</div>,
}));
vi.mock('@/components/panels/SnapshotsPanel', () => ({
  SnapshotsPanel: () => <div data-testid="panel-snapshot">Snapshots body</div>,
}));
vi.mock('@/components/panels/ComparePanel', () => ({
  ComparePanel: () => <div data-testid="panel-compare">Compare body</div>,
}));
vi.mock('@/components/panels/ShortcutsPanel', () => ({
  ShortcutsPanel: () => <div data-testid="panel-shortcuts">Shortcuts body</div>,
}));

function resetStores(): void {
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
    selectedEdgeId: null,
    storageStatus: 'idle',
    filters: {},
    initialized: true,
  }));
  act(() => useUIStore.setState({
    view: 'universe',
    commandPaletteOpen: false,
    searchOpen: false,
    modal: null,
    confirmMessage: '',
    confirmAction: null,
    contextMenu: null,
    toasts: [],
    mobileNavOpen: false,
    activeTool: 'select',
    panelVisibility: { sidebar: true, inspector: true, explorer: true, tools: true, status: true },
  }));
  act(() => useSettingsStore.setState({
    theme: 'midnight',
    accent: 'cyan',
    accessibility: { reduceMotion: false, highContrast: false, largeText: false, screenReaderGraphSummary: true },
  }));
}

describe('AppShell', () => {
  beforeEach(() => resetStores());

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('composes the header, sidebar, viewport, right panel and status bar', () => {
    render(<AppShell />);
    expect(screen.getAllByRole('banner').length).toBeGreaterThan(0);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getAllByText('ECHO').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Library').length).toBeGreaterThan(0);
    expect(screen.getByTestId('graph-viewport')).toBeInTheDocument();
    expect(screen.getByTestId('panel-inspector')).toBeInTheDocument();
    expect(screen.getByTitle('Details')).toHaveAttribute('aria-current', 'page');
  });

  it('switches the right panel content with its tab buttons', () => {
    render(<AppShell />);
    fireEvent.click(screen.getByTitle('Metrics'));
    expect(screen.getByTestId('panel-analytics')).toBeInTheDocument();
    expect(screen.queryByTestId('panel-inspector')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Time'));
    expect(screen.getByTestId('panel-timeline')).toBeInTheDocument();
    expect(screen.getByTitle('Time')).toHaveAttribute('aria-current', 'page');
  });

  it('hides and restores the right panel', () => {
    render(<AppShell />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide side panel' }));
    expect(screen.queryByTitle('Details')).not.toBeInTheDocument();
    expect(screen.getByTestId('graph-viewport')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show side panel' }));
    expect(screen.getByTestId('panel-inspector')).toBeInTheDocument();
  });

  it('shows a Show panel button when the inspector is hidden by preferences', () => {
    act(() => useUIStore.setState({
      panelVisibility: { sidebar: true, inspector: false, explorer: true, tools: true, status: true },
    }));
    render(<AppShell />);
    expect(screen.queryByTitle('Details')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show panel' }));
    expect(useUIStore.getState().panelVisibility.inspector).toBe(true);
    expect(screen.getByTestId('panel-inspector')).toBeInTheDocument();
  });

  it('opens and closes the mobile navigation overlay', () => {
    render(<AppShell />);
    expect(useUIStore.getState().mobileNavOpen).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation' }));
    expect(useUIStore.getState().mobileNavOpen).toBe(true);
    expect(screen.getAllByText('Library')).toHaveLength(2);

    const closeButtons = screen.getAllByRole('button', { name: 'Close navigation' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(useUIStore.getState().mobileNavOpen).toBe(false);
  });

  it('handles global keyboard shortcuts for palette, shortcuts modal and Escape', () => {
    act(() => useGraphStore.setState({ selectedNodeIds: ['n1'] }));
    render(<AppShell />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    fireEvent.keyDown(window, { key: '?' });
    expect(useUIStore.getState().modal).toBe('shortcuts');
    expect(screen.getByTestId('panel-shortcuts')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    expect(useUIStore.getState().modal).toBeNull();
    expect(useGraphStore.getState().selectedNodeIds).toEqual([]);
  });

  it('creates a node with the N shortcut', () => {
    render(<AppShell />);
    expect(useGraphStore.getState().workspaces[0].graph.nodes).toHaveLength(1);
    fireEvent.keyDown(window, { key: 'n' });
    expect(useGraphStore.getState().workspaces[0].graph.nodes).toHaveLength(2);
  });

  it('applies theme and accessibility settings to the document root', () => {
    render(<AppShell />);
    expect(document.documentElement.dataset.theme).toBe('midnight');

    act(() => useSettingsStore.setState({
      theme: 'graphite',
      accent: 'violet',
      accessibility: { reduceMotion: true, highContrast: true, largeText: true, screenReaderGraphSummary: true },
    }));

    expect(document.documentElement.dataset.theme).toBe('graphite');
    expect(document.documentElement.dataset.accent).toBe('violet');
    expect(document.documentElement).toHaveClass('echo-reduce-motion', 'echo-high-contrast', 'echo-large-text');
  });

  it('flushes the active workspace before unload', () => {
    const persistNow = vi.spyOn(useGraphStore.getState(), 'persistNow').mockResolvedValue(undefined);
    render(<AppShell />);

    fireEvent(window, new Event('beforeunload'));

    expect(persistNow).toHaveBeenCalledTimes(1);
  });

  it('initializes the graph store on first mount', async () => {
    act(() => useGraphStore.setState({ initialized: false }));
    render(<AppShell />);
    await waitFor(() => expect(useGraphStore.getState().initialized).toBe(true));
    expect(useGraphStore.getState().storageStatus).toBe('error');
  });
});
