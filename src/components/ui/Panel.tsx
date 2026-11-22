import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface PanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title, subtitle, children, actions, collapsible = false, defaultCollapsed = false, className = '', bodyClassName = '',
}: PanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <section className={`echo-panel flex min-h-0 flex-col border-b border-[#1b1f24] ${className}`}>
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-[#1b1f24] px-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{title}</h2>
          {subtitle && <p className="truncate text-[10px] text-zinc-600">{subtitle}</p>}
        </div>
        {actions}
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
            aria-expanded={!collapsed}
            className="text-zinc-600 transition-colors hover:text-zinc-300"
          >
            <ChevronDown size={13} className={`transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
          </button>
        )}
      </header>
      {!collapsed && <div className={`min-h-0 flex-1 overflow-auto ${bodyClassName}`}>{children}</div>}
    </section>
  );
}
