import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import type { ToastMessage } from '@/types';

const ICONS: Record<ToastMessage['kind'], React.ReactNode> = {
  info: <Info size={14} />,
  success: <Check size={14} />,
  warning: <TriangleAlert size={14} />,
  error: <XCircle size={14} />,
};

const COLORS: Record<ToastMessage['kind'], string> = {
  info: 'text-cyan-300 border-cyan-400/25',
  success: 'text-emerald-300 border-emerald-400/25',
  warning: 'text-amber-300 border-amber-400/25',
  error: 'text-red-300 border-red-400/25',
};

function Toast({ toast }: { toast: ToastMessage }) {
  const dismiss = useUIStore((state) => state.dismissToast);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      role="status"
      className={`pointer-events-auto flex w-72 items-start gap-2.5 rounded-md border bg-[#12151a]/95 px-3 py-2.5 shadow-xl backdrop-blur ${COLORS[toast.kind]}`}
    >
      <span className="mt-0.5">{ICONS[toast.kind]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-100">{toast.title}</p>
        {toast.detail && <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{toast.detail}</p>}
      </div>
      <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)} className="text-zinc-600 hover:text-zinc-300">
        <X size={12} />
      </button>
    </motion.div>
  );
}

export function ToastHost() {
  const toasts = useUIStore((state) => state.toasts);
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex flex-col gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => <Toast key={toast.id} toast={toast} />)}
      </AnimatePresence>
    </div>
  );
}
