import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  width?: string;
  footer?: ReactNode;
}

export function Modal({ open, title, description, children, onClose, width = 'max-w-lg', footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`echo-modal flex max-h-[88vh] w-full ${width} flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0e1013] shadow-[0_24px_80px_rgba(0,0,0,0.7)] outline-none`}
      >
        <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="flex-1">
            <h2 className="text-sm font-medium tracking-wide text-zinc-100">{title}</h2>
            {description && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>}
          </div>
          <IconButton label="Close dialog" onClick={onClose} size="sm"><X size={14} /></IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-white/[0.07] px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
