/**
 * src/renderer/views/weather-card-view.tsx
 *
 * Placeholder renderer for the "weather-card" widget type.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WidgetInstance, UniversalItem } from '@/widgets/schema';

interface WeatherCardViewProps {
  instance: WidgetInstance;
  items: UniversalItem[];
  isLoading: boolean;
  isError: boolean;
}

export const WeatherCardView = React.memo(function WeatherCardView({
  items,
  isLoading,
  isError,
}: WeatherCardViewProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Weather unavailable</Text>
      </View>
    );
  }

  const current = items.find((i) => i.type === 'weather');
  const temp = current?.type === 'weather' ? current.temp : undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{current?.type === 'weather' ? current.condition : '—'}</Text>
      {temp !== undefined && (
        <Text style={styles.temp}>{Math.round(temp)}°</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  temp: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  placeholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
