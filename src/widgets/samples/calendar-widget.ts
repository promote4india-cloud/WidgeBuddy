/**
 * src/widgets/samples/calendar-widget.ts
 *
 * Sample 2: Calendar & Agenda Widget
 * Demonstrates:
 * - calendar metadata & config fields
 * - small / medium / large layouts
 * - event element, container, text, icon, divider, action
 */

import { DeclarativeWidgetDefinition } from '../declarative/definition';

export const calendarAgendaWidget: DeclarativeWidgetDefinition = {
  id: 'calendar-agenda-widget',
  displayName: 'Calendar & Agenda',
  description: 'Upcoming meetings and daily agenda overview.',
  version: '1.0.0',
  author: 'WidgeBuddy Team',
  category: 'productivity',
  tags: ['calendar', 'agenda', 'meetings', 'schedule'],
  icon: 'calendar',
  connectorTypes: ['google_calendar'],
  supportedSizes: ['small', 'medium', 'large'],
  defaultSize: 'medium',
  configFields: [
    {
      key: 'showDeclined',
      label: 'Show Declined Events',
      type: 'boolean',
      defaultValue: false,
      required: false,
    },
    {
      key: 'calendarColor',
      label: 'Accent Color',
      type: 'color',
      defaultValue: '#3b82f6',
      required: false,
    },
  ],
  layouts: {
    // -----------------------------------------------------------------------
    // Small (2x2): Next upcoming meeting countdown
    // -----------------------------------------------------------------------
    small: {
      backgroundColor: '#1e293b',
      padding: 12,
      root: {
        type: 'container',
        direction: 'column',
        alignment: { vertical: 'space-between' },
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: 'NEXT UP',
                variant: 'caption',
                weight: 'bold',
                color: '#38bdf8',
              },
              {
                type: 'icon',
                name: 'clock',
                size: 'small',
                color: '#94a3b8',
              },
            ],
          },
          {
            type: 'container',
            direction: 'column',
            gap: 2,
            children: [
              {
                type: 'text',
                content: 'Product Sync',
                variant: 'title',
                weight: 'semibold',
                color: '#f8fafc',
                maxLines: 2,
              },
              {
                type: 'text',
                content: 'in 25 mins',
                variant: 'body',
                color: '#38bdf8',
                weight: 'medium',
              },
            ],
          },
          {
            type: 'text',
            content: '10:30 AM - Room B',
            variant: 'caption',
            color: '#94a3b8',
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Medium (4x2): Today's upcoming events
    // -----------------------------------------------------------------------
    medium: {
      backgroundColor: '#0f172a',
      padding: 14,
      root: {
        type: 'container',
        direction: 'column',
        gap: 8,
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: "Today's Schedule",
                variant: 'title',
                weight: 'bold',
                color: '#f8fafc',
              },
              {
                type: 'action',
                label: 'Open',
                variant: 'button',
                style: 'ghost',
                action: {
                  type: 'navigate',
                  route: '/calendar',
                },
              },
            ],
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#334155',
            thickness: 1,
          },
          {
            type: 'event',
            title: 'Design Review',
            startAt: '2026-09-19T14:00:00.000Z',
            endAt: '2026-09-19T15:00:00.000Z',
            location: 'Google Meet',
            calendarColor: '#3b82f6',
            showTime: true,
            showLocation: true,
          },
          {
            type: 'event',
            title: 'Quarterly Planning',
            startAt: '2026-09-19T16:30:00.000Z',
            endAt: '2026-09-19T17:30:00.000Z',
            location: 'Conference Room 4',
            calendarColor: '#10b981',
            showTime: true,
            showLocation: true,
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Large (6x4): Detailed agenda & calendar overview
    // -----------------------------------------------------------------------
    large: {
      backgroundColor: '#0f172a',
      padding: 16,
      root: {
        type: 'container',
        direction: 'column',
        gap: 12,
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'container',
                direction: 'column',
                children: [
                  {
                    type: 'text',
                    content: 'Calendar Agenda',
                    variant: 'heading',
                    weight: 'bold',
                    color: '#ffffff',
                  },
                  {
                    type: 'text',
                    content: 'Saturday, September 19',
                    variant: 'caption',
                    color: '#94a3b8',
                  },
                ],
              },
              {
                type: 'action',
                label: '+ New Event',
                variant: 'button',
                style: 'primary',
                action: {
                  type: 'run_connector',
                  actionName: 'create_event',
                },
              },
            ],
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#334155',
            thickness: 1,
          },
          {
            type: 'event',
            title: 'Team Standup',
            startAt: '2026-09-19T09:00:00.000Z',
            endAt: '2026-09-19T09:30:00.000Z',
            location: 'Zoom Room #1',
            calendarColor: '#6366f1',
          },
          {
            type: 'event',
            title: 'Product Design Review',
            startAt: '2026-09-19T11:00:00.000Z',
            endAt: '2026-09-19T12:00:00.000Z',
            location: 'Boardroom A',
            calendarColor: '#3b82f6',
          },
          {
            type: 'event',
            title: '1:1 with Engineering Lead',
            startAt: '2026-09-19T14:30:00.000Z',
            endAt: '2026-09-19T15:00:00.000Z',
            location: 'Virtual',
            calendarColor: '#10b981',
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#334155',
            thickness: 1,
          },
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: '3 more events tomorrow',
                variant: 'caption',
                color: '#64748b',
              },
              {
                type: 'action',
                label: 'View Full Calendar',
                variant: 'link',
                action: {
                  type: 'open_url',
                  url: 'https://calendar.google.com',
                },
              },
            ],
          },
        ],
      },
    },
  },
};
