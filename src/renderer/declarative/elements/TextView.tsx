/**
 * src/renderer/declarative/elements/TextView.tsx
 *
 * Renders declarative TextElement with typography variants, alignment, and template binding.
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity, TextStyle } from 'react-native';
import { TextElement, TextElementInput, Action } from '@/widgets/schema';
import { UniversalItem } from '@/widgets/schema';
import { resolveTemplate } from '../dataBinding';

interface TextViewProps {
  element: TextElement | TextElementInput;
  items?: UniversalItem[];
  userConfig?: Record<string, unknown>;
  onAction?: (action: Action) => void;
}

export const TextView = React.memo(function TextView({
  element,
  items,
  userConfig,
  onAction,
}: TextViewProps) {
  const content = resolveTemplate(element.content, items, userConfig);

  const dynamicStyle: TextStyle = {};
  if (element.color) dynamicStyle.color = element.color;
  if (typeof element.size === 'number') dynamicStyle.fontSize = element.size;

  const textComponent = (
    <Text
      style={[
        styles.base,
        element.variant ? styles[element.variant] : styles.body,
        element.weight ? styles[element.weight] : styles.regular,
        element.align ? styles[element.align] : styles.left,
        typeof element.size === 'string' ? styles[`size_${element.size}` as keyof typeof styles] : undefined,
        dynamicStyle,
      ]}
      numberOfLines={element.maxLines}
    >
      {content}
    </Text>
  );

  if (element.action) {
    return (
      <TouchableOpacity
        onPress={() => onAction?.(element.action!)}
        activeOpacity={0.7}
      >
        {textComponent}
      </TouchableOpacity>
    );
  }

  return textComponent;
});

const styles = StyleSheet.create({
  base: {
    color: '#0f172a',
  },
  // Variants
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 19,
    color: '#475569',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748b',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    color: '#94a3b8',
  },
  metric: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  // Weights
  light: {
    fontWeight: '300',
  },
  regular: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  semibold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
  // Alignments
  left: {
    textAlign: 'left',
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },
  // Named sizes
  size_xs: {
    fontSize: 11,
    lineHeight: 14,
  },
  size_sm: {
    fontSize: 13,
    lineHeight: 17,
  },
  size_md: {
    fontSize: 15,
    lineHeight: 20,
  },
  size_lg: {
    fontSize: 18,
    lineHeight: 24,
  },
  size_xl: {
    fontSize: 22,
    lineHeight: 28,
  },
  size_2xl: {
    fontSize: 28,
    lineHeight: 34,
  },
});
