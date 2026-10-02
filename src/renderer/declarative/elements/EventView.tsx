/**
 * src/renderer/declarative/elements/EventView.tsx
 *
 * Renders declarative EventElement displaying upcoming schedule items.
 * Resolves live calendar_event data from items when available,
 * falling back to static element properties for template previews.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { EventElement, EventElementInput, Action, UniversalItem } from '@/widgets/schema';
import { formatTime, getItemsByType } from '../dataBinding';
import { IconView } from './IconView';

interface EventViewProps {
  element: EventElement | EventElementInput;
  items?: UniversalItem[];
  onAction?: (action: Action) => void;
}

export const EventView = React.memo(function EventView({
  element,
  items,
  onAction,
}: EventViewProps) {
  // Resolve live calendar event data if available
  const calendarEvents = getItemsByType(items, 'calendar_event');

  // Find the next upcoming event (marked by normaliser) or fall back to the first one
  const liveEvent = calendarEvents.find((e) => e.meta?.isNext) ?? calendarEvents[0];

  // Determine data source: live event data takes priority over static element template
  const title = liveEvent?.title ?? element.title;
  const startAt = liveEvent?.startAt ?? element.startAt;
  const endAt = liveEvent?.endAt ?? element.endAt;
  const location = liveEvent?.location ?? element.location;
  const isAllDay = liveEvent?.isAllDay ?? element.isAllDay ?? false;
  const calendarColor = (liveEvent?.meta?.calendarColor as string) ?? element.calendarColor ?? '#3b82f6';

  const showTime = element.showTime !== false;
  const showLocation = element.showLocation !== false;

  let timeString = '';
  if (isAllDay) {
    timeString = 'All Day';
  } else if (showTime && startAt) {
    const startTime = formatTime(startAt);
    const endTimeSuffix = endAt ? ` - ${formatTime(endAt)}` : '';
    timeString = `${startTime}${endTimeSuffix}`;
  }

  const handlePress = () => {
    if (element.action && onAction) {
      onAction(element.action);
    }
  };

  const dynamicBar: ViewStyle = {
    backgroundColor: calendarColor,
  };

  // Show empty state if no event data at all
  if (!title && !liveEvent) {
    return (
      <View style={styles.emptyContainer}>
        <IconView element={{ type: 'icon', name: 'calendar', size: 'medium', color: '#94a3b8' }} />
        <Text style={styles.emptyText}>No upcoming events</Text>
      </View>
    );
  }

  const content = (
    <View style={styles.container}>
      <View style={[styles.colorBar, dynamicBar]} />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          {timeString ? (
            <View style={styles.timeTag}>
              <Text style={styles.timeText}>{timeString}</Text>
            </View>
          ) : null}
          {showLocation && location ? (
            <View style={styles.locationContainer}>
              <IconView
                element={{ type: 'icon', name: 'clock', size: 'small', color: '#94a3b8' }}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    gap: 8,
    width: '100%',
  },
  colorBar: {
    width: 4,
    height: '100%',
    minHeight: 28,
    borderRadius: 2,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: '#94a3b8',
    flex: 1,
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
