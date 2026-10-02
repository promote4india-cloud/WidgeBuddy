/**
 * app/(tabs)/_layout.tsx
 *
 * Tab navigator layout with Dashboard, Add Widget, and Settings tabs.
 */

import { Tabs } from 'expo-router';
import { useTheme } from '@/ui/theme';
import { Icon } from '@/ui/Icon';

export default function TabsLayout() {
  const { colors, typography } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          ...typography.h3,
          color: colors.text,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          ...typography.captionMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Icon name="layout-dashboard" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Widget',
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, size }) => <Icon name="plus-circle" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Icon name="settings" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
