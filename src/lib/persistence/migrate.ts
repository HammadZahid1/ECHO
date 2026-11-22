import type { GraphWorkspace, PreferenceSettings } from '@/types';
import { DEFAULT_PREFERENCES, migratedWorkspace } from './schema';
import { normalizeGraph } from '@/lib/graph/validate';

/** Validates and upgrades persisted records before they reach application state. */
export function migrateWorkspace(value: unknown): { workspace: GraphWorkspace | null; issues: string[] } {
  if (typeof value !== 'object' || value === null) return { workspace: null, issues: ['Workspace record is not an object'] };
  const raw = value as Partial<GraphWorkspace>;
  const issues: string[] = [];
  if (!raw.graph || !Array.isArray(raw.graph.nodes) || !Array.isArray(raw.graph.edges)) {
    issues.push('Workspace graph data is malformed; recovering with an empty graph');
  }
  const normalized = normalizeGraph(raw.graph ?? { nodes: [], edges: [], tags: [] });
  issues.push(...normalized.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message));
  const workspace = migratedWorkspace({
    ...raw,
    graph: normalized.graph,
  });
  return { workspace, issues };
}

export function migratePreferences(value: unknown): PreferenceSettings {
  if (typeof value !== 'object' || value === null) return DEFAULT_PREFERENCES;
  const raw = value as Partial<PreferenceSettings>;
  return {
    ...DEFAULT_PREFERENCES,
    ...raw,
    accessibility: { ...DEFAULT_PREFERENCES.accessibility, ...raw.accessibility },
    panels: {
      ...DEFAULT_PREFERENCES.panels,
      ...raw.panels,
      visible: { ...DEFAULT_PREFERENCES.panels.visible, ...raw.panels?.visible },
    },
  };
}

export function isCorrupt(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'object' && Object.keys(value as object).length === 0);
}
