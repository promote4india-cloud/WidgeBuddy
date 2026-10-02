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
});
