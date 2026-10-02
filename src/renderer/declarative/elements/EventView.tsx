/**
 * src/renderer/declarative/elements/EventView.tsx
 *
 * Renders declarative EventElement displaying upcoming schedule items.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { EventElement, EventElementInput, Action } from '@/widgets/schema';
import { formatTime } from '../dataBinding';
import { IconView } from './IconView';

interface EventViewProps {
  element: EventElement | EventElementInput;
  onAction?: (action: Action) => void;
}

export const EventView = React.memo(function EventView({
  element,
  onAction,
}: EventViewProps) {
  const accentColor = element.calendarColor ?? '#3b82f6';

  const showTime = element.showTime !== false;
  const showLocation = element.showLocation !== false;

  let timeString = '';
  if (element.isAllDay) {
    timeString = 'All Day';
  } else if (showTime) {
    const startTime = formatTime(element.startAt);
    const endTime = element.endAt ? ` - ${formatTime(element.endAt)}` : '';
    timeString = `${startTime}${endTime}`;
  }

  const handlePress = () => {
    if (element.action && onAction) {
      onAction(element.action);
    }
  };

  const dynamicBar: ViewStyle = {
    backgroundColor: accentColor,
  };

  const content = (
    <View style={styles.container}>
      <View style={[styles.colorBar, dynamicBar]} />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {element.title}
        </Text>
        <View style={styles.metaRow}>
          {timeString ? (
            <View style={styles.timeTag}>
              <Text style={styles.timeText}>{timeString}</Text>
            </View>
          ) : null}
          {showLocation && element.location ? (
            <View style={styles.locationContainer}>
              <IconView
                element={{ type: 'icon', name: 'clock', size: 'small', color: '#94a3b8' }}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {element.location}
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
});
