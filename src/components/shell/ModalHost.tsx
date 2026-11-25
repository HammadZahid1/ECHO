import { AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CommandPalette } from '@/components/panels/CommandPalette';
import { SearchPanel } from '@/components/panels/SearchPanel';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { ImportPanel } from '@/components/panels/ImportPanel';
import { ExportPanel } from '@/components/panels/ExportPanel';
import { WorkspacePanel } from '@/components/panels/WorkspacePanel';
import { SnapshotsPanel } from '@/components/panels/SnapshotsPanel';
import { ComparePanel } from '@/components/panels/ComparePanel';
import { ShortcutsPanel } from '@/components/panels/ShortcutsPanel';

type DialogKey = 'settings' | 'import' | 'export' | 'shortcuts' | 'onboarding' | 'snapshot' | 'compare' | 'workspace' | 'confirm';

const DIALOGS: Record<DialogKey, { title: string; description: string; width: string }> = {
  settings: { title: 'ECHO settings', description: 'Tune behavior, appearance, physics and accessibility. Stored on this device.', width: 'max-w-3xl' },
  import: { title: 'Import knowledge', description: 'Bring structured or unstructured knowledge into your local universe.', width: 'max-w-3xl' },
  export: { title: 'Export knowledge', description: 'Produce portable files from your local-only knowledge graph.', width: 'max-w-2xl' },
  shortcuts: { title: 'Keyboard shortcuts', description: 'Move through ECHO without leaving the keyboard.', width: 'max-w-2xl' },
  onboarding: { title: 'Welcome to ECHO', description: 'A short tour of your local knowledge universe.', width: 'max-w-xl' },
  snapshot: { title: 'Snapshots', description: 'Named local checkpoints you can restore or compare.', width: 'max-w-3xl' },
  compare: { title: 'Compare snapshots', description: 'See what changed between two local checkpoints.', width: 'max-w-4xl' },
  workspace: { title: 'Workspaces', description: 'Keep separate knowledge universes side by side on this device.', width: 'max-w-4xl' },
  confirm: { title: 'Confirm action', description: 'This action changes the current universe.', width: 'max-w-md' },
};

export function ModalHost() {
  const modal = useUIStore((state) => state.modal);
  const confirmMessage = useUIStore((state) => state.confirmMessage);
  const confirmAction = useUIStore((state) => state.confirmAction);
  const closeModal = useUIStore((state) => state.closeModal);
  const searchOpen = useUIStore((state) => state.searchOpen);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);

  const dialog = modal ? DIALOGS[modal] : null;
  const body = (() => {
    switch (modal) {
      case 'settings': return <SettingsPanel />;
      case 'import': return <ImportPanel />;
      case 'export': return <ExportPanel />;
      case 'shortcuts': return <ShortcutsPanel />;
      case 'snapshot': return <SnapshotsPanel />;
      case 'compare': return <ComparePanel />;
      case 'workspace': return <WorkspacePanel />;
      case 'confirm': return (
        <div className="flex gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-zinc-400">{confirmMessage || 'Are you sure you want to continue?'}</p>
        </div>
      );
      default: return null;
    }
  })();

  return (
    <>
      <CommandPalette />
      <Modal open={searchOpen} title="Search knowledge" description="Weighted local search across titles, descriptions, tags and relationships." width="max-w-2xl" onClose={() => setSearchOpen(false)}>
        <SearchPanel autoFocus onClose={() => setSearchOpen(false)} />
      </Modal>
      <Modal
        open={Boolean(modal && modal !== 'onboarding')}
        title={dialog?.title ?? ''}
        description={dialog?.description}
        width={dialog?.width}
        onClose={closeModal}
        footer={modal === 'confirm' ? (
          <>
            <Button onClick={closeModal}>Cancel</Button>
            <Button variant="danger" onClick={() => { confirmAction?.(); closeModal(); }}>Confirm</Button>
          </>
        ) : undefined}
      >
        {body}
      </Modal>
    </>
  );
}
