import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/controls';

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const workspaces = useGraphStore((state) => state.workspaces);
  const activeId = useGraphStore((state) => state.activeWorkspaceId);
  const switchWorkspace = useGraphStore((state) => state.switchWorkspace);
  const createWorkspace = useGraphStore((state) => state.createWorkspace);
  const openModal = useUIStore((state) => state.openModal);
  const active = workspaces.find((workspace) => workspace.id === activeId) ?? workspaces[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-7 items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-2 text-xs text-zinc-300 hover:border-white/20"
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: active?.color ?? '#4fd8e8' }} />
        <span className="max-w-[150px] truncate">{active?.name ?? 'No workspace'}</span>
        <ChevronDown size={12} className="text-zinc-600" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-40 w-64 rounded-md border border-white/10 bg-[#111418] p-1.5 shadow-2xl">
          <p className="px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-zinc-600">Knowledge universes</p>
          <div className="max-h-52 overflow-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => { switchWorkspace(workspace.id); setOpen(false); }}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${workspace.id === activeId ? 'bg-cyan-400/10 text-cyan-200' : 'text-zinc-400 hover:bg-white/[0.05]'}`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: workspace.color }} />
                <span className="flex-1 truncate">{workspace.name}</span>
                <span className="font-mono text-[10px] text-zinc-600">{workspace.graph.nodes.length}</span>
              </button>
            ))}
          </div>
          <div className="mt-1 border-t border-white/[0.07] pt-1.5">
            {creating ? (
              <form onSubmit={(event) => {
                event.preventDefault();
                if (name.trim()) { createWorkspace(name.trim()); setName(''); setCreating(false); setOpen(false); }
              }} className="flex gap-1.5">
                <TextField autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Universe name" aria-label="New universe name" />
                <Button type="submit" variant="primary" size="sm">Create</Button>
              </form>
            ) : (
              <div className="flex gap-1">
                <Button size="sm" icon={<Plus size={12} />} onClick={() => setCreating(true)} className="flex-1">New universe</Button>
                <Button size="sm" onClick={() => { openModal('workspace'); setOpen(false); }}>Manage</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
