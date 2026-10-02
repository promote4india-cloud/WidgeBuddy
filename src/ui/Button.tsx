/**
 * src/ui/Button.tsx
 *
 * Configurable button component with multiple variants.
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, radius, spacing, typography } from './theme';
import { Icon, IconName } from './Icon';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  icon,
  loading,
  fullWidth,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.container };
    
    if (fullWidth) base.width = '100%';

    if (isPrimary) {
      base.backgroundColor = colors.primary;
    } else if (isSecondary) {
      base.backgroundColor = colors.primaryBackground;
    } else if (isOutline) {
      base.backgroundColor = 'transparent';
      base.borderWidth = 1;
      base.borderColor = colors.border;
    } else if (isGhost) {
      base.backgroundColor = 'transparent';
    }

    if (isDisabled) {
      base.opacity = 0.5;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = { ...styles.text };

    if (isPrimary) {
      base.color = colors.textInverted;
    } else if (isSecondary) {
      base.color = colors.primary;
    } else if (isOutline || isGhost) {
      base.color = colors.text;
    }

    return base;
  };

  const getIconColor = () => {
    if (isPrimary) return colors.textInverted;
    if (isSecondary) return colors.primary;
    return colors.text;
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getIconColor()} style={styles.iconSpacing} />
      ) : icon ? (
        <Icon name={icon} size={18} color={getIconColor()} />
      ) : null}
      
      <Text style={getTextStyle()}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minHeight: 48,
  },
  text: {
    ...typography.bodyMedium,
    marginLeft: spacing.sm,
  },
  iconSpacing: {
    marginRight: spacing.sm,
  },
});
