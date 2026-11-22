import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { colorForString, readableTextColor } from '@/lib/utils/color';

interface ChipProps {
  label: string;
  color?: string;
  selected?: boolean;
  count?: number;
  onSelect?: () => void;
  onRemove?: () => void;
  icon?: ReactNode;
}

export function Chip({ label, color, selected = false, count, onSelect, onRemove, icon }: ChipProps) {
  const accent = color ?? colorForString(label);
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-[4px] border px-2 text-[10px] transition-colors ${selected ? 'border-white/25 bg-white/10 text-zinc-100' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200'}`}
      style={selected ? { borderColor: `${accent}99`, color: readableTextColor('#111418') } : undefined}
    >
      {icon ?? <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />}
      <button type="button" onClick={onSelect} className="max-w-[130px] truncate" disabled={!onSelect}>{label}</button>
      {count !== undefined && <span className="font-mono text-zinc-600">{count}</span>}
      {onRemove && (
        <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="text-zinc-600 hover:text-zinc-200">
          <X size={10} />
        </button>
      )}
    </span>
  );
}
