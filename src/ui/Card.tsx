/**
 * src/ui/Card.tsx
 *
 * A reusable card container.
 */
import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { useTheme, radius, shadows, spacing } from './theme';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
}

export function Card({ children, style, elevated = true, padded = true, ...props }: CardProps) {
  const { colors } = useTheme();
  const containerStyle: ViewStyle[] = [
    styles.container,
    { backgroundColor: colors.surface, borderColor: colors.border },
  ];

  if (elevated) {
    containerStyle.push(styles.elevated);
  }
  
  if (padded) {
    containerStyle.push(styles.padded);
  }

  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden', // to keep internal contents rounded
  },
  elevated: {
    ...shadows.sm,
  },
  padded: {
    padding: spacing.lg,
  },
});
