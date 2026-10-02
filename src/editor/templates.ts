/**
 * src/editor/templates.ts
 *
 * Pre-configured starter templates for creating widgets in the editor.
 * Uses DeclarativeWidgetDefinition directly as source of truth.
 */

import { DeclarativeWidgetDefinition } from '@/widgets/declarative/definition';

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  definition: DeclarativeWidgetDefinition;
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start fresh with an empty container',
    icon: 'layout',
    definition: {
      id: 'custom-widget',
      displayName: 'My Custom Widget',
      description: 'A custom widget crafted with WidgeBuddy',
      version: '1.0.0',
      category: 'productivity',
      tags: ['custom'],
      icon: 'layout',
      connectorTypes: [],
      configFields: [],
      supportedSizes: ['small', 'medium', 'large'],
      defaultSize: 'medium',
      layouts: {
        small: {
          backgroundColor: '#ffffff',
          padding: 12,
          root: {
            type: 'container',
            id: 'root-s',
            direction: 'column',
            gap: 6,
            padding: 0,
            children: [
              {
                type: 'text',
                id: 'txt-title-s',
                content: 'My Widget',
                variant: 'title',
                weight: 'bold',
                align: 'left',
              },
            ],
          },
        },
        medium: {
          backgroundColor: '#ffffff',
          padding: 16,
          root: {
            type: 'container',
            id: 'root-m',
            direction: 'column',
            gap: 8,
            padding: 0,
            children: [
              {
                type: 'text',
                id: 'txt-title-m',
                content: 'My Widget',
                variant: 'title',
                weight: 'bold',
                align: 'left',
              },
              {
                type: 'text',
                id: 'txt-sub-m',
                content: 'Tap "+ Add Component" to customize your widget.',
                variant: 'caption',
                weight: 'regular',
                color: '#64748b',
                align: 'left',
              },
            ],
          },
        },
        large: {
          backgroundColor: '#ffffff',
          padding: 16,
          root: {
            type: 'container',
            id: 'root-l',
            direction: 'column',
            gap: 12,
            padding: 0,
            children: [
              {
                type: 'text',
                id: 'txt-title-l',
                content: 'My Widget',
                variant: 'heading',
                weight: 'bold',
                align: 'left',
              },
              {
                type: 'text',
                id: 'txt-sub-l',
                content: 'Tap "+ Add Component" to customize your widget.',
                variant: 'body',
                weight: 'regular',
                color: '#64748b',
                align: 'left',
              },
            ],
          },
        },
      },
    },
  },
  {
    id: 'my-day',
    name: 'My Day Overview',
    description: 'Greeting, current weather, upcoming event, and top priorities',
    icon: 'sun',
    definition: {
      id: 'my-day-widget',
      displayName: 'My Day',
      description: 'Your daily briefing with weather, next event, and top tasks',
      version: '1.0.0',
      category: 'productivity',
      tags: ['daily', 'weather', 'calendar', 'tasks'],
      icon: 'sun',
      connectorTypes: ['weather', 'calendar', 'tasks'],
      configFields: [],
      supportedSizes: ['small', 'medium', 'large'],
      defaultSize: 'medium',
      layouts: {
        small: {
          backgroundColor: '#ffffff',
          padding: 12,
          root: {
            type: 'container',
            id: 'root-myday-s',
            direction: 'column',
            gap: 6,
            padding: 0,
            children: [
              {
                type: 'text',
                id: 'md-greet-s',
                content: 'Good Day ☀️',
                variant: 'title',
                weight: 'bold',
                align: 'left',
              },
              {
                type: 'weather',
                id: 'md-weather-s',
                displayMode: 'compact',
                showConditionIcon: true,
                showHumidity: false,
                showWind: false,
                showFeelsLike: false,
                tempUnit: 'auto',
                forecastDays: 1,
              },
            ],
          },
        },
        medium: {
          backgroundColor: '#ffffff',
          padding: 14,
          root: {
            type: 'container',
            id: 'root-myday-m',
            direction: 'column',
            gap: 8,
            padding: 0,
            children: [
              {
                type: 'container',
                id: 'md-header-row-m',
                direction: 'row',
                gap: 8,
                padding: 0,
                children: [
                  {
                    type: 'text',
                    id: 'md-greeting-m',
                    content: 'Good morning! ☀️',
                    variant: 'title',
                    weight: 'bold',
                    align: 'left',
                  },
                ],
              },
              {
                type: 'weather',
                id: 'md-weather-m',
                displayMode: 'compact',
                showConditionIcon: true,
                showHumidity: true,
                showWind: false,
                showFeelsLike: true,
                tempUnit: 'auto',
                forecastDays: 1,
              },
              {
                type: 'divider',
                id: 'md-div-m',
                orientation: 'horizontal',
                thickness: 1,
                color: '#f1f5f9',
                spacing: 4,
              },
              {
                type: 'event',
                id: 'md-event-m',
                title: 'Team Standup',
                startAt: new Date(Date.now() + 1800000).toISOString(),
                location: 'Google Meet',
                calendarColor: '#6366f1',
                showTime: true,
                showLocation: true,
                isAllDay: false,
              },
            ],
          },
        },
        large: {
          backgroundColor: '#ffffff',
          padding: 16,
          root: {
            type: 'container',
            id: 'root-myday-l',
            direction: 'column',
            gap: 10,
            padding: 0,
            children: [
              {
                type: 'container',
                id: 'md-header-l',
                direction: 'column',
                gap: 2,
                padding: 0,
                children: [
                  {
                    type: 'text',
                    id: 'md-title-l',
                    content: 'Today at a Glance ☀️',
                    variant: 'heading',
                    weight: 'bold',
                    align: 'left',
                  },
                  {
                    type: 'text',
                    id: 'md-date-l',
                    content: 'Have a productive day ahead',
                    variant: 'caption',
                    weight: 'regular',
                    color: '#64748b',
                    align: 'left',
                  },
                ],
              },
              {
                type: 'weather',
                id: 'md-weather-l',
                displayMode: 'current',
                showConditionIcon: true,
                showHumidity: true,
                showWind: true,
                showFeelsLike: true,
                tempUnit: 'auto',
                forecastDays: 1,
              },
              {
                type: 'divider',
                id: 'md-div-l1',
                orientation: 'horizontal',
                thickness: 1,
                color: '#f1f5f9',
                spacing: 4,
              },
              {
                type: 'event',
                id: 'md-event-l',
                title: 'Product Review & Demo',
                startAt: new Date(Date.now() + 3600000).toISOString(),
                location: 'Room B & Meet',
                calendarColor: '#8b5cf6',
                showTime: true,
                showLocation: true,
                isAllDay: false,
              },
              {
                type: 'divider',
                id: 'md-div-l2',
                orientation: 'horizontal',
                thickness: 1,
                color: '#f1f5f9',
                spacing: 4,
              },
              {
                type: 'taskList',
                id: 'md-tasks-l',
                maxItems: 3,
                showCheckbox: true,
                showDueDate: true,
                showPriority: true,
                filterStatus: 'pending',
                emptyMessage: 'All caught up on tasks!',
                allowToggle: true,
              },
            ],
          },
        },
      },
    },
  },
  {
    id: 'weather-focus',
    name: 'Weather & Forecast',
    description: 'Current local weather and upcoming multi-day forecast',
    icon: 'cloud-sun',
    definition: {
      id: 'weather-focus-widget',
      displayName: 'Weather Forecast',
      description: 'Detailed weather conditions and forecast',
      version: '1.0.0',
      category: 'weather',
      tags: ['weather', 'forecast'],
      icon: 'cloud-sun',
      connectorTypes: ['weather'],
      configFields: [],
      supportedSizes: ['small', 'medium', 'large'],
      defaultSize: 'medium',
      layouts: {
        small: {
          backgroundColor: '#ffffff',
          padding: 12,
          root: {
            type: 'container',
            id: 'root-wf-s',
            direction: 'column',
            gap: 6,
            padding: 0,
            children: [
              {
                type: 'weather',
                id: 'wf-curr-s',
                displayMode: 'current',
                showConditionIcon: true,
                showHumidity: false,
                showWind: false,
                showFeelsLike: false,
                tempUnit: 'auto',
                forecastDays: 1,
              },
            ],
          },
        },
        medium: {
          backgroundColor: '#ffffff',
          padding: 14,
          root: {
            type: 'container',
            id: 'root-wf-m',
            direction: 'column',
            gap: 8,
            padding: 0,
            children: [
              {
                type: 'weather',
                id: 'wf-curr-m',
                displayMode: 'forecast',
                showConditionIcon: true,
                showHumidity: true,
                showWind: true,
                showFeelsLike: true,
                tempUnit: 'auto',
                forecastDays: 3,
              },
            ],
          },
        },
        large: {
          backgroundColor: '#ffffff',
          padding: 16,
          root: {
            type: 'container',
            id: 'root-wf-l',
            direction: 'column',
            gap: 10,
            padding: 0,
            children: [
              {
                type: 'text',
                id: 'wf-title-l',
                content: 'Weather Forecast',
                variant: 'heading',
                weight: 'bold',
                align: 'left',
              },
              {
                type: 'weather',
                id: 'wf-curr-l',
                displayMode: 'detailed',
                showConditionIcon: true,
                showHumidity: true,
                showWind: true,
                showFeelsLike: true,
                tempUnit: 'auto',
                forecastDays: 5,
              },
            ],
          },
        },
      },
    },
  },
];

/**
 * Returns a template by ID, or the 'blank' template as fallback.
 */
export function getTemplate(templateId?: string): WidgetTemplate {
  if (
    templateId === 'weather-card' ||
    templateId === 'weather' ||
    templateId === 'weather-focus'
  ) {
    const weatherTmpl = WIDGET_TEMPLATES.find((t) => t.id === 'weather-focus');
    if (weatherTmpl) return weatherTmpl;
  }
  const found = WIDGET_TEMPLATES.find((t) => t.id === templateId);
  return found ?? WIDGET_TEMPLATES[0];
}
