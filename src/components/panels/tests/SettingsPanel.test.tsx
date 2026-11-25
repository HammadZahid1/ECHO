import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { storageInfo } from '@/lib/persistence/repository';
import { createHistory, createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';

vi.mock('@/lib/persistence/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/persistence/repository')>();
  return {
    ...actual,
    createDebouncedSaver: () => () => undefined,
    saveWorkspace: vi.fn().mockResolvedValue(undefined),
    storageInfo: vi.fn().mockResolvedValue({ usage: 1024, quota: 2048 }),
  };
});

function renderPanel(): void {
  const workspace = createWorkspace({ name: 'Test universe' });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: createHistory() },
    selectedNodeIds: [],
    selectedEdgeId: null,
    focusedNodeId: null,
    filters: {},
  });
  useSettingsStore.setState({
    theme: 'midnight',
    accent: 'cyan',
    animations: true,
    autoSave: true,
    showOnboarding: false,
    onboardingComplete: true,
    accessibility: { reduceMotion: false, highContrast: false, largeText: false, screenReaderGraphSummary: true },
  });
  useUIStore.setState({ modal: null, toasts: [] });
  render(<SettingsPanel />);
}

async function renderPanelAsync(): Promise<void> {
  await act(async () => {
    renderPanel();
  });
}

function activeWorkspaceSettings() {
  return useGraphStore.getState().workspaces[0].settings;
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders layout controls and reports storage usage', async () => {
    await renderPanelAsync();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect((screen.getByRole('slider', { name: 'Repulsion' }) as HTMLInputElement).value).toBe('68');
    expect(await screen.findByText('Local storage: 1.0 KB of 2.0 KB used')).toBeInTheDocument();
  });

  it('changes a layout force and the running state', async () => {
    await renderPanelAsync();
    fireEvent.change(screen.getByRole('slider', { name: 'Repulsion' }), { target: { value: '200' } });
    expect(activeWorkspaceSettings().layout.repulsion).toBe(200);
    fireEvent.click(screen.getByRole('switch', { name: 'Layout running' }));
    expect(activeWorkspaceSettings().layout.running).toBe(false);
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('toggles visual options and selects a quality preset', async () => {
    await renderPanelAsync();
    expect(screen.getByRole('switch', { name: 'Node labels' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('switch', { name: 'Node labels' }));
    expect(activeWorkspaceSettings().visual.showLabels).toBe(false);
    const quality = within(screen.getByRole('tablist', { name: 'Quality preset' })).getByRole('tab', { name: 'Medium' });
    fireEvent.click(quality);
    expect(activeWorkspaceSettings().visual.quality).toBe('medium');
  });

  it('updates theme and accent preferences', async () => {
    await renderPanelAsync();
    fireEvent.click(within(screen.getByRole('tablist', { name: 'Accent' })).getByRole('tab', { name: 'Violet' }));
    fireEvent.click(within(screen.getByRole('tablist', { name: 'Theme' })).getByRole('tab', { name: 'Obsidian' }));
    expect(useSettingsStore.getState().accent).toBe('violet');
    expect(useSettingsStore.getState().theme).toBe('obsidian');
  });

  it('updates accessibility preferences', async () => {
    await renderPanelAsync();
    fireEvent.click(screen.getByRole('switch', { name: 'Reduced motion' }));
    fireEvent.click(screen.getByRole('switch', { name: 'High contrast' }));
    expect(useSettingsStore.getState().accessibility).toMatchObject({ reduceMotion: true, highContrast: true });
  });

  it('clears graph history and resets preferences with feedback', async () => {
    await renderPanelAsync();
    act(() => { useGraphStore.getState().createNode({ title: 'A node' }); });
    expect(useGraphStore.getState().canUndo()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    expect(useGraphStore.getState().canUndo()).toBe(false);
    expect(useUIStore.getState().toasts[0]).toMatchObject({ title: 'History cleared' });
    act(() => { useSettingsStore.setState({ theme: 'obsidian' }); });
    fireEvent.click(screen.getByRole('button', { name: 'Reset preferences' }));
    expect(useSettingsStore.getState().theme).toBe('midnight');
    const toasts = useUIStore.getState().toasts;
    expect(toasts[toasts.length - 1]).toMatchObject({ title: 'Preferences reset' });
  });

  it('replays the onboarding tour through a modal', async () => {
    await renderPanelAsync();
    fireEvent.click(screen.getByRole('button', { name: 'Replay tour' }));
    expect(useSettingsStore.getState().showOnboarding).toBe(true);
    expect(useUIStore.getState().modal).toBe('onboarding');
  });

  it('reports unavailable storage when the probe fails', async () => {
    vi.mocked(storageInfo).mockRejectedValueOnce(new Error('Storage blocked'));
    await renderPanelAsync();
    expect(await screen.findByText('Local storage: Unavailable in this browser')).toBeInTheDocument();
    await waitFor(() => expect(storageInfo).toHaveBeenCalledTimes(1));
  });
});
