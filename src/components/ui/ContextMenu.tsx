import { useEffect, useRef } from 'react';
import type { ContextMenuState } from '@/types';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  state: ContextMenuState;
  items: MenuItem[];
  onClose: () => void;
  title?: string;
}

export function ContextMenu({ state, items, onClose, title }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handlePointer = (event: MouseEvent): void => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);

  const x = Math.min(state.x, window.innerWidth - 220);
  const y = Math.min(state.y, window.innerHeight - items.length * 34 - 40);
  return (
    <div
      ref={ref}
      role="menu"
      aria-label={title ?? 'Context menu'}
      style={{ left: Math.max(0, x), top: Math.max(0, y) }}
      className="fixed z-[60] min-w-[196px] rounded-md border border-white/10 bg-[#111418]/95 p-1 shadow-[0_16px_50px_rgba(0,0,0,0.65)] backdrop-blur-md"
    >
      {title && <div className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-600">{title}</div>}
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            onClose();
          }}
          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors disabled:opacity-35 ${item.danger ? 'text-red-300 hover:bg-red-500/10' : 'text-zinc-300 hover:bg-white/[0.07] hover:text-zinc-100'}`}
        >
          <span className="grid w-4 place-items-center text-zinc-500">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.shortcut && <span className="text-[10px] text-zinc-600">{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );
}
