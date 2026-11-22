import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGraphData, createWorkspace } from '@/lib/graph/factory';
import type { GraphHistory } from '@/types';

const db = vi.hoisted(() => ({
  available: true,
  getAll: vi.fn<(store: string) => Promise<unknown[]>>(),
  get: vi.fn<(store: string, key: string) => Promise<unknown>>(),
  put: vi.fn<(store: string, value: unknown) => Promise<void>>(),
  del: vi.fn<(store: string, key: string) => Promise<void>>(),
  estimate: vi.fn<() => Promise<{ usage: number; quota: number }>>(),
}));

vi.mock('@/lib/persistence/db', () => ({
  isIndexedDbAvailable: () => db.available,
  dbGetAll: (store: string) => db.getAll(store),
  dbGet: (store: string, key: string) => db.get(store, key),
  dbPut: (store: string, value: unknown) => db.put(store, value),
  dbDelete: (store: string, key: string) => db.del(store, key),
  estimateStorage: () => db.estimate(),
}));

import {
  createDebouncedSaver,
  deleteWorkspace,
  loadHistory,
  loadWorkspaces,
  saveGraphSnapshot,
  saveHistory,
  saveWorkspace,
  storageInfo,
} from '@/lib/persistence/repository';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-02-03T04:05:06.000Z'));
  db.available = true;
  db.getAll.mockReset();
  db.get.mockReset();
  db.put.mockReset();
  db.del.mockReset();
  db.estimate.mockReset();
  db.getAll.mockResolvedValue([]);
  db.get.mockResolvedValue(undefined);
  db.put.mockResolvedValue(undefined);
  db.del.mockResolvedValue(undefined);
  db.estimate.mockResolvedValue({ usage: 0, quota: 0 });
});

afterEach(() => vi.useRealTimers());

describe('loadWorkspaces', () => {
  it('reports unavailability and skips all reads when IndexedDB is missing', async () => {
    db.available = false;

    expect(await loadWorkspaces()).toEqual({
      workspaces: [],
      issues: ['IndexedDB is unavailable in this browser'],
      available: false,
    });
    expect(db.getAll).not.toHaveBeenCalled();
  });

  it('migrates each persisted record and aggregates issues', async () => {
    const good = createWorkspace({ id: 'good', name: 'Good' });
    const broken = { ...createWorkspace({ id: 'broken', name: 'Broken' }), graph: { nodes: 'bad' } };
    db.getAll.mockResolvedValue([
      { id: 'good', updatedAt: 1, workspace: good },
      { id: 'broken', updatedAt: 2, workspace: broken },
    ]);

    const result = await loadWorkspaces();

    expect(db.getAll).toHaveBeenCalledWith('workspaces');
    expect(result.available).toBe(true);
    expect(result.workspaces.map((workspace) => workspace.id)).toEqual(['good', 'broken']);
    expect(result.workspaces[1].graph).toEqual({ nodes: [], edges: [], tags: [] });
    expect(result.issues).toContain('Workspace graph data is malformed; recovering with an empty graph');
  });

  it('surfaces database failures as issues', async () => {
    db.getAll.mockRejectedValue(new Error('read failed'));

    expect(await loadWorkspaces()).toEqual({ workspaces: [], issues: ['read failed'], available: false });
  });
});

describe('repository writes', () => {
  it('no-ops every write when IndexedDB is unavailable', async () => {
    db.available = false;
    const history: GraphHistory = { entries: [], cursor: -1, limit: 120 };

    await saveWorkspace(createWorkspace());
    await deleteWorkspace('w');
    await saveGraphSnapshot('w', createGraphData());
    await saveHistory('w', history);
    expect(await loadHistory('w')).toBeUndefined();

    expect(db.put).not.toHaveBeenCalled();
    expect(db.del).not.toHaveBeenCalled();
    expect(db.get).not.toHaveBeenCalled();
  });

  it('writes workspace, snapshot and history records with local timestamps', async () => {
    const now = Date.now();
    const workspace = createWorkspace({ id: 'w1' });
    const graph = createGraphData();
    const history: GraphHistory = { entries: [], cursor: -1, limit: 120 };

    await saveWorkspace(workspace);
    expect(db.put).toHaveBeenCalledWith('workspaces', { id: 'w1', updatedAt: now, workspace });

    await deleteWorkspace('w1');
    expect(db.del).toHaveBeenCalledWith('workspaces', 'w1');

    await saveGraphSnapshot('w1', graph);
    expect(db.put).toHaveBeenCalledWith('snapshots', {
      id: `w1_${now}`,
      workspaceId: 'w1',
      graph,
      createdAt: now,
    });

    await saveHistory('w1', history);
    expect(db.put).toHaveBeenCalledWith('history', { id: 'w1', ...history });

    db.get.mockResolvedValue(history);
    expect(await loadHistory('w1')).toBe(history);
    expect(db.get).toHaveBeenCalledWith('history', 'w1');
  });

  it('delegates storage estimates', async () => {
    db.estimate.mockResolvedValue({ usage: 12, quota: 34 });
    expect(await storageInfo()).toEqual({ usage: 12, quota: 34 });
  });
});

describe('createDebouncedSaver', () => {
  it('coalesces rapid calls and persists only the latest workspace', () => {
    const saver = createDebouncedSaver(500);
    saver(createWorkspace({ id: 'a' }));
    saver(createWorkspace({ id: 'b' }));

    vi.advanceTimersByTime(499);
    expect(db.put).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(db.put).toHaveBeenCalledTimes(1);
    expect(db.put).toHaveBeenCalledWith('workspaces', expect.objectContaining({ id: 'b' }));

    saver(createWorkspace({ id: 'c' }));
    vi.advanceTimersByTime(500);
    expect(db.put).toHaveBeenCalledTimes(2);
    expect(db.put).toHaveBeenLastCalledWith('workspaces', expect.objectContaining({ id: 'c' }));
  });
});
