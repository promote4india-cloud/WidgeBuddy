/**
 * src/ui/StateViews.tsx
 *
 * Reusable components for loading, empty, and error states.
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon, IconName } from './Icon';
import { Button } from './Button';
import { colors, spacing, typography } from './theme';

interface BaseStateProps {
  title: string;
  description?: string;
  icon?: IconName;
}

interface ErrorStateProps extends BaseStateProps {
  onRetry?: () => void;
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, description, icon = 'inbox' }: BaseStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

export function ErrorState({ title, description, icon = 'alert-circle', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, styles.errorIconContainer]}>
        <Icon name={icon} size={32} color={colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {onRetry && (
        <Button 
          label="Try Again" 
          variant="outline" 
          onPress={onRetry} 
          style={styles.retryButton} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorIconContainer: {
    backgroundColor: '#fee2e2', // red-100
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.xl,
  },
});
