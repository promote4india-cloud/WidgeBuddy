/**
 * src/connectors/calendar/__tests__/calendar.connector.test.ts
 *
 * Unit tests for CalendarConnector:
 * - Token expiration and auto-refresh
 * - Disconnected account handling
 * - Malformed provider responses
 * - Timezone handling and event categorization (next, today, upcoming)
 * - Cache freshness and stale fallback
 */

import { CalendarConnector } from '../calendar.connector';
import { CalendarCache } from '../calendar.cache';
import { RawCalendarData, CalendarConfig } from '../calendar.types';
import {
  normaliseGCalEvents,
  getNextEvent,
  getTodayEvents,
  getUpcomingEvents,
  parseEventTimeBounds,
} from '../calendar.normaliser';
import { ConnectorError } from '../../base/connector.types';

describe('CalendarConnector', () => {
  let connector: CalendarConnector;
  let testCache: CalendarCache<RawCalendarData>;

  beforeEach(() => {
    testCache = new CalendarCache<RawCalendarData>(2000, 10000);
    connector = new CalendarConnector(testCache);
  });

  afterEach(async () => {
    await connector.disconnect();
  });

  const validConfig: CalendarConfig = {
    calendarId: 'primary',
    timeZone: 'UTC',
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
    accessToken: 'valid_access_token',
    tokenExpiresAt: Date.now() + 3600 * 1000, // Valid for 1 hr
  };

  const sampleRawGCalResponse = {
    kind: 'calendar#events',
    summary: 'Work Calendar',
    timeZone: 'UTC',
    items: [
      {
        id: 'evt-1',
        summary: 'Daily Standup',
        start: { dateTime: '2026-09-19T10:00:00Z' },
        end: { dateTime: '2026-09-19T10:30:00Z' },
        status: 'confirmed',
      },
      {
        id: 'evt-2',
        summary: 'Sprint Retrospective',
        start: { dateTime: '2026-09-19T15:00:00Z' },
        end: { dateTime: '2026-09-19T16:00:00Z' },
        status: 'confirmed',
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // 1. Disconnected Account Tests
  // ---------------------------------------------------------------------------

  describe('Disconnected Accounts', () => {
    it('throws DISCONNECTED when calling fetch() without connect()', async () => {
      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
      try {
        await connector.fetch();
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectorError);
        expect((err as ConnectorError).code).toBe('NOT_CONNECTED');
      }
    });

    it('throws DISCONNECTED after calling disconnect()', async () => {
      await connector.connect(validConfig);
      expect(connector.getStatus()).toBe('connected');

      await connector.disconnect();
      expect(connector.getStatus()).toBe('disconnected');

      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Token Expiration & Refresh Tests
  // ---------------------------------------------------------------------------

  describe('Token Expiration & Refresh', () => {
    it('throws TOKEN_EXPIRED if token is expired and no refresh token is provided', async () => {
      const expiredConfig: CalendarConfig = {
        ...validConfig,
        tokenExpiresAt: Date.now() - 5000, // Expired 5 seconds ago
        refreshToken: undefined,
      };

      await expect(connector.connect(expiredConfig)).rejects.toThrow(ConnectorError);
      try {
        await connector.connect(expiredConfig);
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectorError);
        expect((err as ConnectorError).code).toBe('TOKEN_EXPIRED');
        expect(connector.getStatus()).toBe('expired');
      }
    });

    it('auto-refreshes expired token when valid refresh token is available', async () => {
      let refreshCalled = false;
      connector.setCustomRefreshHandler(async (cfg) => {
        refreshCalled = true;
        cfg.tokenExpiresAt = Date.now() + 3600 * 1000;
        cfg.accessToken = 'refreshed_access_token';
        return true;
      });

      connector.setCustomFetchHandler(async () => sampleRawGCalResponse);

      const expiredConfigWithRefresh: CalendarConfig = {
        ...validConfig,
        tokenExpiresAt: Date.now() - 1000,
        refreshToken: 'valid_refresh_token',
      };

      await connector.connect(expiredConfigWithRefresh);
      expect(refreshCalled).toBe(true);
      expect(connector.getStatus()).toBe('connected');

      const result = await connector.fetch();
      expect(result.items).toHaveLength(2);
      expect(result.metadata?.itemCount).toBe(2);
    });

    it('reports unhealthy in health() check when token is expired', async () => {
      connector.setStatusForTesting('expired');
      const health = await connector.health();
      expect(health.healthy).toBe(false);
      expect(health.status).toBe('expired');
      expect(health.message).toContain('expired');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Malformed Provider Response Tests
  // ---------------------------------------------------------------------------

  describe('Malformed Provider Responses', () => {
    beforeEach(async () => {
      await connector.connect(validConfig);
    });

    it('throws MALFORMED_RESPONSE when API returns non-array items', async () => {
      connector.setCustomFetchHandler(async () => ({
        kind: 'calendar#events',
        items: 'corrupted_items_not_an_array',
      }));

      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
      try {
        await connector.fetch();
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectorError);
        expect((err as ConnectorError).code).toBe('MALFORMED_RESPONSE');
      }
    });

    it('throws MALFORMED_RESPONSE when event has invalid dates (missing start/end)', async () => {
      connector.setCustomFetchHandler(async () => ({
        kind: 'calendar#events',
        items: [
          {
            id: 'evt-broken',
            summary: 'Broken event',
            start: {}, // Missing both dateTime and date
            end: {},
          },
        ],
      }));

      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
      try {
        await connector.fetch();
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectorError);
        expect((err as ConnectorError).code).toBe('MALFORMED_RESPONSE');
      }
    });

    it('throws MALFORMED_RESPONSE when API returns a primitive instead of JSON object', async () => {
      connector.setCustomFetchHandler(async () => 'unexpected string response');

      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
      try {
        await connector.fetch();
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectorError);
        expect((err as ConnectorError).code).toBe('MALFORMED_RESPONSE');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Timezone & Normalization Tests
  // ---------------------------------------------------------------------------

  describe('Timezone & Event Normalization', () => {
    const baseRaw: RawCalendarData = {
      calendarId: 'primary',
      timeZone: 'UTC',
      fetchedAt: '2026-09-19T00:00:00.000Z',
      events: [
        {
          id: 'e-all-day',
          summary: 'All Day Planning',
          start: { date: '2026-09-19' },
          end: { date: '2026-09-20' },
        },
        {
          id: 'e-timed-utc',
          summary: 'UTC Sync',
          start: { dateTime: '2026-09-19T14:00:00Z' },
          end: { dateTime: '2026-09-19T15:00:00Z' },
        },
        {
          id: 'e-timed-ny',
          summary: 'New York Call',
          start: { dateTime: '2026-09-19T10:00:00-04:00' }, // 14:00:00Z
          end: { dateTime: '2026-09-19T11:00:00-04:00' },   // 15:00:00Z
        },
        {
          id: 'e-future',
          summary: 'Next Week Review',
          start: { dateTime: '2026-09-25T10:00:00Z' },
          end: { dateTime: '2026-09-25T11:00:00Z' },
        },
      ],
    };

    it('correctly normalizes all-day events with isAllDay: true and day bounds', () => {
      const allDayEvent = baseRaw.events[0];
      const bounds = parseEventTimeBounds(allDayEvent, 'UTC');

      expect(bounds.isAllDay).toBe(true);
      expect(bounds.startAt).toBe('2026-09-19T00:00:00.000Z');
      expect(bounds.endAt).toBe('2026-09-19T23:59:59.999Z');
    });

    it('normalizes timed events with timezone offsets into standard UTC ISO strings', () => {
      const nyEvent = baseRaw.events[2];
      const bounds = parseEventTimeBounds(nyEvent, 'America/New_York');

      expect(bounds.isAllDay).toBe(false);
      // 10:00:00-04:00 in UTC is 14:00:00Z
      expect(bounds.startAt).toBe('2026-09-19T14:00:00.000Z');
      expect(bounds.endAt).toBe('2026-09-19T15:00:00.000Z');
    });

    it('correctly tags next event, today events, and upcoming events', () => {
      // Set reference date to 2026-09-19T12:00:00Z
      const refDate = new Date('2026-09-19T12:00:00.000Z');
      const items = normaliseGCalEvents(baseRaw, validConfig, refDate);

      expect(items).toHaveLength(4);

      // Verify today's events helper
      const todayEvents = getTodayEvents(items);
      expect(todayEvents.length).toBeGreaterThanOrEqual(2);
      expect(todayEvents.some((e) => 'title' in e && e.title === 'All Day Planning')).toBe(true);

      // Verify next event helper (first event starting after or ongoing at refDate)
      const next = getNextEvent(items);
      expect(next).not.toBeNull();
      if (next && 'title' in next) {
        expect(next.title).toBe('All Day Planning'); // Ongoing full day
      }
      expect(next?.meta?.isNext).toBe(true);

      // Verify upcoming events helper
      const upcoming = getUpcomingEvents(items);
      expect(upcoming.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Caching & Stale Fallback Tests
  // ---------------------------------------------------------------------------

  describe('Caching & Fallback', () => {
    it('serves fresh data from cache on subsequent fetch without network call', async () => {
      let callCount = 0;
      connector.setCustomFetchHandler(async () => {
        callCount++;
        return sampleRawGCalResponse;
      });

      await connector.connect(validConfig);

      // Fetch 1
      const res1 = await connector.fetch();
      expect(res1.items).toHaveLength(2);
      expect(callCount).toBe(1);

      // Fetch 2 (Fresh cache hit)
      const res2 = await connector.fetch();
      expect(res2.items).toHaveLength(2);
      expect(callCount).toBe(1); // Did not call API again
    });

    it('falls back to stale cache if API call fails', async () => {
      let shouldFail = false;
      connector.setCustomFetchHandler(async () => {
        if (shouldFail) {
          throw new Error('500 Internal Server Error');
        }
        return sampleRawGCalResponse;
      });

      await connector.connect(validConfig);

      // Fetch 1 (Populates cache)
      const res1 = await connector.fetch();
      expect(res1.items).toHaveLength(2);

      // Trigger failure & force refresh
      shouldFail = true;
      const res2 = await connector.refresh();
      // Should gracefully return cached data rather than crashing
      expect(res2.items).toHaveLength(2);
    });

    it('records and returns last sync time', async () => {
      connector.setCustomFetchHandler(async () => sampleRawGCalResponse);
      await connector.connect(validConfig);

      expect(connector.getLastSyncTime()).toBeNull();
      await connector.fetch();
      expect(connector.getLastSyncTime()).not.toBeNull();
    });
  });
});
