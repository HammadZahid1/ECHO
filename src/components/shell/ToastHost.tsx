import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastMessage } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { IconButton } from '@/components/ui/IconButton';

const ICONS: Record<ToastMessage['kind'], React.ReactNode> = {
  info: <Info size={14} className="text-cyan-300" />,
  success: <CheckCircle2 size={14} className="text-emerald-400" />,
  warning: <AlertCircle size={14} className="text-amber-400" />,
  error: <XCircle size={14} className="text-red-400" />,
};

export function ToastHost() {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => dismissToast(toast.id), toast.duration));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-9 right-3 z-[70] flex w-[min(320px,calc(100vw-24px))] flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} role="status" className="echo-toast pointer-events-auto flex items-start gap-2 rounded-md border border-white/10 bg-[#12161b]/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur">
          <span className="mt-0.5">{ICONS[toast.kind]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-zinc-200">{toast.title}</p>
            {toast.detail && <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">{toast.detail}</p>}
          </div>
          <IconButton label="Dismiss notification" size="sm" onClick={() => dismissToast(toast.id)}><X size={12} /></IconButton>
        </div>
      ))}
    </div>
  );
}
