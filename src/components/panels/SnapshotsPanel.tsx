import { useState } from 'react';
import { Camera, Download, GitCompare, RotateCcw, Trash2 } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/controls';
import { EmptyState, StatTile } from '@/components/ui/states';
import { useActiveWorkspace, useGraphStore } from '@/store/graphStore';
import { useUIStore } from '@/store/uiStore';
import { exportSnapshot, DEFAULT_EXPORT_OPTIONS } from '@/lib/exporters';
import { snapshotSummary } from '@/lib/graph/snapshot';
import { downloadBlob } from '@/lib/utils/download';

export function SnapshotsPanel() {
  const workspace = useActiveWorkspace();
  const createSnapshot = useGraphStore((state) => state.createSnapshot);
  const restoreSnapshot = useGraphStore((state) => state.restoreSnapshot);
  const deleteSnapshot = useGraphStore((state) => state.deleteSnapshot);
  const compareSelection = useUIStore((state) => state.compareSelection);
  const setCompareSelection = useUIStore((state) => state.setCompareSelection);
  const openModal = useUIStore((state) => state.openModal);
  const pushToast = useUIStore((state) => state.pushToast);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (): void => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createSnapshot(trimmed, description.trim());
    if (!id) {
      pushToast({ kind: 'error', title: 'Snapshot not created', detail: 'The workspace could not be updated.' });
      return;
    }
    setName('');
    setDescription('');
    pushToast({ kind: 'success', title: `Snapshot “${trimmed}” saved` });
  };

  const handleExport = (snapshotId: string): void => {
    const snapshot = workspace.snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) return;
    const result = exportSnapshot(snapshot, DEFAULT_EXPORT_OPTIONS);
    downloadBlob(result.content, result.filename, result.mimeType);
    pushToast({ kind: 'success', title: 'Snapshot exported', detail: result.filename });
  };

  const sorted = [...workspace.snapshots].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Panel title="Snapshots" subtitle={`${workspace.snapshots.length} saved state${workspace.snapshots.length === 1 ? '' : 's'}`}>
      <div className="space-y-4 p-3">
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Snapshots" value={workspace.snapshots.length} accent="#4fd8e8" />
          <StatTile label="Selected A" value={compareSelection[0] ? '✓' : '—'} accent="#58c9a0" />
          <StatTile label="Selected B" value={compareSelection[1] ? '✓' : '—'} accent="#9d7bf5" />
        </div>

        <div className="space-y-2 rounded border border-white/[0.07] bg-white/[0.02] p-2.5">
          <TextField label="Snapshot name" value={name} placeholder="e.g. Before refactor" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleCreate(); }} />
          <TextField label="Description (optional)" value={description} placeholder="What changed?" onChange={(event) => setDescription(event.target.value)} />
          <Button variant="primary" icon={<Camera size={12} />} onClick={handleCreate} disabled={!name.trim()} className="w-full">Save snapshot</Button>
        </div>

        {compareSelection[0] && compareSelection[1] && (
          <Button variant="secondary" icon={<GitCompare size={12} />} onClick={() => openModal('compare')} className="w-full">Compare selected snapshots</Button>
        )}

        {sorted.length === 0 ? (
          <EmptyState icon={<Camera size={24} strokeWidth={1.2} />} title="No snapshots yet" description="Save a named snapshot to capture the current graph. You can restore, export or compare it later." />
        ) : (
          <div className="space-y-2">
            {sorted.map((snapshot) => {
              const selectedA = compareSelection[0] === snapshot.id;
              const selectedB = compareSelection[1] === snapshot.id;
              return (
                <div key={snapshot.id} className="rounded border border-white/[0.07] bg-white/[0.02] p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-zinc-200">{snapshot.name}</p>
                      <p className="mt-0.5 text-[9px] text-zinc-600">{new Date(snapshot.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant={selectedA ? 'primary' : 'ghost'} onClick={() => setCompareSelection(0, selectedA ? null : snapshot.id)} title="Select as comparison A">A</Button>
                      <Button size="sm" variant={selectedB ? 'primary' : 'ghost'} onClick={() => setCompareSelection(1, selectedB ? null : snapshot.id)} title="Select as comparison B">B</Button>
                    </div>
                  </div>
                  {snapshot.description && <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{snapshot.description}</p>}
                  <p className="mt-1 font-mono text-[9px] text-zinc-600">{snapshotSummary(snapshot)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button size="sm" variant="ghost" icon={<RotateCcw size={11} />} onClick={() => {
                      restoreSnapshot(snapshot.id);
                      pushToast({ kind: 'success', title: `Restored “${snapshot.name}”`, detail: 'Use undo to revert this restore.' });
                    }}>Restore</Button>
                    <Button size="sm" variant="ghost" icon={<Download size={11} />} onClick={() => handleExport(snapshot.id)}>Export</Button>
                    <Button size="sm" variant="danger" icon={<Trash2 size={11} />} onClick={() => {
                      if (selectedA) setCompareSelection(0, null);
                      if (selectedB) setCompareSelection(1, null);
                      deleteSnapshot(snapshot.id);
                      pushToast({ kind: 'info', title: `Deleted “${snapshot.name}”` });
                    }}>Delete</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}
