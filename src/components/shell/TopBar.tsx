import { Activity, Boxes, Command, Download, Network, Redo2, Search, Undo2, Upload } from 'lucide-react';
import type { ViewMode } from '@/types';
import { VIEW_LABELS } from '@/lib/graph/registry';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { IconButton } from '@/components/ui/IconButton';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

const VIEWS: ViewMode[] = ['universe', 'graph-2d', 'radial', 'hierarchical', 'cluster', 'timeline', 'table', 'network'];

export function TopBar() {
  const view = useUIStore((state) => state.view);
  const setView = useUIStore((state) => state.setView);
  const setCommandPalette = useUIStore((state) => state.setCommandPalette);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const openModal = useUIStore((state) => state.openModal);
  const undo = useGraphStore((state) => state.undo);
  const redo = useGraphStore((state) => state.redo);
  const canUndo = useGraphStore((state) => state.canUndo());
  const canRedo = useGraphStore((state) => state.canRedo());

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[#1b1f24] bg-[#0b0d10] px-3">
      <div className="flex items-center gap-2.5 pr-2">
        <div className="relative grid h-7 w-7 place-items-center">
          <div className="absolute inset-0 rotate-45 border border-cyan-400/40" />
          <div className="absolute inset-[5px] rotate-45 border border-violet-400/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#4fd8e8]" />
        </div>
        <span className="text-[13px] font-semibold tracking-[0.32em] text-zinc-200">ECHO</span>
      </div>

      <WorkspaceSwitcher />

      <nav aria-label="Visualization modes" className="ml-1 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
        {VIEWS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setView(item)}
            aria-current={view === item ? 'page' : undefined}
            className={`h-7 shrink-0 rounded px-2 text-[10px] transition-colors ${view === item ? 'bg-white/[0.08] text-cyan-200' : 'text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300'}`}
          >
            {VIEW_LABELS[item]}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Search knowledge" onClick={() => setSearchOpen(true)}><Search size={14} /></IconButton>
        <IconButton label="Command palette (Ctrl+K)" onClick={() => setCommandPalette(true)}><Command size={14} /></IconButton>
        <span className="mx-1 h-4 w-px bg-white/10" />
        <IconButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}><Undo2 size={14} /></IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}><Redo2 size={14} /></IconButton>
        <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
        <IconButton label="Import knowledge" onClick={() => openModal('import')} className="hidden sm:inline-grid"><Upload size={14} /></IconButton>
        <IconButton label="Export knowledge" onClick={() => openModal('export')} className="hidden sm:inline-grid"><Download size={14} /></IconButton>
        <IconButton label="Graph health" onClick={() => setView('network')} className="hidden md:inline-grid"><Activity size={14} /></IconButton>
        <IconButton label="Analytics" onClick={() => setView('timeline')} className="hidden md:inline-grid"><Boxes size={14} /></IconButton>
        <IconButton label="Network overview" onClick={() => setView('network')} className="hidden md:inline-grid"><Network size={14} /></IconButton>
      </div>
    </header>
  );
}
