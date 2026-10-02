/**
 * src/renderer/declarative/DeclarativeWidgetRenderer.tsx
 *
 * Root React Native renderer for declarative widget definitions.
 * Resolves size layout, handles data feeding, and coordinates action dispatching.
 */

import React from 'react';
import { View, Text, StyleSheet, Linking, ViewStyle } from 'react-native';
import {
  DeclarativeWidgetDefinition,
  WidgetDefinition,
  WidgetSize,
  Action,
  UniversalItem,
  SizeLayouts,
} from '@/widgets/schema';
import { mockUniversalItems } from '../mockData';
import { ContainerView } from './elements/ContainerView';

export interface DeclarativeWidgetRendererProps {
  /** Validated declarative widget definition */
  definition: DeclarativeWidgetDefinition | WidgetDefinition;
  /** Desired widget size (small, medium, large). Defaults to definition's defaultSize */
  size?: WidgetSize;
  /** Normalized items feed. Defaults to mock data. Never calls network APIs */
  items?: UniversalItem[];
  /** User-configured widget values */
  userConfig?: Record<string, unknown>;
  /** Action handler invoked when interactive elements are tapped */
  onAction?: (action: Action) => void;
}

export const DeclarativeWidgetRenderer = React.memo(function DeclarativeWidgetRenderer({
  definition,
  size,
  items = mockUniversalItems,
  userConfig,
  onAction,
}: DeclarativeWidgetRendererProps) {
  // Validate presence of layouts
  const layouts = definition.layouts as SizeLayouts | undefined;
  if (!layouts) {
    const widgetIdentifier =
      definition.displayName ||
      ('id' in definition ? definition.id : definition.type);
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>Invalid Widget Definition</Text>
        <Text style={styles.errorText}>
          Widget "{widgetIdentifier}" does not define any declarative layouts.
        </Text>
      </View>
    );
  }

  // Resolve requested size layout with fallback
  const targetSize: WidgetSize = size ?? definition.defaultSize ?? 'medium';
  const layoutDef =
    layouts[targetSize] ??
    layouts.medium ??
    layouts.small ??
    layouts.large;

  if (!layoutDef || !layoutDef.root) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>Layout Not Available</Text>
        <Text style={styles.errorText}>
          No layout defined for size "{targetSize}" in "{definition.displayName}".
        </Text>
      </View>
    );
  }

  // Action dispatcher
  const handleAction = (action: Action) => {
    if (onAction) {
      onAction(action);
    } else if (action.type === 'open_url' && action.url) {
      Linking.openURL(action.url).catch(() => {});
    }
  };

  const dynamicWrapperStyle: ViewStyle = {};

  if (layoutDef.backgroundColor) {
    dynamicWrapperStyle.backgroundColor = layoutDef.backgroundColor;
  }

  if (typeof layoutDef.padding === 'number') {
    dynamicWrapperStyle.padding = layoutDef.padding;
  } else if (layoutDef.padding && typeof layoutDef.padding === 'object') {
    if (layoutDef.padding.top !== undefined) dynamicWrapperStyle.paddingTop = layoutDef.padding.top;
    if (layoutDef.padding.right !== undefined) dynamicWrapperStyle.paddingRight = layoutDef.padding.right;
    if (layoutDef.padding.bottom !== undefined) dynamicWrapperStyle.paddingBottom = layoutDef.padding.bottom;
    if (layoutDef.padding.left !== undefined) dynamicWrapperStyle.paddingLeft = layoutDef.padding.left;
    if (layoutDef.padding.horizontal !== undefined) dynamicWrapperStyle.paddingHorizontal = layoutDef.padding.horizontal;
    if (layoutDef.padding.vertical !== undefined) dynamicWrapperStyle.paddingVertical = layoutDef.padding.vertical;
  }

  return (
    <View style={[styles.cardWrapper, dynamicWrapperStyle]}>
      <ContainerView
        element={layoutDef.root}
        items={items}
        userConfig={userConfig}
        onAction={handleAction}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  errorCard: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 16,
  },
});
