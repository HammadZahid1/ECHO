import { create } from 'zustand';
import type { ContextMenuState, PanelId, ToastMessage, ViewMode } from '@/types';
import { createId } from '@/lib/utils/id';
import { loadPreferences, savePreferences } from '@/lib/persistence/preferences';
import type { PreferenceSettings } from '@/types';

type ModalId = 'settings' | 'import' | 'export' | 'shortcuts' | 'onboarding' | 'snapshot' | 'compare' | 'workspace' | 'confirm' | null;

interface UIState {
  view: ViewMode;
  commandPaletteOpen: boolean;
  searchQuery: string;
  searchOpen: boolean;
  modal: ModalId;
  confirmMessage: string;
  confirmAction: (() => void) | null;
  contextMenu: ContextMenuState | null;
  toasts: ToastMessage[];
  mobileNavOpen: boolean;
  panelVisibility: Record<PanelId, boolean>;
  activeTool: 'select' | 'connect' | 'pan' | 'create';
  compareSelection: [string | null, string | null];
  hoveringCommandIndex: number;
  setView: (view: ViewMode) => void;
  setCommandPalette: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  openModal: (modal: Exclude<ModalId, null>, options?: { confirmMessage?: string; confirmAction?: () => void }) => void;
  closeModal: () => void;
  openContextMenu: (menu: ContextMenuState) => void;
  closeContextMenu: () => void;
  pushToast: (toast: Omit<ToastMessage, 'id' | 'createdAt' | 'duration'> & { duration?: number }) => string;
  dismissToast: (id: string) => void;
  setMobileNav: (open: boolean) => void;
  togglePanel: (panel: PanelId) => void;
  setPanelVisibility: (visibility: Record<PanelId, boolean>) => void;
  setActiveTool: (tool: UIState['activeTool']) => void;
  setCompareSelection: (index: 0 | 1, id: string | null) => void;
  setHoveringCommandIndex: (index: number) => void;
  closeOverlays: () => void;
}

const initialPreferences = loadPreferences();

export const useUIStore = create<UIState>()((set, get) => ({
  view: initialPreferences.defaultView,
  commandPaletteOpen: false,
  searchQuery: '',
  searchOpen: false,
  modal: null,
  confirmMessage: '',
  confirmAction: null,
  contextMenu: null,
  toasts: [],
  mobileNavOpen: false,
  panelVisibility: initialPreferences.panels.visible,
  activeTool: 'select',
  compareSelection: [null, null],
  hoveringCommandIndex: 0,

  setView: (view) => set({ view }),
  setCommandPalette: (open) => set({ commandPaletteOpen: open, contextMenu: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  openModal: (modal, options) => set({
    modal,
    confirmMessage: options?.confirmMessage ?? '',
    confirmAction: options?.confirmAction ?? null,
    contextMenu: null,
  }),
  closeModal: () => set({ modal: null, confirmAction: null, confirmMessage: '' }),
  openContextMenu: (menu) => set({ contextMenu: menu, commandPaletteOpen: false }),
  closeContextMenu: () => set({ contextMenu: null }),
  pushToast: (toast) => {
    const id = createId('toast');
    const message: ToastMessage = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? 4200,
    };
    set((state) => ({ toasts: [...state.toasts.slice(-4), message] }));
    return id;
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  setMobileNav: (open) => set({ mobileNavOpen: open }),
  togglePanel: (panel) => {
    const visibility = { ...get().panelVisibility, [panel]: !get().panelVisibility[panel] };
    set({ panelVisibility: visibility });
    savePreferences({ ...loadPreferences(), panels: { ...loadPreferences().panels, visible: visibility } });
  },
  setPanelVisibility: (visibility) => {
    set({ panelVisibility: visibility });
    savePreferences({ ...loadPreferences(), panels: { ...loadPreferences().panels, visible: visibility } });
  },
  setActiveTool: (tool) => set({ activeTool: tool }),
  setCompareSelection: (index, id) => set((state) => {
    const selection: [string | null, string | null] = [...state.compareSelection];
    selection[index] = id;
    return { compareSelection: selection };
  }),
  setHoveringCommandIndex: (index) => set({ hoveringCommandIndex: index }),
  closeOverlays: () => set({
    commandPaletteOpen: false,
    modal: null,
    contextMenu: null,
    mobileNavOpen: false,
    searchOpen: false,
  }),
}));

export function usePreferences(): PreferenceSettings {
  return loadPreferences();
}
