import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-cyan-400/15 text-cyan-200 border-cyan-400/35 hover:bg-cyan-400/25 hover:border-cyan-300/60',
  secondary: 'bg-white/[0.03] text-zinc-300 border-white/10 hover:bg-white/[0.07] hover:border-white/20',
  ghost: 'bg-transparent text-zinc-400 border-transparent hover:bg-white/[0.05] hover:text-zinc-100',
  danger: 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20',
};

export function Button({
  variant = 'secondary', size = 'md', icon, className = '', children, ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`echo-button inline-flex items-center justify-center gap-2 rounded-[5px] border font-medium tracking-[0.01em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/70 ${VARIANTS[variant]} ${size === 'sm' ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3 text-xs'} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
