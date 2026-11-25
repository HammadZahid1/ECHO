import { useRef, useState } from 'react';
import { Check, Copy, Download, Folder, Pencil, Sparkles, Trash2, Upload } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { TextField } from '@/components/ui/controls';
import { ErrorState } from '@/components/ui/states';
import { useGraphStore, useActiveWorkspace } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { DEMO_DATASETS } from '@/data/demo';
import { exportWorkspace, DEFAULT_EXPORT_OPTIONS } from '@/lib/exporters';
import { importContent } from '@/lib/importers';
import { normalizeGraph } from '@/lib/graph/validate';
import { downloadBlob, readFileAsText } from '@/lib/utils/download';
import type { GraphBundle, GraphData } from '@/types';

function isGraphData(value: unknown): value is GraphData {
  if (!value || typeof value !== 'object') return false;
  const graph = value as Partial<GraphData>;
  return Array.isArray(graph.nodes) && Array.isArray(graph.edges) && Array.isArray(graph.tags);
}

export function WorkspacePanel() {
  const workspaces = useGraphStore((state) => state.workspaces);
  const activeId = useGraphStore((state) => state.activeWorkspaceId);
  const createWorkspace = useGraphStore((state) => state.createWorkspace);
  const deleteWorkspace = useGraphStore((state) => state.deleteWorkspace);
  const switchWorkspace = useGraphStore((state) => state.switchWorkspace);
  const renameWorkspace = useGraphStore((state) => state.renameWorkspace);
  const duplicateWorkspace = useGraphStore((state) => state.duplicateWorkspace);
  const replaceActiveGraph = useGraphStore((state) => state.replaceActiveGraph);
  const loadDemo = useGraphStore((state) => state.loadDemo);
  const active = useActiveWorkspace();
  const openModal = useUIStore((state) => state.openModal);
  const pushToast = useUIStore((state) => state.pushToast);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [importError, setImportError] = useState('');

  const handleCreate = (): void => {
    const name = newName.trim();
    if (!name) return;
    createWorkspace(name);
    setNewName('');
    pushToast({ kind: 'success', title: `Workspace “${name}” created` });
  };

  const handleDelete = (id: string, name: string): void => {
    if (workspaces.length <= 1) {
      pushToast({ kind: 'warning', title: 'Cannot delete the last workspace' });
      return;
    }
    openModal('confirm', {
      confirmMessage: `Delete workspace “${name}” and its local copy? This cannot be undone.`,
      confirmAction: () => {
        deleteWorkspace(id);
        pushToast({ kind: 'info', title: `Deleted “${name}”` });
      },
    });
  };

  const handleDemo = (id: string, name: string): void => {
    openModal('confirm', {
      confirmMessage: `Replace the current graph with the “${name}” demo universe? You can undo this action.`,
      confirmAction: () => {
        loadDemo(id);
        pushToast({ kind: 'success', title: `${name} loaded`, detail: 'Use undo to restore the previous graph.' });
      },
    });
  };

  const handleExport = (): void => {
    const result = exportWorkspace(active, DEFAULT_EXPORT_OPTIONS);
    downloadBlob(result.content, result.filename, result.mimeType);
    pushToast({ kind: 'success', title: 'Workspace exported', detail: result.filename });
  };

  const handleImportFile = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setImportError('');
    try {
      const text = await readFileAsText(file);
      let graph: GraphData | null = null;
      let rawGraph: unknown = null;
      let name = file.name.replace(/\.json$/i, '');
      try {
        const parsed = JSON.parse(text) as GraphBundle & { nodes?: unknown[] };
        if (parsed.format === 'echo-workspace' && parsed.workspace?.graph && isGraphData(parsed.workspace.graph)) {
          rawGraph = parsed.workspace.graph;
          name = parsed.workspace.name ?? name;
        } else if (parsed.format === 'echo-snapshot' && parsed.snapshot?.graph && isGraphData(parsed.snapshot.graph)) {
          rawGraph = parsed.snapshot.graph;
          name = parsed.snapshot.name ?? name;
        } else if (isGraphData(parsed)) {
          rawGraph = parsed;
        }
      } catch {
        rawGraph = null;
      }
      if (rawGraph) graph = normalizeGraph(rawGraph).graph;
      if (!graph) {
        const result = importContent(text, file.name);
        if (!result.ok) {
          setImportError(result.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message).join(' · ') || 'The file does not contain a valid graph.');
          return;
        }
        graph = result.graph;
      }
      createWorkspace(`${name} (imported)`);
      replaceActiveGraph(graph, `Import ${file.name}`);
      pushToast({ kind: 'success', title: `Imported “${name}”`, detail: `${graph.nodes.length} nodes · ${graph.edges.length} relationships` });
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : 'Unable to import this file.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Panel title="Workspaces" subtitle={`${workspaces.length} local universe${workspaces.length === 1 ? '' : 's'}`}>
      <div className="space-y-4 p-3">
        <div className="flex gap-2">
          <TextField value={newName} placeholder="New workspace name" aria-label="New workspace name" onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleCreate(); }} />
          <Button variant="primary" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
        </div>

        <div className="space-y-1.5">
          {workspaces.map((workspace) => {
            const activeWorkspace = workspace.id === activeId;
            const renaming = renamingId === workspace.id;
            return (
              <div key={workspace.id} className={`rounded border p-2.5 ${activeWorkspace ? 'border-cyan-400/30 bg-cyan-400/[0.05]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                {renaming ? (
                  <div className="flex gap-1.5">
                    <TextField
                      value={renameValue}
                      aria-label="Workspace name"
                      onChange={(event) => setRenameValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && renameValue.trim()) {
                          renameWorkspace(workspace.id, renameValue.trim());
                          setRenamingId(null);
                        }
                        if (event.key === 'Escape') setRenamingId(null);
                      }}
                    />
                    <Button size="sm" variant="primary" icon={<Check size={11} />} disabled={!renameValue.trim()} onClick={() => { renameWorkspace(workspace.id, renameValue.trim()); setRenamingId(null); }} />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: workspace.color }} />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-200">{workspace.name}</span>
                      {activeWorkspace && <span className="rounded border border-cyan-400/30 px-1 py-0.5 text-[8px] uppercase tracking-wider text-cyan-300">Active</span>}
                    </div>
                    <p className="mt-1 pl-4 font-mono text-[9px] text-zinc-600">{workspace.graph.nodes.length} nodes · {workspace.graph.edges.length} relationships</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {!activeWorkspace && <Button size="sm" variant="ghost" icon={<Folder size={11} />} onClick={() => switchWorkspace(workspace.id)}>Switch</Button>}
                      <Button size="sm" variant="ghost" icon={<Pencil size={11} />} onClick={() => { setRenamingId(workspace.id); setRenameValue(workspace.name); }}>Rename</Button>
                      <Button size="sm" variant="ghost" icon={<Copy size={11} />} onClick={() => { duplicateWorkspace(workspace.id); pushToast({ kind: 'success', title: 'Workspace duplicated' }); }}>Duplicate</Button>
                      <Button size="sm" variant="danger" icon={<Trash2 size={11} />} onClick={() => handleDelete(workspace.id, workspace.name)} disabled={workspaces.length <= 1}>Delete</Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <Divider label="Demo universes" />
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {DEMO_DATASETS.map((demo) => (
            <button
              key={demo.id}
              type="button"
              title={demo.description}
              onClick={() => handleDemo(demo.id, demo.name)}
              className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-left hover:border-white/20"
            >
              <Sparkles size={11} style={{ color: demo.accent }} />
              <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-400">{demo.name}</span>
              <span className="font-mono text-[9px] text-zinc-700">{demo.topics.length}</span>
            </button>
          ))}
        </div>

        <Divider label="Backup & restore" />
        {importError && <ErrorState title="Import failed" description={importError} />}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Download size={12} />} onClick={handleExport}>Export workspace JSON</Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => void handleImportFile(event.target.files?.[0])} />
          <Button variant="secondary" icon={<Upload size={12} />} onClick={() => fileRef.current?.click()}>Import workspace JSON</Button>
        </div>
        <p className="text-[9px] leading-relaxed text-zinc-700">Workspace backups include the graph, settings, collections and snapshots. Imports create a new workspace and can be undone.</p>
      </div>
    </Panel>
  );
}
