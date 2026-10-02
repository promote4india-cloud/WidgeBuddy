/**
 * src/connectors/weather/__tests__/weather.connector.test.ts
 *
 * Unit tests for the Weather Connector.
 * Tests:
 * - Normalization into existing WeatherItem & UniversalItem schemas
 * - Zero client secrets architecture (authType: 'none', server-side proxy)
 * - Provider-specific isolation (widget engine only gets normalized UniversalItem)
 * - In-memory / persistent caching & fresh TTL
 * - Stale data fallback on upstream API failure
 * - Location permission denial graceful fallback to default city
 * - Force refresh bypassing cache
 */

import { WeatherConnector, getWmoCondition, getWmoIconUrl } from '../weather.connector';
import { WeatherCache } from '../weather.cache';
import { locationService } from '@/services/locationService';
import { UniversalItemSchema, WeatherItemSchema } from '@/widgets/schema';
import { ConnectorError, NormalizedDataResultSchema } from '@/connectors/base/connector.types';

// ---------------------------------------------------------------------------
// Mock Open-Meteo API response payload
// ---------------------------------------------------------------------------

const MOCK_API_RESPONSE = {
  latitude: 40.71,
  longitude: -74.01,
  current: {
    time: '2026-09-19T14:00',
    temperature_2m: 23.4,
    relative_humidity_2m: 58,
    apparent_temperature: 24.1,
    is_day: 1,
    weather_code: 2, // Partly cloudy
    wind_speed_10m: 14.5,
  },
  daily: {
    time: ['2026-09-19'],
    weather_code: [2],
    temperature_2m_max: [26.0],
    temperature_2m_min: [18.2],
  },
};

describe('WeatherConnector', () => {
  let connector: WeatherConnector;
  let testCache: WeatherCache<any>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    testCache = new WeatherCache(600_000, 86_400_000);
    connector = new WeatherConnector(testCache);

    // Reset location mock hooks
    locationService.setMockPermission(null);
    locationService.setMockCoordinates(null);

    // Default mock fetch
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_API_RESPONSE),
      }),
    ) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Metadata & Security', () => {
    it('declares metadata with authType none (server-side security)', () => {
      expect(connector.metadata.id).toBe('weather');
      expect(connector.metadata.authType).toBe('none');
      expect(connector.metadata.supportedDataTypes).toContain('weather');
      expect(connector.metadata.staleTimeMs).toBe(600_000);
    });

    it('connects without requiring any client-side API key', async () => {
      const status = await connector.connect({
        city: 'London',
        units: 'celsius',
      });
      expect(status).toBe('connected');
      expect(connector.status).toBe('connected');
    });
  });

  describe('WMO Code Mappings', () => {
    it('correctly maps WMO weather codes to human descriptions', () => {
      expect(getWmoCondition(0)).toBe('Clear sky');
      expect(getWmoCondition(2)).toBe('Partly cloudy');
      expect(getWmoCondition(61)).toBe('Light rain');
      expect(getWmoCondition(95)).toBe('Thunderstorm');
    });

    it('generates valid icon URLs for day and night', () => {
      const dayIcon = getWmoIconUrl(0, true);
      const nightIcon = getWmoIconUrl(0, false);
      expect(dayIcon).toContain('01d@2x.png');
      expect(nightIcon).toContain('01n@2x.png');
    });
  });

  describe('Normalization & Universal Model', () => {
    it('normalizes response into existing WeatherItem & UniversalItem schemas', async () => {
      await connector.connect({
        city: 'New York',
        useCurrentLocation: false,
        units: 'celsius',
      });

      const res = await connector.fetch();

      // Validate container
      const validatedContainer = NormalizedDataResultSchema.parse(res);
      expect(validatedContainer.schemaVersion).toBe(1);
      expect(validatedContainer.items).toHaveLength(1);

      // Validate single item against UniversalItemSchema
      const item = res.items[0];
      const parsedItem = UniversalItemSchema.parse(item);
      expect(parsedItem.type).toBe('weather');

      // Validate against WeatherItemSchema
      const weatherItem = WeatherItemSchema.parse(item);
      expect(weatherItem.temp).toBe(23.4);
      expect(weatherItem.condition).toBe('Partly cloudy');
      expect(weatherItem.feelsLike).toBe(24.1);
      expect(weatherItem.humidity).toBe(58);
      expect(weatherItem.provider).toBe('weather');
      expect(weatherItem.iconUrl).toBeDefined();

      // Validate extra metadata stored in meta
      expect(weatherItem.meta?.['windSpeed']).toBe(14.5);
      expect(weatherItem.meta?.['isDay']).toBe(true);
      expect(weatherItem.meta?.['highTemp']).toBe(26.0);
      expect(weatherItem.meta?.['lowTemp']).toBe(18.2);
    });

    it('isolates upstream provider response — never leaks raw API schema to widgets', async () => {
      await connector.connect({ city: 'New York', useCurrentLocation: false });
      const res = await connector.fetch();
      const item = res.items[0] as Record<string, unknown>;

      // Ensure raw Open-Meteo keys like 'temperature_2m' or 'apparent_temperature' are NOT at top level
      expect(item['temperature_2m']).toBeUndefined();
      expect(item['apparent_temperature']).toBeUndefined();
      expect(item['weather_code']).toBeUndefined();
    });
  });

  describe('Caching & Stale Data Fallback', () => {
    it('serves cached data on subsequent fetch without calling network again', async () => {
      await connector.connect({ city: 'Tokyo', useCurrentLocation: false });

      // First fetch -> calls fetch
      await connector.fetch();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second fetch within TTL -> serves from cache
      const secondRes = await connector.fetch();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(secondRes.items[0]?.type).toBe('weather');
    });

    it('refresh() bypasses cache and performs a fresh network request', async () => {
      await connector.connect({ city: 'Paris', useCurrentLocation: false });

      await connector.fetch();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      await connector.refresh();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('serves stale cached data when upstream network fails', async () => {
      await connector.connect({ city: 'Sydney', useCurrentLocation: false });

      // 1. Initial successful fetch primes the cache
      await connector.fetch();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // 2. Mock network failure for subsequent calls
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.reject(new Error('Network disconnected / 503 Service Unavailable')),
      );

      // 3. Force a fetch past cache
      const res = await connector.refresh();
      expect(res.items).toHaveLength(1);
      const item = res.items[0];
      expect(item?.meta?.['isStale']).toBe(true);
    });

    it('throws ConnectorError when network fails and no cached data exists', async () => {
      await connector.connect({ city: 'Unknown', useCurrentLocation: false });

      // Network fails immediately with empty cache
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.reject(new Error('DNS failure')),
      );

      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
      try {
        await connector.fetch();
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectorError);
        expect((err as ConnectorError).code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('Location Permission Denial Resilience', () => {
    it('gracefully falls back to fallbackCity when location permission is denied', async () => {
      // Simulate permission denial in location service
      locationService.setMockPermission('denied');

      await connector.connect({
        useCurrentLocation: true,
        fallbackCity: 'New York',
        units: 'celsius',
      });

      // Should not crash or throw!
      const res = await connector.fetch();
      expect(res.items).toHaveLength(1);

      const item = res.items[0];
      expect(item?.meta?.['locationStatus']).toBe('permission_denied_fallback');
      expect(item?.meta?.['cityName']).toContain('New York');
    });

    it('uses GPS coordinates when location permission is granted', async () => {
      locationService.setMockPermission('granted');
      locationService.setMockCoordinates({ latitude: 37.77, longitude: -122.42 });

      await connector.connect({
        useCurrentLocation: true,
      });

      const res = await connector.fetch();
      const item = res.items[0];
      expect(item?.meta?.['locationStatus']).toBe('gps');
      expect(item?.meta?.['latitude']).toBe(37.77);
      expect(item?.meta?.['longitude']).toBe(-122.42);
    });
  });
});
