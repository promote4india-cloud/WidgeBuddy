/**
 * src/renderer/WidgetRenderer.tsx
 *
 * Layer 4 — main renderer component.
 *
 * Reads a WidgetInstance, fetches its data via useWidgetData,
 * then dispatches to the correct view component based on widget type.
 *
 * To add a new widget type:
 *   1. Create src/renderer/views/<type>-view.tsx
 *   2. Add a case in the switch below
 *   See docs/ai-contract.md §4 "Adding a widget type" for the full checklist.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WidgetInstance } from '@/widgets/schema';
import { getDefinition } from '@/widgets/registry';
import { useWidgetData } from '@/hooks/useWidgetData';
import { ClockView } from './views/clock-view';
import { WeatherCardView } from './views/weather-card-view';
import { CalendarListView } from './views/calendar-list-view';
import { TaskListView } from './views/task-list-view';
import { RssFeedView } from './views/rss-feed-view';
import { DeclarativeWidgetRenderer } from './declarative/DeclarativeWidgetRenderer';

interface WidgetRendererProps {
  instance: WidgetInstance;
}

export const WidgetRenderer = React.memo(function WidgetRenderer({
  instance,
}: WidgetRendererProps) {
  const definition = getDefinition(instance.definitionId);
  const { items, isLoading, isError } = useWidgetData(instance);

  if (!definition) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unknown widget type</Text>
      </View>
    );
  }

  // If the widget definition provides declarative layouts, use the declarative renderer
  if (definition.layouts) {
    const size =
      instance.layout.w <= 2 ? 'small' : instance.layout.h >= 4 ? 'large' : 'medium';
    return (
      <DeclarativeWidgetRenderer
        definition={definition}
        size={size}
        items={items}
        userConfig={instance.userConfig}
      />
    );
  }

  const viewProps = { instance, items, isLoading, isError };

  switch (definition.type) {
    case 'clock':
      return <ClockView instance={instance} />;
    case 'weather-card':
      return <WeatherCardView {...viewProps} />;
    case 'calendar-list':
      return <CalendarListView {...viewProps} />;
    case 'task-list':
      return <TaskListView {...viewProps} />;
    case 'rss-feed':
      return <RssFeedView {...viewProps} />;
    default:
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No renderer for "{definition.type}"</Text>
        </View>
      );
  }
});

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
});
