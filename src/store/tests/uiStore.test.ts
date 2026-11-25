import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePreferences, useUIStore } from '@/store/uiStore';
import { DEFAULT_PREFERENCES } from '@/lib/persistence/schema';
import { loadPreferences } from '@/lib/persistence/preferences';

beforeEach(() => {
  localStorage.clear();
  useUIStore.setState({
    view: DEFAULT_PREFERENCES.defaultView,
    commandPaletteOpen: false,
    searchQuery: '',
    searchOpen: false,
    modal: null,
    confirmMessage: '',
    confirmAction: null,
    contextMenu: null,
    toasts: [],
    mobileNavOpen: false,
    panelVisibility: structuredClone(DEFAULT_PREFERENCES.panels.visible),
    activeTool: 'select',
    compareSelection: [null, null],
    hoveringCommandIndex: 0,
  });
});

describe('uiStore', () => {
  it('changes the active view and search state', () => {
    useUIStore.getState().setView('cluster');
    useUIStore.getState().setSearchQuery('graph');
    useUIStore.getState().setSearchOpen(true);

    expect(useUIStore.getState()).toMatchObject({
      view: 'cluster',
      searchQuery: 'graph',
      searchOpen: true,
    });
  });

  it('toggles the command palette and dismisses any open context menu', () => {
    useUIStore.setState({ contextMenu: { x: 4, y: 8, target: 'node', targetId: 'a' } });

    useUIStore.getState().setCommandPalette(true);
    expect(useUIStore.getState()).toMatchObject({ commandPaletteOpen: true, contextMenu: null });

    useUIStore.getState().setCommandPalette(false);
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('opens modals with confirmation details and clears them on close', () => {
    const action = () => undefined;
    useUIStore.setState({ contextMenu: { x: 1, y: 2, target: 'graph' } });
    useUIStore.getState().openModal('confirm', { confirmMessage: 'Delete?', confirmAction: action });

    expect(useUIStore.getState()).toMatchObject({
      modal: 'confirm',
      confirmMessage: 'Delete?',
      confirmAction: action,
      contextMenu: null,
    });

    useUIStore.getState().closeModal();
    expect(useUIStore.getState()).toMatchObject({ modal: null, confirmMessage: '', confirmAction: null });
  });

  it('opens and closes context menus', () => {
    const menu = { x: 12, y: 24, target: 'cluster' as const, targetId: 'community-0' };
    useUIStore.setState({ commandPaletteOpen: true });

    useUIStore.getState().openContextMenu(menu);
    expect(useUIStore.getState()).toMatchObject({ contextMenu: menu, commandPaletteOpen: false });

    useUIStore.getState().closeContextMenu();
    expect(useUIStore.getState().contextMenu).toBeNull();
  });

  it('creates toasts with ids and defaults, caps the queue and supports dismissal', () => {
    const first = useUIStore.getState().pushToast({ kind: 'info', title: 'Saved' });
    const second = useUIStore.getState().pushToast({ kind: 'error', title: 'Failed', detail: 'retry', duration: 1000 });

    expect(useUIStore.getState().toasts[0]).toMatchObject({
      id: first,
      kind: 'info',
      title: 'Saved',
      duration: 4200,
    });
    expect(second).not.toBe(first);
    expect(useUIStore.getState().toasts[1]).toMatchObject({ id: second, detail: 'retry', duration: 1000 });
    expect(useUIStore.getState().toasts[1].createdAt).toBeGreaterThan(0);

    for (let index = 0; index < 6; index += 1) {
      useUIStore.getState().pushToast({ kind: 'success', title: `Toast ${index}` });
    }
    expect(useUIStore.getState().toasts).toHaveLength(5);
    expect(useUIStore.getState().toasts[0].title).toBe('Toast 1');

    useUIStore.getState().dismissToast(second);
    expect(useUIStore.getState().toasts.some((toast) => toast.id === second)).toBe(false);
  });

  it('toggles panel visibility and persists it to preferences', () => {
    useUIStore.getState().togglePanel('inspector');
    expect(useUIStore.getState().panelVisibility.inspector).toBe(false);
    expect(loadPreferences().panels.visible.inspector).toBe(false);

    useUIStore.getState().setPanelVisibility({
      ...DEFAULT_PREFERENCES.panels.visible,
      explorer: false,
      status: false,
    });
    expect(useUIStore.getState().panelVisibility).toMatchObject({ explorer: false, status: false, sidebar: true });
    expect(loadPreferences().panels.visible.status).toBe(false);
  });

  it('tracks the active tool, comparison slots and command hover index', () => {
    useUIStore.getState().setActiveTool('connect');
    useUIStore.getState().setCompareSelection(0, 'a');
    useUIStore.getState().setCompareSelection(1, 'b');
    useUIStore.getState().setHoveringCommandIndex(3);

    expect(useUIStore.getState()).toMatchObject({
      activeTool: 'connect',
      compareSelection: ['a', 'b'],
      hoveringCommandIndex: 3,
    });

    useUIStore.getState().setCompareSelection(0, null);
    expect(useUIStore.getState().compareSelection).toEqual([null, 'b']);
  });

  it('closes every overlay at once', () => {
    useUIStore.setState({
      commandPaletteOpen: true,
      modal: 'settings',
      contextMenu: { x: 0, y: 0, target: 'graph' },
      mobileNavOpen: true,
      searchOpen: true,
    });

    useUIStore.getState().closeOverlays();

    expect(useUIStore.getState()).toMatchObject({
      commandPaletteOpen: false,
      modal: null,
      contextMenu: null,
      mobileNavOpen: false,
      searchOpen: false,
    });
  });

  it('usePreferences reads the current locally stored preferences', () => {
    const updated = { ...loadPreferences(), theme: 'obsidian' as const };
    localStorage.setItem('echo.preferences.v1', JSON.stringify(updated));

    const { result } = renderHook(() => usePreferences());
    expect(result.current.theme).toBe('obsidian');
    expect(result.current.defaultView).toBe(DEFAULT_PREFERENCES.defaultView);
  });
});
