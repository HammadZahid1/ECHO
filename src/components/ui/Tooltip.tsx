import type { ReactNode } from 'react';

/** Lightweight CSS tooltip for inline hints that do not require a portal. */
export function Tooltip({ label, children, side = 'top' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <span className="echo-tooltip group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-[#15181d] px-2 py-1 text-[10px] text-zinc-300 opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 ${side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
      >
        {label}
      </span>
    </span>
  );
}
