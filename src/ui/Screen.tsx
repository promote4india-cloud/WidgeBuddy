/**
 * src/ui/Screen.tsx
 *
 * Safe area screen container.
 */
import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './theme';

export interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
}

export function Screen({ children, style, scrollable, contentContainerStyle, ...props }: ScreenProps) {
  const { colors } = useTheme();
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <Container
        style={[
          styles.container,
          { backgroundColor: colors.background },
          !scrollable ? contentContainerStyle : undefined,
          style,
        ]}
        contentContainerStyle={scrollable ? contentContainerStyle : undefined}
        keyboardShouldPersistTaps={scrollable ? 'handled' : undefined}
        {...props}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
