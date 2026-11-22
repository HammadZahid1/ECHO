import { create } from 'zustand';
import type { AccessibilitySettings, GraphVisualSettings, PanelLayout, PreferenceSettings } from '@/types';
import { loadPreferences, savePreferences } from '@/lib/persistence/preferences';
import { useGraphStore } from './graphStore';

interface SettingsState extends PreferenceSettings {
  update: (patch: Partial<PreferenceSettings>) => void;
  updateAccessibility: (patch: Partial<AccessibilitySettings>) => void;
  updatePanels: (patch: Partial<PanelLayout>) => void;
  updateVisual: (workspaceId: string, patch: Partial<GraphVisualSettings>) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const initial = loadPreferences();

function persist(state: SettingsState): void {
  const { update: _update, updateAccessibility: _a, updatePanels: _p, updateVisual: _v, completeOnboarding: _c, reset: _r, ...preferences } = state;
  void _update; void _a; void _p; void _v; void _c; void _r;
  savePreferences(preferences as PreferenceSettings);
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...initial,

  update: (patch) => {
    set(patch);
    persist(get());
  },
  updateAccessibility: (patch) => {
    set((state) => ({ accessibility: { ...state.accessibility, ...patch } }));
    persist(get());
  },
  updatePanels: (patch) => {
    set((state) => ({ panels: { ...state.panels, ...patch } }));
    persist(get());
  },
  updateVisual: (workspaceId, patch) => {
    const workspace = useGraphStore.getState().workspaces.find((item) => item.id === workspaceId);
    if (!workspace) return;
    useGraphStore.getState().setSettings({ visual: { ...workspace.settings.visual, ...patch } });
  },
  completeOnboarding: () => {
    set({ onboardingComplete: true, showOnboarding: false });
    persist(get());
  },
  reset: () => {
    set(initial);
    persist(get());
  },
}));
