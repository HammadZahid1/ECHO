import type { PreferenceSettings } from '@/types';
import { DEFAULT_PREFERENCES } from './schema';
import { migratePreferences } from './migrate';

const PREFERENCES_KEY = 'echo.preferences.v1';

export function loadPreferences(): PreferenceSettings {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return migratePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: PreferenceSettings): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Storage may be disabled or full; preferences degrade gracefully.
  }
}

export function clearPreferences(): void {
  try {
    localStorage.removeItem(PREFERENCES_KEY);
  } catch {
    // Ignore storage errors.
  }
}
