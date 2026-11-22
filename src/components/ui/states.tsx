import type { ReactNode } from 'react';
import { CircleAlert, LoaderCircle, SearchX } from 'lucide-react';

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="mb-1 text-zinc-700">{icon ?? <SearchX size={26} strokeWidth={1.2} />}</div>
      <p className="text-xs font-medium text-zinc-400">{title}</p>
      {description && <p className="max-w-[260px] text-[11px] leading-relaxed text-zinc-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Processing…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-8 text-[11px] text-zinc-500" role="status">
      <LoaderCircle size={14} className="animate-spin text-cyan-400" />
      {label}
    </div>
  );
}

export function ErrorState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded border border-red-500/20 bg-red-500/[0.04] p-3" role="alert">
      <div className="flex items-center gap-2 text-xs font-medium text-red-300"><CircleAlert size={14} />{title}</div>
      {description && <p className="text-[11px] leading-relaxed text-red-200/60">{description}</p>}
      {action}
    </div>
  );
}

export function StatTile({ label, value, hint, accent }: { label: string; value: string | number; hint?: string; accent?: string }) {
  return (
    <div className="border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.16em] text-zinc-600">{label}</p>
      <p className="mt-1 font-mono text-lg leading-none" style={{ color: accent ?? '#e7e9ec' }}>{value}</p>
      {hint && <p className="mt-1 text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}
