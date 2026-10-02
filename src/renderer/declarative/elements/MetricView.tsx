/**
 * src/renderer/declarative/elements/MetricView.tsx
 *
 * Renders declarative MetricElement (KPI metrics with trend indicators and units).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MetricElement, MetricElementInput, Action } from '@/widgets/schema';
import { IconView } from './IconView';

interface MetricViewProps {
  element: MetricElement | MetricElementInput;
  onAction?: (action: Action) => void;
}

export const MetricView = React.memo(function MetricView({
  element,
  onAction,
}: MetricViewProps) {
  const isUp = element.trend === 'up';
  const isDown = element.trend === 'down';

  const trendColor =
    element.trendColor ??
    (isUp ? '#10b981' : isDown ? '#ef4444' : '#94a3b8');

  const trendIcon = isUp ? 'arrow-up' : isDown ? 'arrow-down' : 'minus';

  const handlePress = () => {
    if (element.action && onAction) {
      onAction(element.action);
    }
  };

  const isSmall = element.size === 'small';
  const isLarge = element.size === 'large';

  const content = (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {element.icon && (
          <View style={styles.iconContainer}>
            <IconView
              element={{
                type: 'icon',
                name: element.icon,
                size: isSmall ? 'small' : 'medium',
                color: '#6ee7b7',
              }}
            />
          </View>
        )}
        <Text style={[styles.label, isSmall && styles.labelSmall]} numberOfLines={1}>
          {element.label}
        </Text>
      </View>

      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            isSmall && styles.valueSmall,
            isLarge && styles.valueLarge,
          ]}
          numberOfLines={1}
        >
          {element.value}
          {element.unit && (
            <Text style={styles.unitText}> {element.unit}</Text>
          )}
        </Text>

        {element.change !== undefined && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: `${trendColor}20` },
            ]}
          >
            <IconView
              element={{
                type: 'icon',
                name: trendIcon,
                size: 12,
                color: trendColor,
              }}
            />
            <Text style={[styles.changeText, { color: trendColor }]}>
              {element.change}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (element.action) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    marginRight: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a7f3d0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 10,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  valueSmall: {
    fontSize: 16,
  },
  valueLarge: {
    fontSize: 28,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6ee7b7',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
