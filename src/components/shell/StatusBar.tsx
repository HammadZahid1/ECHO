import { Circle, Database, GitBranch } from 'lucide-react';
import { useGraphStore, useActiveWorkspace } from '@/store/graphStore';
import { useGraphStatistics } from '@/hooks/useGraphDerived';
import { useUIStore } from '@/store/uiStore';
import { formatRelativeTime } from '@/lib/utils/time';

export function StatusBar() {
  const workspace = useActiveWorkspace();
  const storageStatus = useGraphStore((state) => state.storageStatus);
  const historyLength = useGraphStore((state) => state.histories[state.activeWorkspaceId]?.entries.length ?? 0);
  const stats = useGraphStatistics(workspace.graph);
  const view = useUIStore((state) => state.view);
  const statusColor = storageStatus === 'error' ? 'text-red-400' : storageStatus === 'saved' ? 'text-emerald-400' : 'text-zinc-500';

  return (
    <footer className="flex h-6 shrink-0 items-center gap-4 border-t border-[#1b1f24] bg-[#0b0d10] px-3 text-[10px] text-zinc-600">
      <span className="flex items-center gap-1.5"><Circle size={7} className={statusColor} fill="currentColor" />Local · {storageStatus}</span>
      <span className="flex items-center gap-1.5"><Database size={10} />{stats.nodeCount} nodes · {stats.edgeCount} links</span>
      <span className="hidden items-center gap-1.5 sm:flex"><GitBranch size={10} />{stats.componentCount} clusters · {historyLength} history</span>
      <span className="ml-auto hidden uppercase tracking-[0.14em] md:block">{view}</span>
      <span className="hidden md:block">Updated {formatRelativeTime(workspace.updatedAt)}</span>
    </footer>
  );
}
