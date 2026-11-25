import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DEFAULT_PREFERENCES } from '@/lib/persistence/schema';
import { useSettingsStore } from '@/store/settingsStore';

vi.mock('@/lib/persistence/repository', () => ({
  createDebouncedSaver: () => () => undefined,
  loadWorkspaces: async () => ({ workspaces: [], issues: [], available: false }),
  saveWorkspace: async () => undefined,
  deleteWorkspace: async () => undefined,
}));

type MediaListener = (event: MediaQueryListEvent) => void;

let systemMatches = false;
const listeners = new Set<MediaListener>();

beforeEach(() => {
  systemMatches = false;
  listeners.clear();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: systemMatches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: (_type: string, listener: MediaListener) => { listeners.add(listener); },
      removeEventListener: (_type: string, listener: MediaListener) => { listeners.delete(listener); },
      dispatchEvent: () => true,
    }),
  });
  useSettingsStore.setState({
    accessibility: { ...DEFAULT_PREFERENCES.accessibility, reduceMotion: false },
  });
});

function emitSystemChange(matches: boolean): void {
  systemMatches = matches;
  act(() => {
    for (const listener of listeners) listener({ matches } as MediaQueryListEvent);
  });
}

describe('useReducedMotion', () => {
  it('returns false when neither the user nor the system prefers reduced motion', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when the user preference is enabled', () => {
    useSettingsStore.setState({
      accessibility: { ...useSettingsStore.getState().accessibility, reduceMotion: true },
    });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('picks up the initial system preference', () => {
    systemMatches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('reacts to system preference changes', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    emitSystemChange(true);
    expect(result.current).toBe(true);

    emitSystemChange(false);
    expect(result.current).toBe(false);
  });

  it('reacts to user preference changes while mounted', () => {
    const { result } = renderHook(() => useReducedMotion());

    act(() => {
      useSettingsStore.setState({
        accessibility: { ...useSettingsStore.getState().accessibility, reduceMotion: true },
      });
    });
    expect(result.current).toBe(true);
  });

  it('removes the media listener on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion());
    expect(listeners.size).toBe(1);

    unmount();
    expect(listeners.size).toBe(0);

    systemMatches = true;
    expect([...listeners]).toHaveLength(0);
  });
});
