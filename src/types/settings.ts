import type { LayoutKind } from './workspace';

export type ViewMode =
  | 'universe'
  | 'graph-2d'
  | 'radial'
  | 'hierarchical'
  | 'cluster'
  | 'timeline'
  | 'table'
  | 'network';

export type PanelId = 'sidebar' | 'inspector' | 'explorer' | 'tools' | 'status';

export interface PanelLayout {
  sidebarWidth: number;
  inspectorWidth: number;
  explorerWidth: number;
  visible: Record<PanelId, boolean>;
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderGraphSummary: boolean;
}

export interface PreferenceSettings {
  theme: 'midnight' | 'graphite' | 'obsidian';
  accent: 'cyan' | 'violet' | 'blue';
  animations: boolean;
  showOnboarding: boolean;
  onboardingComplete: boolean;
  autoSave: boolean;
  searchHistoryLimit: number;
  historyLimit: number;
  defaultView: ViewMode;
  defaultLayout: LayoutKind;
  accessibility: AccessibilitySettings;
  panels: PanelLayout;
}

export interface ShortcutDefinition {
  id: string;
  keys: string;
  label: string;
  group: string;
}

export interface ToastMessage {
  id: string;
  kind: 'info' | 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
  createdAt: number;
  duration: number;
}

export interface ContextMenuState {
  x: number;
  y: number;
  target: 'node' | 'edge' | 'graph' | 'cluster';
  targetId?: string;
}
