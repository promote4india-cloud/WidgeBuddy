/**
 * src/store/__tests__/themeStore.test.ts
 *
 * Unit tests for themeStore and dynamic theme resolution.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../themeStore';
import { colors, typography, darkColors, lightColors } from '@/ui/theme';

describe('themeStore & Appearance System', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useThemeStore.setState({ theme: 'light' });
  });

  it('initializes with light mode by default', () => {
    expect(useThemeStore.getState().theme).toBe('light');
    expect(colors.background).toBe(lightColors.background);
    expect(colors.surface).toBe(lightColors.surface);
    expect(colors.text).toBe(lightColors.text);
  });

  it('switches to dark mode and updates dynamic colors and typography', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    // Proxy colors should now reflect dark mode
    expect(colors.background).toBe(darkColors.background);
    expect(colors.surface).toBe(darkColors.surface);
    expect(colors.text).toBe(darkColors.text);
    expect(colors.border).toBe(darkColors.border);

    // Typography should reflect dark text color
    expect(typography.h1.color).toBe(darkColors.text);
    expect(typography.body.color).toBe(darkColors.text);
  });

  it('persists theme selection to AsyncStorage', async () => {
    useThemeStore.getState().setTheme('dark');
    const stored = await AsyncStorage.getItem('@widgebuddy/theme_mode');
    expect(stored).toBe('dark');
  });

  it('toggles between light and dark modes', () => {
    expect(useThemeStore.getState().theme).toBe('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('restores theme from AsyncStorage during initTheme', async () => {
    await AsyncStorage.setItem('@widgebuddy/theme_mode', 'dark');
    await useThemeStore.getState().initTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
