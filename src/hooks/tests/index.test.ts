import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, renderHook } from '@testing-library/react';
import * as hooks from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDerivedGraph } from '@/hooks/useGraphDerived';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DEFAULT_PREFERENCES } from '@/lib/persistence/schema';
import { createWorkspace } from '@/lib/graph/factory';
import { useGraphStore } from '@/store/graphStore';
import { useSettingsStore } from '@/store/settingsStore';

vi.mock('@/lib/persistence/repository', () => ({
  createDebouncedSaver: () => () => undefined,
  loadWorkspaces: async () => ({ workspaces: [], issues: [], available: false }),
  saveWorkspace: async () => undefined,
  deleteWorkspace: async () => undefined,
}));

beforeEach(() => {
  vi.useFakeTimers();
  const workspace = createWorkspace({ id: 'ws-hooks-index' });
  useGraphStore.setState({
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    histories: { [workspace.id]: { entries: [], cursor: -1, limit: 120 } },
    selectedNodeIds: [],
    filters: {},
  });
  useSettingsStore.setState({
    accessibility: { ...DEFAULT_PREFERENCES.accessibility, reduceMotion: false },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('hooks barrel exports', () => {
  it('exports all four public hooks as functions', () => {
    expect(typeof hooks.useDebouncedValue).toBe('function');
    expect(typeof hooks.useDerivedGraph).toBe('function');
    expect(typeof hooks.useKeyboardShortcuts).toBe('function');
    expect(typeof hooks.useReducedMotion).toBe('function');
  });

  it('re-exports the exact implementations from their modules', () => {
    expect(hooks.useDebouncedValue).toBe(useDebouncedValue);
    expect(hooks.useDerivedGraph).toBe(useDerivedGraph);
    expect(hooks.useKeyboardShortcuts).toBe(useKeyboardShortcuts);
    expect(hooks.useReducedMotion).toBe(useReducedMotion);
  });

  it('re-exported useDerivedGraph reads an empty active workspace', () => {
    const { result } = renderHook(() => hooks.useDerivedGraph());

    expect(result.current.graph.nodes).toEqual([]);
    expect(result.current.statistics.nodeCount).toBe(0);
  });

  it('re-exported useReducedMotion reflects the settings store', () => {
    const { result } = renderHook(() => hooks.useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      useSettingsStore.setState({
        accessibility: { ...useSettingsStore.getState().accessibility, reduceMotion: true },
      });
    });
    expect(result.current).toBe(true);
  });

  it('re-exported useKeyboardShortcuts registers window shortcuts', () => {
    const { unmount } = renderHook(() => hooks.useKeyboardShortcuts());

    fireEvent.keyDown(window, { key: 'n' });
    const state = useGraphStore.getState();
    const graph = state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId)!.graph;
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].title).toBe('New concept');

    unmount();
  });
});
