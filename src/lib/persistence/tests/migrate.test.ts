import { describe, expect, it } from 'vitest';
import { isCorrupt, migratePreferences, migrateWorkspace } from '@/lib/persistence/migrate';
import { DEFAULT_PREFERENCES } from '@/lib/persistence/schema';
import { createEdge, createNode, createWorkspace } from '@/lib/graph/factory';
import type { PreferenceSettings } from '@/types';

describe('migrateWorkspace', () => {
  it('rejects non-object records without throwing', () => {
    for (const value of [null, undefined, 'record', 42]) {
      expect(migrateWorkspace(value)).toEqual({
        workspace: null,
        issues: ['Workspace record is not an object'],
      });
    }
  });

  it('reports malformed graph data and recovers with an empty graph', () => {
    const raw = { ...createWorkspace({ id: 'w', name: 'Broken' }), graph: { nodes: 'nope' } };
    const result = migrateWorkspace(raw);

    expect(result.workspace?.id).toBe('w');
    expect(result.workspace?.name).toBe('Broken');
    expect(result.workspace?.graph).toEqual({ nodes: [], edges: [], tags: [] });
    expect(result.issues).toContain('Workspace graph data is malformed; recovering with an empty graph');
  });

  it('repairs an untrusted graph and surfaces only error-level issues', () => {
    const workspace = createWorkspace({ id: 'w2' });
    workspace.graph.nodes.push(
      createNode({ id: 'ok', title: 'Valid', createdAt: 10, updatedAt: 20 }),
      createNode({ id: 'bad', title: '   ' }),
    );
    workspace.graph.edges.push(createEdge('ok', 'missing', { id: 'dangling' }));

    const result = migrateWorkspace(workspace);

    expect(result.issues).toContain('Node title is required');
    expect(result.issues).toContain('Edge references missing node "missing"');
    expect(result.workspace?.graph.nodes.map((node) => node.id)).toEqual(['ok']);
    expect(result.workspace?.graph.edges).toEqual([]);
    expect(result.workspace?.name).toBe('Untitled universe');
  });
});

describe('migratePreferences', () => {
  it('deep-merges overrides with defaults', () => {
    const preferences = migratePreferences({
      theme: 'obsidian',
      accessibility: { reduceMotion: true },
      panels: { sidebarWidth: 400, visible: { sidebar: false } },
    } as Partial<PreferenceSettings>);

    expect(preferences.theme).toBe('obsidian');
    expect(preferences.accent).toBe('cyan');
    expect(preferences.accessibility).toEqual({
      reduceMotion: true,
      highContrast: false,
      largeText: false,
      screenReaderGraphSummary: true,
    });
    expect(preferences.panels.sidebarWidth).toBe(400);
    expect(preferences.panels.inspectorWidth).toBe(320);
    expect(preferences.panels.visible).toEqual({
      sidebar: false,
      inspector: true,
      explorer: true,
      tools: true,
      status: true,
    });
  });

  it('falls back for invalid input and never aliases nested defaults', () => {
    expect(migratePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(migratePreferences('bad')).toEqual(DEFAULT_PREFERENCES);

    const preferences = migratePreferences({});
    preferences.accessibility.largeText = true;
    preferences.panels.visible.sidebar = false;

    expect(DEFAULT_PREFERENCES.accessibility.largeText).toBe(false);
    expect(DEFAULT_PREFERENCES.panels.visible.sidebar).toBe(true);
  });
});

describe('isCorrupt', () => {
  it('treats nullish and empty objects as corrupt', () => {
    expect(isCorrupt(null)).toBe(true);
    expect(isCorrupt(undefined)).toBe(true);
    expect(isCorrupt({})).toBe(true);
    expect(isCorrupt([])).toBe(true);
  });

  it('accepts populated objects and primitives', () => {
    expect(isCorrupt({ id: 'w' })).toBe(false);
    expect(isCorrupt([1])).toBe(false);
    expect(isCorrupt('')).toBe(false);
    expect(isCorrupt(0)).toBe(false);
  });
});
