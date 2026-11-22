import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export function useReducedMotion(): boolean {
  const preference = useSettingsStore((state) => state.accessibility.reduceMotion);
  const [system, setSystem] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    setSystem(query.matches);
    const listener = (event: MediaQueryListEvent): void => setSystem(event.matches);
    query.addEventListener?.('change', listener);
    return () => query.removeEventListener?.('change', listener);
  }, []);

  return preference || system;
}
