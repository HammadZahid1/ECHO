import type { GraphData, GraphHistory, GraphWorkspace } from '@/types';
import { dbDelete, dbGet, dbGetAll, dbPut, estimateStorage, isIndexedDbAvailable } from './db';
import { migrateWorkspace } from './migrate';
import type { PersistedWorkspace } from './schema';

export interface LoadResult {
  workspaces: GraphWorkspace[];
  issues: string[];
  available: boolean;
}

export async function loadWorkspaces(): Promise<LoadResult> {
  if (!isIndexedDbAvailable()) return { workspaces: [], issues: ['IndexedDB is unavailable in this browser'], available: false };
  try {
    const records = await dbGetAll<PersistedWorkspace>('workspaces');
    const workspaces: GraphWorkspace[] = [];
    const issues: string[] = [];
    for (const record of records) {
      const result = migrateWorkspace(record.workspace);
      if (result.workspace) workspaces.push(result.workspace);
      issues.push(...result.issues);
    }
    return { workspaces, issues, available: true };
  } catch (error) {
    return { workspaces: [], issues: [error instanceof Error ? error.message : 'Failed to load workspaces'], available: false };
  }
}

export async function saveWorkspace(workspace: GraphWorkspace): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  await dbPut('workspaces', {
    id: workspace.id,
    updatedAt: Date.now(),
    workspace,
  } satisfies PersistedWorkspace);
}

export async function deleteWorkspace(id: string): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  await dbDelete('workspaces', id);
}

export async function saveGraphSnapshot(workspaceId: string, graph: GraphData): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  await dbPut('snapshots', { id: `${workspaceId}_${Date.now()}`, workspaceId, graph, createdAt: Date.now() });
}

export async function saveHistory(id: string, history: GraphHistory): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  await dbPut('history', { id, ...history });
}

export async function loadHistory(id: string): Promise<GraphHistory | undefined> {
  if (!isIndexedDbAvailable()) return undefined;
  return dbGet<GraphHistory>('history', id);
}

export async function storageInfo(): Promise<{ usage: number; quota: number }> {
  return estimateStorage();
}

export function createDebouncedSaver(delay = 600): (workspace: GraphWorkspace) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: GraphWorkspace | undefined;
  return (workspace: GraphWorkspace) => {
    pending = workspace;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (pending) void saveWorkspace(pending).catch(() => undefined);
      pending = undefined;
      timer = undefined;
    }, delay);
  };
}
