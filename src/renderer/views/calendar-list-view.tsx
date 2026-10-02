/**
 * src/renderer/views/calendar-list-view.tsx
 *
 * Placeholder renderer for the "calendar-list" widget type.
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { WidgetInstance, UniversalItem } from '@/widgets/schema';

interface CalendarListViewProps {
  instance: WidgetInstance;
  items: UniversalItem[];
  isLoading: boolean;
  isError: boolean;
}

export const CalendarListView = React.memo(function CalendarListView({
  items,
  isLoading,
  isError,
}: CalendarListViewProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Calendar unavailable</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>No upcoming events</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.eventRow}>
          <Text style={styles.eventTime}>
            {item.type === 'calendar_event' && item.startAt ? new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All day'}
          </Text>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.type === 'calendar_event' ? item.title : 'Event'}
          </Text>
        </View>
      )}
    />
  );
});

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  eventRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  eventTime: { fontSize: 12, color: '#6b7280', width: 52 },
  eventTitle: { flex: 1, fontSize: 13, color: '#1a1a2e' },
  placeholder: { fontSize: 14, color: '#9ca3af' },
});
