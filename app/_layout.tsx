import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { queryClient } from '@/services/queryClient';
import { useThemeStore } from '@/store/themeStore';

export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}

