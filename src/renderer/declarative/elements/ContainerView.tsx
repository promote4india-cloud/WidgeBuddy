/**
 * src/renderer/declarative/elements/ContainerView.tsx
 *
 * Renders recursive declarative ContainerElement with flexbox layouts, padding, and borders.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ContainerElement, ContainerElementInput, Action, UniversalItem } from '@/widgets/schema';
import { ElementRenderer } from '../ElementRenderer';

interface ContainerViewProps {
  element: ContainerElement | ContainerElementInput;
  items?: UniversalItem[];
  userConfig?: Record<string, unknown>;
  onAction?: (action: Action) => void;
}

export const ContainerView = React.memo(function ContainerView({
  element,
  items,
  userConfig,
  onAction,
}: ContainerViewProps) {
  const isRow = element.direction === 'row';
  const isStack = element.direction === 'stack';

  // Compute alignments based on direction
  const hAlign = element.alignment?.horizontal;
  const vAlign = element.alignment?.vertical;

  const mapAlign = (align?: string) => {
    switch (align) {
      case 'left':
      case 'top':
        return 'flex-start';
      case 'center':
        return 'center';
      case 'right':
      case 'bottom':
        return 'flex-end';
      case 'stretch':
        return 'stretch';
      case 'space-between':
        return 'space-between';
      case 'space-around':
        return 'space-around';
      default:
        return undefined;
    }
  };

  const dynamicStyle: ViewStyle = {};

  if (isRow) {
    dynamicStyle.flexDirection = 'row';
    if (hAlign) dynamicStyle.justifyContent = mapAlign(hAlign) as ViewStyle['justifyContent'];
    if (vAlign) dynamicStyle.alignItems = mapAlign(vAlign) as ViewStyle['alignItems'];
  } else if (isStack) {
    // Stack layout (overlays)
    dynamicStyle.position = 'relative';
  } else {
    // Default column
    dynamicStyle.flexDirection = 'column';
    if (vAlign) dynamicStyle.justifyContent = mapAlign(vAlign) as ViewStyle['justifyContent'];
    if (hAlign) dynamicStyle.alignItems = mapAlign(hAlign) as ViewStyle['alignItems'];
  }

  if (element.gap !== undefined) {
    dynamicStyle.gap = element.gap;
  }

  if (element.flex !== undefined) {
    dynamicStyle.flex = element.flex;
  }

  if (element.backgroundColor) {
    dynamicStyle.backgroundColor = element.backgroundColor;
  }

  if (element.borderRadius !== undefined) {
    dynamicStyle.borderRadius = element.borderRadius;
  }

  if (element.border) {
    dynamicStyle.borderWidth = element.border.width;
    dynamicStyle.borderColor = element.border.color;
  }

  // Padding resolution
  if (typeof element.padding === 'number') {
    dynamicStyle.padding = element.padding;
  } else if (element.padding && typeof element.padding === 'object') {
    if (element.padding.top !== undefined) dynamicStyle.paddingTop = element.padding.top;
    if (element.padding.right !== undefined) dynamicStyle.paddingRight = element.padding.right;
    if (element.padding.bottom !== undefined) dynamicStyle.paddingBottom = element.padding.bottom;
    if (element.padding.left !== undefined) dynamicStyle.paddingLeft = element.padding.left;
    if (element.padding.horizontal !== undefined) dynamicStyle.paddingHorizontal = element.padding.horizontal;
    if (element.padding.vertical !== undefined) dynamicStyle.paddingVertical = element.padding.vertical;
  }

  const handlePress = () => {
    if (element.action && onAction) {
      onAction(element.action);
    }
  };

  const childrenContent = (element.children ?? []).map((child, idx) => (
    <ElementRenderer
      key={child.id ?? idx}
      element={child}
      items={items}
      userConfig={userConfig}
      onAction={onAction}
    />
  ));

  if (element.action) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.base, dynamicStyle]}
      >
        {childrenContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, dynamicStyle]}>
      {childrenContent}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    // base layout defaults
  },
});
