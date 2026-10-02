/**
 * src/renderer/declarative/elements/ActionView.tsx
 *
 * Renders interactive ActionElement (buttons, links, badges).
 */

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { ActionElement, ActionElementInput, Action } from '@/widgets/schema';
import { IconView } from './IconView';

interface ActionViewProps {
  element: ActionElement | ActionElementInput;
  onAction?: (action: Action) => void;
}

export const ActionView = React.memo(function ActionView({
  element,
  onAction,
}: ActionViewProps) {
  const variant = element.variant ?? 'button';
  const styleVariant = element.style ?? 'primary';
  const isDisabled = element.disabled ?? false;

  const handlePress = () => {
    if (!isDisabled && onAction) {
      onAction(element.action);
    }
  };

  if (variant === 'link') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={styles.linkContainer}
      >
        <Text style={[styles.linkText, isDisabled && styles.disabledText]}>
          {element.label ?? 'Action'}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'badge') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.badge, styles[styleVariant], isDisabled && styles.disabled]}
      >
        {element.icon && (
          <View style={styles.iconMargin}>
            <IconView
              element={{ type: 'icon', name: element.icon, size: 'small', color: '#ffffff' }}
            />
          </View>
        )}
        {element.label && (
          <Text style={styles.badgeText}>{element.label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Default button or icon_button
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        styles[styleVariant],
        isDisabled && styles.disabled,
      ]}
    >
      {element.icon && (
        <View style={element.label ? styles.iconMargin : undefined}>
          <IconView
            element={{
              type: 'icon',
              name: element.icon,
              size: 'small',
              color: styleVariant === 'secondary' || styleVariant === 'ghost' ? '#334155' : '#ffffff',
            }}
          />
        </View>
      )}
      {element.label && (
        <Text
          style={[
            styles.buttonText,
            styleVariant === 'secondary' && styles.secondaryText,
            styleVariant === 'ghost' && styles.ghostText,
            isDisabled && styles.disabledText,
          ]}
        >
          {element.label}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  primary: {
    backgroundColor: '#2563eb',
  },
  secondary: {
    backgroundColor: '#e2e8f0',
  },
  destructive: {
    backgroundColor: '#dc2626',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryText: {
    color: '#1e293b',
  },
  ghostText: {
    color: '#e2e8f0',
  },
  disabledText: {
    color: '#94a3b8',
  },
  linkContainer: {
    paddingVertical: 2,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#38bdf8',
    textDecorationLine: 'underline',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  iconMargin: {
    marginRight: 6,
  },
});
