/**
 * src/widgets/built-in/calendar-list.ts
 */

import { WidgetDefinition } from '../schema';

export const calendarListDef: WidgetDefinition = {
  type: 'calendar-list',
  displayName: 'Calendar List',
  description: 'Upcoming events from your calendar.',
  version: '1.0.0',
  connectorTypes: ['google_calendar'],
  configFields: [
    {
      key: 'maxEvents',
      label: 'Max events to show',
      type: 'number',
      defaultValue: 5,
      required: false,
    },
    {
      key: 'lookaheadDays',
      label: 'Days to look ahead',
      type: 'number',
      defaultValue: 7,
      required: false,
    },
    {
      key: 'showAllDay',
      label: 'Include all-day events',
      type: 'boolean',
      defaultValue: true,
      required: false,
    },
  ],
  minW: 2,
  minH: 2,
  maxW: 6,
};
