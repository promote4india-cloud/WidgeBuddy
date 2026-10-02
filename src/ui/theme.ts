/**
 * src/ui/theme.ts
 *
 * Core design tokens for WidgeBuddy with dynamic Light & Dark mode support.
 * Modern, minimal, and premium aesthetic.
 */

import { useThemeStore, ThemeMode } from '@/store/themeStore';

export interface ThemeColors {
  // Brand
  primary: string;
  primaryHover: string;
  primaryBackground: string;

  // Backgrounds
  background: string;
  surface: string;
  surfaceHover: string;

  // Borders
  border: string;
  borderFocus: string;

  // Text
  text: string;
  textMuted: string;
  textInverted: string;

  // Status
  success: string;
  error: string;
  warning: string;
  info: string;
}

export const lightColors: ThemeColors = {
  // Brand
  primary: '#6366f1', // Indigo 500
  primaryHover: '#4f46e5', // Indigo 600
  primaryBackground: '#e0e7ff', // Indigo 100

  // Backgrounds
  background: '#f8fafc', // Slate 50
  surface: '#ffffff', // White
  surfaceHover: '#f1f5f9', // Slate 100

  // Borders
  border: '#e2e8f0', // Slate 200
  borderFocus: '#6366f1', // Indigo 500

  // Text
  text: '#0f172a', // Slate 900
  textMuted: '#64748b', // Slate 500
  textInverted: '#ffffff', // White

  // Status
  success: '#10b981', // Emerald 500
  error: '#ef4444', // Red 500
  warning: '#f59e0b', // Amber 500
  info: '#3b82f6', // Blue 500
};

export const darkColors: ThemeColors = {
  // Brand
  primary: '#818cf8', // Indigo 400
  primaryHover: '#6366f1', // Indigo 500
  primaryBackground: '#1e1b4b', // Deep Indigo tint

  // Backgrounds
  background: '#090d16', // Deep Obsidian
  surface: '#131b2e', // Navy-Slate surface
  surfaceHover: '#1e293b', // Slate 800

  // Borders
  border: '#1e293b', // Slate 800
  borderFocus: '#818cf8', // Indigo 400

  // Text
  text: '#f8fafc', // Slate 50
  textMuted: '#94a3b8', // Slate 400
  textInverted: '#090d16', // Dark

  // Status
  success: '#34d399', // Emerald 400
  error: '#f87171', // Red 400
  warning: '#fbbf24', // Amber 400
  info: '#60a5fa', // Blue 400
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export function getTypography(c: ThemeColors) {
  return {
    h1: { fontSize: 28, fontWeight: '700' as const, color: c.text, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '600' as const, color: c.text, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' as const, color: c.text },
    body: { fontSize: 15, fontWeight: '400' as const, color: c.text, lineHeight: 22 },
    bodyMedium: { fontSize: 15, fontWeight: '500' as const, color: c.text, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: '400' as const, color: c.textMuted },
    captionMedium: { fontSize: 13, fontWeight: '500' as const, color: c.textMuted },
  };
}

export type TypographyStyles = ReturnType<typeof getTypography>;

/**
 * Dynamic Proxy providing instantaneous active color lookup
 */
export const colors: ThemeColors = new Proxy({} as ThemeColors, {
  get(_target, prop: string) {
    const isDark = useThemeStore.getState().theme === 'dark';
    const palette = isDark ? darkColors : lightColors;
    return palette[prop as keyof ThemeColors];
  },
});

/**
 * Dynamic Proxy providing instantaneous active typography styles
 */
export const typography: TypographyStyles = new Proxy({} as TypographyStyles, {
  get(_target, prop: string) {
    const isDark = useThemeStore.getState().theme === 'dark';
    const palette = isDark ? darkColors : lightColors;
    const typo = getTypography(palette);
    return typo[prop as keyof TypographyStyles];
  },
});

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
};

/**
 * React hook for components needing real-time reactive re-rendering on theme changes.
 */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';
  const activeColors = isDark ? darkColors : lightColors;
  const activeTypography = getTypography(activeColors);

  return {
    theme,
    isDark,
    colors: activeColors,
    typography: activeTypography,
    setTheme,
    toggleTheme,
  };
}
