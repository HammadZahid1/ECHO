import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from '@/store/settingsStore';
import { useGraphStore } from '@/store/graphStore';
import { loadPreferences } from '@/lib/persistence/preferences';
import { DEFAULT_PREFERENCES } from '@/lib/persistence/schema';
import { createDefaultSettings, createWorkspace } from '@/lib/graph/factory';

vi.mock('@/lib/persistence/repository', () => ({
  createDebouncedSaver: () => () => undefined,
  loadWorkspaces: async () => ({ workspaces: [], issues: [], available: false }),
  saveWorkspace: async () => undefined,
  deleteWorkspace: async () => undefined,
}));

const PREFERENCES_KEY = 'echo.preferences.v1';

function defaults() {
  return structuredClone(DEFAULT_PREFERENCES);
}

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(defaults());
  const workspace = createWorkspace({ id: 'ws-visual', name: 'Visual settings' });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: {},
    selectedNodeIds: [],
    filters: {},
  });
});

describe('settingsStore', () => {
  it('update patches top-level preferences and persists them locally', () => {
    useSettingsStore.getState().update({ theme: 'graphite', accent: 'violet', searchHistoryLimit: 9 });

    expect(useSettingsStore.getState()).toMatchObject({ theme: 'graphite', accent: 'violet', searchHistoryLimit: 9 });
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY)!);
    expect(stored).toMatchObject({ theme: 'graphite', accent: 'violet', searchHistoryLimit: 9 });
    expect(loadPreferences()).toMatchObject({ theme: 'graphite', accent: 'violet' });
  });

  it('updateAccessibility merges without dropping sibling flags', () => {
    useSettingsStore.getState().updateAccessibility({ reduceMotion: true });

    expect(useSettingsStore.getState().accessibility).toMatchObject({
      reduceMotion: true,
      highContrast: false,
      largeText: false,
      screenReaderGraphSummary: true,
    });

    useSettingsStore.getState().updateAccessibility({ highContrast: true });
    expect(useSettingsStore.getState().accessibility).toMatchObject({ reduceMotion: true, highContrast: true });
  });

  it('updatePanels merges dimensions and visibility flags and persists them', () => {
    useSettingsStore.getState().updatePanels({
      sidebarWidth: 400,
      visible: { ...DEFAULT_PREFERENCES.panels.visible, inspector: false },
    });

    expect(useSettingsStore.getState().panels.sidebarWidth).toBe(400);
    expect(useSettingsStore.getState().panels.inspectorWidth).toBe(DEFAULT_PREFERENCES.panels.inspectorWidth);
    expect(useSettingsStore.getState().panels.visible.inspector).toBe(false);
    expect(loadPreferences().panels.visible.inspector).toBe(false);
  });

  it('updateVisual delegates to the matching workspace and ignores unknown ids', () => {
    useSettingsStore.getState().updateVisual('ws-visual', { showGrid: true, nodeScale: 1.5 });
    useSettingsStore.getState().updateVisual('missing-workspace', { showGrid: false });

    const workspace = useGraphStore.getState().workspaces[0];
    expect(workspace.settings.visual).toMatchObject({
      showGrid: true,
      nodeScale: 1.5,
      showLabels: createDefaultSettings().visual.showLabels,
      background: 'void',
    });
  });

  it('completeOnboarding flips both onboarding flags', () => {
    useSettingsStore.getState().completeOnboarding();

    expect(useSettingsStore.getState()).toMatchObject({ onboardingComplete: true, showOnboarding: false });
    expect(loadPreferences()).toMatchObject({ onboardingComplete: true, showOnboarding: false });
  });

  it('reset restores the original defaults after local edits', () => {
    useSettingsStore.getState().update({ theme: 'obsidian', animations: false });
    useSettingsStore.getState().updateAccessibility({ largeText: true });
    expect(useSettingsStore.getState().theme).toBe('obsidian');

    useSettingsStore.getState().reset();

    expect(useSettingsStore.getState()).toMatchObject(defaults());
    expect(loadPreferences()).toMatchObject({ theme: 'midnight', animations: true });
  });

  it('keeps unrelated preference sections intact across partial updates', () => {
    useSettingsStore.getState().update({ defaultView: 'table' });
    useSettingsStore.getState().updateAccessibility({ largeText: true });

    expect(useSettingsStore.getState()).toMatchObject({
      defaultView: 'table',
      defaultLayout: 'force',
      historyLimit: 120,
      accessibility: { largeText: true, reduceMotion: false },
      panels: { visible: { sidebar: true } },
    });
  });
});
