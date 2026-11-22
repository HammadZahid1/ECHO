import type { GraphData, GraphWorkspace, PreferenceSettings } from '@/types';
import { createDefaultSettings } from '@/lib/graph/factory';

export const DB_NAME = 'echo-knowledge';
export const DB_VERSION = 1;

export type StoreName = 'workspaces' | 'snapshots' | 'history' | 'meta';

export interface PersistedWorkspace {
  id: string;
  updatedAt: number;
  workspace: GraphWorkspace;
}

export interface PersistedMeta {
  key: string;
  value: unknown;
}

export const DEFAULT_PREFERENCES: PreferenceSettings = {
  theme: 'midnight',
  accent: 'cyan',
  animations: true,
  showOnboarding: true,
  onboardingComplete: false,
  autoSave: true,
  searchHistoryLimit: 20,
  historyLimit: 120,
  defaultView: 'universe',
  defaultLayout: 'force',
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderGraphSummary: true,
  },
  panels: {
    sidebarWidth: 268,
    inspectorWidth: 320,
    explorerWidth: 294,
    visible: { sidebar: true, inspector: true, explorer: true, tools: true, status: true },
  },
};

export function createDefaultGraph(): GraphData {
  return { nodes: [], edges: [], tags: [] };
}

export function migratedWorkspace(input: Partial<GraphWorkspace>): GraphWorkspace {
  const now = Date.now();
  return {
    id: input.id ?? `workspace_${now}`,
    name: input.name ?? 'Untitled universe',
    description: input.description ?? '',
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    color: input.color ?? '#4fd8e8',
    graph: input.graph ?? createDefaultGraph(),
    settings: input.settings ?? createDefaultSettings(),
    collections: input.collections ?? [],
    snapshots: input.snapshots ?? [],
    camera: input.camera ?? { position: { x: 0, y: 4, z: 90 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 },
  };
}
