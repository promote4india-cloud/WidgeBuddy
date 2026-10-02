/**
 * src/renderer/declarative/elements/DividerView.tsx
 *
 * Renders declarative DividerElement in horizontal or vertical orientation.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { DividerElement, DividerElementInput } from '@/widgets/schema';

interface DividerViewProps {
  element: DividerElement | DividerElementInput;
}

export const DividerView = React.memo(function DividerView({
  element,
}: DividerViewProps) {
  const isHorizontal = element.orientation !== 'vertical';
  const thickness = element.thickness ?? 1;
  const color = element.color ?? '#e5e7eb';
  const spacing = element.spacing ?? 8;

  const dynamicStyle: ViewStyle = isHorizontal
    ? {
        height: thickness,
        backgroundColor: color,
        marginVertical: spacing,
      }
    : {
        width: thickness,
        backgroundColor: color,
        marginHorizontal: spacing,
      };

  return (
    <View
      style={[
        isHorizontal ? styles.horizontal : styles.vertical,
        dynamicStyle,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
    alignSelf: 'stretch',
  },
});
