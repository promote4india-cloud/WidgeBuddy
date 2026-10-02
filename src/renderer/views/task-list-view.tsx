/**
 * src/renderer/views/task-list-view.tsx
 *
 * Placeholder renderer for the "task-list" widget type.
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { WidgetInstance, UniversalItem } from '@/widgets/schema';

interface TaskListViewProps {
  instance: WidgetInstance;
  items: UniversalItem[];
  isLoading: boolean;
  isError: boolean;
}

export const TaskListView = React.memo(function TaskListView({
  items,
  isLoading,
  isError,
}: TaskListViewProps) {
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
        <Text style={styles.placeholder}>Tasks unavailable</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>No tasks</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const completed = item.type === 'task' ? item.status === 'completed' : false;
        return (
          <View style={styles.taskRow}>
            <View style={[styles.checkbox, completed && styles.checkboxDone]} />
            <Text
              style={[styles.taskTitle, completed && styles.taskDone]}
              numberOfLines={1}
            >
              {item.type === 'task' ? item.title : 'Task'}
            </Text>
          </View>
        );
      }}
    />
  );
});

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b7280',
  },
  checkboxDone: {
    backgroundColor: '#6b7280',
  },
  taskTitle: { flex: 1, fontSize: 13, color: '#1a1a2e' },
  taskDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
  placeholder: { fontSize: 14, color: '#9ca3af' },
});
