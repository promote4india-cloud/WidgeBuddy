/**
 * src/renderer/views/clock-view.tsx
 *
 * Placeholder renderer for the "clock" widget type.
 * Displays local time — no connector needed.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WidgetInstance } from '@/widgets/schema';

interface ClockViewProps {
  instance: WidgetInstance;
}

export const ClockView = React.memo(function ClockView({ instance }: ClockViewProps) {
  const [now, setNow] = useState(new Date());
  const format = (instance.userConfig['format'] as string | undefined) ?? '12h';
  const showDate = (instance.userConfig['showDate'] as boolean | undefined) ?? true;
  const showSeconds = (instance.userConfig['showSeconds'] as boolean | undefined) ?? false;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), showSeconds ? 1000 : 10_000);
    return () => clearInterval(interval);
  }, [showSeconds]);

  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: format === '12h',
  });

  const dateString = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{timeString}</Text>
      {showDate && <Text style={styles.date}>{dateString}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  time: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
