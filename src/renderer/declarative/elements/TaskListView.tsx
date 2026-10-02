/**
 * src/renderer/declarative/elements/TaskListView.tsx
 *
 * Renders declarative TaskListElement with interactive checkboxes and priority badges.
 * Gracefully handles empty data.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TaskListElement, TaskListElementInput, Action, UniversalItem, TaskItem } from '@/widgets/schema';
import { getItemsByType, formatDate } from '../dataBinding';
import { IconView } from './IconView';

interface TaskListViewProps {
  element: TaskListElement | TaskListElementInput;
  items?: UniversalItem[];
  onAction?: (action: Action) => void;
}

export const TaskListView = React.memo(function TaskListView({
  element,
  items,
  onAction,
}: TaskListViewProps) {
  const allTasks = getItemsByType(items, 'task');
  const maxItems = element.maxItems ?? 5;
  const emptyMessage = element.emptyMessage ?? 'No tasks to show';
  const showCheckbox = element.showCheckbox !== false;
  const allowToggle = element.allowToggle !== false;

  // Filter tasks according to filterStatus
  const filterStatus = element.filterStatus ?? 'pending';
  const filteredTasks = allTasks.filter((task) => {
    if (filterStatus === 'pending') return task.status === 'pending';
    if (filterStatus === 'completed') return task.status === 'completed';
    return true;
  });

  const visibleTasks = filteredTasks.slice(0, maxItems);

  if (visibleTasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconView element={{ type: 'icon', name: 'check-circle', size: 'small', color: '#71717a' }} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const handleToggle = (task: TaskItem) => {
    if (element.allowToggle && onAction) {
      onAction({
        type: 'toggle_task',
        payload: { taskId: task.id, currentStatus: task.status },
      });
    }
  };

  return (
    <View style={styles.listContainer}>
      {visibleTasks.map((task) => {
        const isCompleted = task.status === 'completed';

        return (
          <TouchableOpacity
            key={task.id}
            onPress={() => handleToggle(task)}
            disabled={!element.allowToggle}
            activeOpacity={0.7}
            style={styles.taskRow}
          >
            {element.showCheckbox && (
              <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
                {isCompleted && (
                  <IconView
                    element={{ type: 'icon', name: 'check-circle', size: 14, color: '#22c55e' }}
                  />
                )}
              </View>
            )}

            <View style={styles.taskContent}>
              <Text
                style={[styles.taskTitle, isCompleted && styles.completedText]}
                numberOfLines={1}
              >
                {task.title}
              </Text>

              <View style={styles.metaRow}>
                {element.showDueDate && task.dueDate && (
                  <Text style={styles.dueDateText}>{formatDate(task.dueDate)}</Text>
                )}
                {element.showPriority && task.priority && (
                  <View
                    style={[
                      styles.priorityBadge,
                      task.priority === 'high' && styles.priorityHigh,
                      task.priority === 'medium' && styles.priorityMedium,
                    ]}
                  >
                    <Text style={styles.priorityText}>{task.priority}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  listContainer: {
    flexDirection: 'column',
    gap: 6,
    width: '100%',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#52525b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  taskTitle: {
    fontSize: 13,
    color: '#f4f4f5',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#71717a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateText: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#27272a',
  },
  priorityHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  priorityMedium: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#d4d4d8',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
  },
});
