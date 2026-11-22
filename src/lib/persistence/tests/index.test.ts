import { describe, expect, it } from 'vitest';
import * as barrel from '@/lib/persistence';
import * as schema from '@/lib/persistence/schema';
import * as db from '@/lib/persistence/db';
import * as migrate from '@/lib/persistence/migrate';
import * as preferences from '@/lib/persistence/preferences';
import * as repository from '@/lib/persistence/repository';

describe('persistence barrel exports', () => {
  it('re-exports schema constants and helpers', () => {
    expect(barrel.DB_NAME).toBe(schema.DB_NAME);
    expect(barrel.DB_VERSION).toBe(schema.DB_VERSION);
    expect(barrel.DEFAULT_PREFERENCES).toBe(schema.DEFAULT_PREFERENCES);
    expect(barrel.createDefaultGraph).toBe(schema.createDefaultGraph);
    expect(barrel.migratedWorkspace).toBe(schema.migratedWorkspace);
  });

  it('re-exports the low-level database helpers', () => {
    expect(barrel.isIndexedDbAvailable).toBe(db.isIndexedDbAvailable);
    expect(barrel.openDatabase).toBe(db.openDatabase);
    expect(barrel.dbGet).toBe(db.dbGet);
    expect(barrel.dbPut).toBe(db.dbPut);
    expect(barrel.dbDelete).toBe(db.dbDelete);
    expect(barrel.dbGetAll).toBe(db.dbGetAll);
    expect(barrel.estimateStorage).toBe(db.estimateStorage);
  });

  it('re-exports migration helpers', () => {
    expect(barrel.migrateWorkspace).toBe(migrate.migrateWorkspace);
    expect(barrel.migratePreferences).toBe(migrate.migratePreferences);
    expect(barrel.isCorrupt).toBe(migrate.isCorrupt);
  });

  it('re-exports preference and repository helpers', () => {
    expect(barrel.loadPreferences).toBe(preferences.loadPreferences);
    expect(barrel.savePreferences).toBe(preferences.savePreferences);
    expect(barrel.clearPreferences).toBe(preferences.clearPreferences);
    expect(barrel.loadWorkspaces).toBe(repository.loadWorkspaces);
    expect(barrel.saveWorkspace).toBe(repository.saveWorkspace);
    expect(barrel.deleteWorkspace).toBe(repository.deleteWorkspace);
    expect(barrel.createDebouncedSaver).toBe(repository.createDebouncedSaver);
    expect(barrel.storageInfo).toBe(repository.storageInfo);
  });
});

describe('barrel-only usage', () => {
  it('migrates local records through the public surface', () => {
    const migrated = barrel.migratePreferences({ theme: 'graphite' });
    expect(migrated.theme).toBe('graphite');
    expect(migrated.accessibility.reduceMotion).toBe(false);

    const workspace = barrel.migratedWorkspace({ id: 'w' });
    expect(workspace.id).toBe('w');
    expect(workspace.graph).toEqual(barrel.createDefaultGraph());
    expect(barrel.isCorrupt({})).toBe(true);
  });
});
