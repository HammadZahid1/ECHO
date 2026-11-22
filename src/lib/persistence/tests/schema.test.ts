import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDefaultGraph,
  DB_NAME,
  DB_VERSION,
  DEFAULT_PREFERENCES,
  migratedWorkspace,
} from '@/lib/persistence/schema';
import { createNode } from '@/lib/graph/factory';

afterEach(() => vi.useRealTimers());

describe('schema constants', () => {
  it('declares one local database name and version', () => {
    expect(DB_NAME).toBe('echo-knowledge');
    expect(DB_VERSION).toBe(1);
  });

  it('exposes a complete, deterministic preference baseline', () => {
    expect(DEFAULT_PREFERENCES).toEqual({
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
    });
  });

  it('creates independent empty graphs', () => {
    const first = createDefaultGraph();
    const second = createDefaultGraph();

    expect(first).toEqual({ nodes: [], edges: [], tags: [] });
    expect(first).not.toBe(second);
    first.nodes.push(createNode({ id: 'x' }));
    expect(second.nodes).toEqual([]);
  });
});

describe('migratedWorkspace', () => {
  it('fills every missing field with deterministic defaults', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T03:04:05.000Z'));
    const now = Date.now();

    const workspace = migratedWorkspace({});

    expect(workspace).toMatchObject({
      id: `workspace_${now}`,
      name: 'Untitled universe',
      description: '',
      createdAt: now,
      updatedAt: now,
      color: '#4fd8e8',
      graph: { nodes: [], edges: [], tags: [] },
      collections: [],
      snapshots: [],
      camera: { position: { x: 0, y: 4, z: 90 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 },
    });
    expect(workspace.settings.layout.kind).toBe('force');
    expect(workspace.settings.visual.quality).toBe('high');
  });

  it('preserves supplied fields and graph identity', () => {
    const graph = createDefaultGraph();
    const camera = { position: { x: 1, y: 2, z: 3 }, target: { x: 0, y: 0, z: 0 }, zoom: 2 };

    const workspace = migratedWorkspace({
      id: 'w1',
      name: 'My map',
      description: 'Local notes',
      createdAt: 1,
      updatedAt: 2,
      color: '#ffffff',
      graph,
      camera,
    });

    expect(workspace).toMatchObject({
      id: 'w1',
      name: 'My map',
      description: 'Local notes',
      createdAt: 1,
      updatedAt: 2,
      color: '#ffffff',
      camera,
    });
    expect(workspace.graph).toBe(graph);
  });
});
