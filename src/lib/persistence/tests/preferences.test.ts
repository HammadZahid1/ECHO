import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPreferences, loadPreferences, savePreferences } from '@/lib/persistence/preferences';
import { DEFAULT_PREFERENCES } from '@/lib/persistence/schema';

const KEY = 'echo.preferences.v1';

let store: Map<string, string>;
let memoryStorage: Storage;

beforeEach(() => {
  store = new Map<string, string>();
  memoryStorage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
  vi.stubGlobal('localStorage', memoryStorage);
});

afterEach(() => vi.unstubAllGlobals());

describe('preferences storage', () => {
  it('returns the shared defaults when nothing has been stored', () => {
    expect(loadPreferences()).toBe(DEFAULT_PREFERENCES);
    expect(store.has(KEY)).toBe(false);
  });

  it('round-trips saved preferences through JSON at the versioned key', () => {
    savePreferences({ ...DEFAULT_PREFERENCES, theme: 'graphite', panels: { ...DEFAULT_PREFERENCES.panels, sidebarWidth: 999 } });

    expect(store.has(KEY)).toBe(true);
    expect(JSON.parse(store.get(KEY) ?? '{}').theme).toBe('graphite');

    const loaded = loadPreferences();
    expect(loaded.theme).toBe('graphite');
    expect(loaded.panels.sidebarWidth).toBe(999);
    expect(loaded.historyLimit).toBe(120);
  });

  it('migrates partial legacy payloads on read', () => {
    store.set(KEY, JSON.stringify({ theme: 'obsidian', accessibility: { highContrast: true } }));

    const loaded = loadPreferences();
    expect(loaded.theme).toBe('obsidian');
    expect(loaded.accessibility.highContrast).toBe(true);
    expect(loaded.accessibility.reduceMotion).toBe(false);
    expect(loaded.defaultLayout).toBe('force');
    expect(loaded.panels.visible.explorer).toBe(true);
  });

  it('falls back to defaults for invalid JSON', () => {
    store.set(KEY, '{not json');
    expect(loadPreferences()).toBe(DEFAULT_PREFERENCES);
  });

  it('clears the stored value and returns to defaults', () => {
    savePreferences(DEFAULT_PREFERENCES);
    expect(store.has(KEY)).toBe(true);

    clearPreferences();
    expect(store.has(KEY)).toBe(false);
    expect(loadPreferences()).toBe(DEFAULT_PREFERENCES);
  });

  it('degrades gracefully when storage throws', () => {
    vi.stubGlobal('localStorage', {
      ...memoryStorage,
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });

    expect(loadPreferences()).toBe(DEFAULT_PREFERENCES);
    expect(() => savePreferences(DEFAULT_PREFERENCES)).not.toThrow();
    expect(() => clearPreferences()).not.toThrow();
  });
});
