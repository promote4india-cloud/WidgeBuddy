/**
 * src/services/__tests__/homeScreenWidgetService.test.ts
 *
 * Unit tests for cross-platform HomeScreenWidgetService.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  homeScreenWidgetService,
  HOME_SCREEN_STORAGE_KEY,
} from '../homeScreenWidgetService';
import { DeclarativeWidgetDefinition } from '@/widgets/declarative/definition';
import { UniversalItem } from '@/widgets/schema';

describe('HomeScreenWidgetService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  const mockWidget: DeclarativeWidgetDefinition = {
    id: 'weather-pin-widget',
    displayName: 'My Weather Glance',
    description: 'Current weather at a glance',
    version: '1.0.0',
    category: 'weather',
    tags: ['weather', 'home'],
    connectorTypes: ['weather'],
    configFields: [],
    supportedSizes: ['small', 'medium'],
    defaultSize: 'medium',
    layouts: {
      small: {
        root: {
          type: 'container',
          id: 'root-s',
          direction: 'column',
          gap: 4,
          padding: 0,
          children: [
            {
              type: 'text',
              id: 'temp-txt',
              content: '{{data.weather.temp}}',
            },
          ],
        },
      },
      medium: {
        root: {
          type: 'container',
          id: 'root-m',
          direction: 'column',
          gap: 8,
          padding: 0,
          children: [
            {
              type: 'text',
              id: 'temp-txt-m',
              content: '{{data.weather.temp}}',
            },
          ],
        },
      },
    },
  };

  const mockWeatherItems: UniversalItem[] = [
    {
      id: 'weather-1',
      provider: 'mock-weather',
      updatedAt: new Date().toISOString(),
      type: 'weather',
      temp: 24.6,
      condition: 'Sunny',
      meta: {
        location: 'San Francisco, CA',
        forecast: [
          { day: 'Mon', temp: 23, icon: 'sun' },
          { day: 'Tue', temp: 21, icon: 'cloud' },
          { day: 'Wed', temp: 25, icon: 'sun' },
        ],
      },
    },
  ];

  it('synchronizes widget payload to storage with glanceSummary', async () => {
    const payload = await homeScreenWidgetService.setActiveHomeScreenWidget(
      mockWidget,
      mockWeatherItems,
      'medium',
    );

    expect(payload).toBeDefined();
    expect(payload.definition.id).toBe('weather-pin-widget');
    expect(payload.size).toBe('medium');
    expect(payload.glanceSummary).toBeDefined();
    expect(payload.glanceSummary?.temperature).toBe(25); // rounded 24.6
    expect(payload.glanceSummary?.condition).toBe('Sunny');
    expect(payload.glanceSummary?.location).toBe('San Francisco, CA');
    expect(payload.glanceSummary?.forecastDays).toHaveLength(3);

    // Verify stored in AsyncStorage
    const retrieved = await homeScreenWidgetService.getActiveHomeScreenWidget();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.definition.displayName).toBe('My Weather Glance');
    expect(retrieved?.glanceSummary?.temperature).toBe(25);
  });

  it('handles widget payload with empty data items gracefully', async () => {
    const payload = await homeScreenWidgetService.setActiveHomeScreenWidget(
      mockWidget,
      [],
    );

    expect(payload.items).toHaveLength(0);
    expect(payload.glanceSummary?.title).toBe('My Weather Glance');
    expect(payload.glanceSummary?.temperature).toBeUndefined();
    expect(payload.glanceSummary?.location).toBe('Local Weather');
    expect(payload.glanceSummary?.forecastDays).toEqual([]);
  });

  it('returns null if no widget is saved in storage', async () => {
    const active = await homeScreenWidgetService.getActiveHomeScreenWidget();
    expect(active).toBeNull();
  });

  it('handles requestPinHomeScreenWidget for android', async () => {
    Platform.OS = 'android';

    const result = await homeScreenWidgetService.requestPinHomeScreenWidget(
      mockWidget,
      mockWeatherItems,
    );

    expect(result.success).toBe(true);
    expect(result.platform).toBe('android');
    expect(result.isNativeSupported).toBe(true);
    expect(result.message).toContain('Android');
  });

  it('handles requestPinHomeScreenWidget for ios', async () => {
    Platform.OS = 'ios';

    const result = await homeScreenWidgetService.requestPinHomeScreenWidget(
      mockWidget,
      mockWeatherItems,
    );

    expect(result.success).toBe(true);
    expect(result.platform).toBe('ios');
    expect(result.isNativeSupported).toBe(true);
    expect(result.message).toContain('iOS WidgetKit');
  });

  it('returns available widgets list from repository', async () => {
    const list = await homeScreenWidgetService.getAvailableWidgetsList();
    expect(Array.isArray(list)).toBe(true);
  });

  it('correctly creates polymorphic glance summary for task widget', async () => {
    const taskWidget: DeclarativeWidgetDefinition = {
      id: 'task-list',
      displayName: 'My Tasks',
      category: 'tasks',
      connectorTypes: ['todoist'],
      configFields: [],
      supportedSizes: ['medium'],
      layouts: {
        medium: {
          root: { type: 'container', id: 'r', children: [] },
        },
      },
    };

    const taskItems: UniversalItem[] = [
      {
        id: 't1',
        provider: 'todoist',
        updatedAt: new Date().toISOString(),
        type: 'task',
        title: 'Complete project proposal',
        status: 'pending',
        priority: 'high',
        project: 'Work',
      },
      {
        id: 't2',
        provider: 'todoist',
        updatedAt: new Date().toISOString(),
        type: 'task',
        title: 'Review team PRs',
        status: 'completed',
      },
    ];

    const payload = await homeScreenWidgetService.setActiveHomeScreenWidget(
      taskWidget,
      taskItems,
    );

    expect(payload.glanceSummary?.widgetType).toBe('task');
    expect(payload.glanceSummary?.title).toBe('My Tasks');
    expect(payload.glanceSummary?.primaryText).toBe('1 pending task');
    expect(payload.glanceSummary?.secondaryText).toBe('Next: Complete project proposal');
    expect(payload.glanceSummary?.listItems).toHaveLength(2);
    expect(payload.glanceSummary?.listItems?.[0].title).toBe('Complete project proposal');
    expect(payload.glanceSummary?.listItems?.[0].isDone).toBe(false);
    expect(payload.glanceSummary?.listItems?.[1].isDone).toBe(true);
  });

  it('correctly creates polymorphic glance summary for calendar widget', async () => {
    const calendarWidget: DeclarativeWidgetDefinition = {
      id: 'calendar-list',
      displayName: 'Daily Schedule',
      category: 'calendar',
      connectorTypes: ['google_calendar'],
      configFields: [],
      supportedSizes: ['medium'],
      layouts: {
        medium: {
          root: { type: 'container', id: 'r', children: [] },
        },
      },
    };

    const calendarItems: UniversalItem[] = [
      {
        id: 'c1',
        provider: 'google_calendar',
        updatedAt: new Date().toISOString(),
        type: 'calendar_event',
        title: 'Team Standup',
        startAt: '2026-10-02T10:00:00.000Z',
        endAt: '2026-10-02T10:30:00.000Z',
        isAllDay: false,
        location: 'Zoom',
      },
    ];

    const payload = await homeScreenWidgetService.setActiveHomeScreenWidget(
      calendarWidget,
      calendarItems,
    );

    expect(payload.glanceSummary?.widgetType).toBe('calendar');
    expect(payload.glanceSummary?.title).toBe('Daily Schedule');
    expect(payload.glanceSummary?.primaryText).toBe('Team Standup');
    expect(payload.glanceSummary?.listItems).toHaveLength(1);
    expect(payload.glanceSummary?.listItems?.[0].meta).toBe('Zoom');
  });

  it('correctly creates polymorphic glance summary for clock widget', async () => {
    const clockWidget: DeclarativeWidgetDefinition = {
      id: 'clock',
      displayName: 'Digital Clock',
      category: 'clock',
      connectorTypes: [],
      configFields: [],
      supportedSizes: ['small', 'medium'],
      layouts: {
        medium: {
          root: { type: 'container', id: 'r', children: [] },
        },
      },
    };

    const payload = await homeScreenWidgetService.setActiveHomeScreenWidget(
      clockWidget,
      [],
    );

    expect(payload.glanceSummary?.widgetType).toBe('clock');
    expect(payload.glanceSummary?.title).toBe('Digital Clock');
    expect(payload.glanceSummary?.timeText).toBeDefined();
    expect(payload.glanceSummary?.dateText).toBeDefined();
  });
});
