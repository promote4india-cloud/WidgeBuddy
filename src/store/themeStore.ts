/**
 * src/store/themeStore.ts
 *
 * Zustand store for app appearance theme (light vs. dark mode).
 * Persists user preference via AsyncStorage.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = '@widgebuddy/theme_mode';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch(() => {});
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        set({ theme: saved });
      }
    } catch {
      // Ignore storage read errors on startup
    }
  },
}));
