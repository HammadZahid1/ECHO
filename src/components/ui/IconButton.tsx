import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  active?: boolean;
  size?: 'sm' | 'md';
}

export function IconButton({ label, children, active = false, size = 'md', className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-grid place-items-center rounded-[5px] border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/70 disabled:opacity-35 ${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'} ${active ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200' : 'border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-200'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
