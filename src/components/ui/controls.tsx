import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const FIELD = 'w-full rounded-[5px] border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20';

export function TextField({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</span>}
      <input className={`${FIELD} ${className}`} {...props} />
    </label>
  );
}

export function TextArea({ label, className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</span>}
      <textarea className={`${FIELD} min-h-20 resize-y leading-relaxed ${className}`} {...props} />
    </label>
  );
}

export function Select({ label, className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</span>}
      <select className={`${FIELD} appearance-none ${className}`} {...props}>{children}</select>
    </label>
  );
}

export function Slider({
  label, value, min = 0, max = 1, step = 0.01, onChange, display,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  display?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[10px] text-zinc-500">
        <span className="uppercase tracking-[0.12em]">{label}</span>
        <span className="font-mono text-zinc-400">{display ?? value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="echo-slider h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
      />
    </label>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span>
        <span className="block text-xs text-zinc-300">{label}</span>
        {hint && <span className="block text-[10px] text-zinc-600">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-4 w-7 shrink-0 rounded-full border transition-colors ${checked ? 'border-cyan-400/50 bg-cyan-400/25' : 'border-white/10 bg-white/[0.06]'}`}
      >
        <span className={`absolute top-[2px] h-2.5 w-2.5 rounded-full transition-all ${checked ? 'left-[15px] bg-cyan-300' : 'left-[2px] bg-zinc-500'}`} />
      </button>
    </label>
  );
}
