/**
 * src/query/__tests__/queryEngine.test.ts
 *
 * Unit tests for Declarative Widget Query & Data Engine.
 * Verifies:
 * - Query parsing & Zod schema validation
 * - Connector finding and routing
 * - Transformations:
 *   - calendar.next_event
 *   - calendar.today
 *   - tasks.today
 *   - tasks.incomplete
 *   - weather.current
 *   - rss.latest
 * - Caching (hit, miss, forceRefresh, invalidation, TTL)
 * - Error handling and renderer isolation
 */

import {
  parseWidgetQuery,
  WidgetQueryEngine,
  QueryCache,
  applyQueryTransformation,
} from '../queryEngine';
import { WidgetQueryError } from '../query.types';
import { UniversalItem } from '@/widgets/schema';
import * as connectorService from '@/services/connectorService';

describe('Widget Query Engine', () => {
  let engine: WidgetQueryEngine;
  let testCache: QueryCache;

  beforeEach(() => {
    testCache = new QueryCache();
    engine = new WidgetQueryEngine(testCache);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Parsing & Validation Tests
  // ---------------------------------------------------------------------------

  describe('Query Parsing & Validation', () => {
    it('successfully parses valid declarative queries', () => {
      const q1 = parseWidgetQuery('calendar.next_event');
      expect(q1.domain).toBe('calendar');
      expect(q1.selector).toBe('next_event');

      const q2 = parseWidgetQuery('calendar.today');
      expect(q2.domain).toBe('calendar');
      expect(q2.selector).toBe('today');

      const q3 = parseWidgetQuery('tasks.today');
      expect(q3.domain).toBe('tasks');
      expect(q3.selector).toBe('today');

      const q4 = parseWidgetQuery('tasks.incomplete');
      expect(q4.domain).toBe('tasks');
      expect(q4.selector).toBe('incomplete');

      const q5 = parseWidgetQuery('weather.current');
      expect(q5.domain).toBe('weather');
      expect(q5.selector).toBe('current');

      const q6 = parseWidgetQuery('rss.latest');
      expect(q6.domain).toBe('rss');
      expect(q6.selector).toBe('latest');
    });

    it('throws INVALID_QUERY_SYNTAX on missing dot or invalid format', () => {
      expect(() => parseWidgetQuery('weather')).toThrow(WidgetQueryError);
      expect(() => parseWidgetQuery('weather-current')).toThrow(WidgetQueryError);
      expect(() => parseWidgetQuery('')).toThrow(WidgetQueryError);
      expect(() => parseWidgetQuery('a.b.c')).toThrow(WidgetQueryError);

      try {
        parseWidgetQuery('weather');
      } catch (err: any) {
        expect(err.code).toBe('INVALID_QUERY_SYNTAX');
      }
    });

    it('throws UNSUPPORTED_DOMAIN on unknown domain namespace', () => {
      expect(() => parseWidgetQuery('stocks.apple')).toThrow(WidgetQueryError);
      try {
        parseWidgetQuery('stocks.apple');
      } catch (err: any) {
        expect(err.code).toBe('UNSUPPORTED_DOMAIN');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Data Transformations
  // ---------------------------------------------------------------------------

  describe('Query Transformations', () => {
    const mockCalendarItems: UniversalItem[] = [
      {
        id: 'cal-1',
        provider: 'google_calendar',
        type: 'calendar_event',
        title: 'Morning Meeting',
        startAt: '2026-10-02T09:00:00.000Z',
        endAt: '2026-10-02T10:00:00.000Z',
        isAllDay: false,
        updatedAt: '2026-10-02T08:00:00.000Z',
        meta: { isToday: true, isUpcoming: true, isNext: true },
      },
      {
        id: 'cal-2',
        provider: 'google_calendar',
        type: 'calendar_event',
        title: 'Afternoon Workshop',
        startAt: '2026-10-02T14:00:00.000Z',
        endAt: '2026-10-02T16:00:00.000Z',
        isAllDay: false,
        updatedAt: '2026-10-02T08:00:00.000Z',
        meta: { isToday: true, isUpcoming: true, isNext: false },
      },
    ];

    const mockTaskItems: UniversalItem[] = [
      {
        id: 'task-1',
        provider: 'todoist',
        type: 'task',
        title: 'Draft proposal',
        status: 'pending',
        dueDate: '2026-10-02T00:00:00.000Z',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
      {
        id: 'task-2',
        provider: 'todoist',
        type: 'task',
        title: 'Submit report',
        status: 'completed',
        dueDate: '2026-10-02T00:00:00.000Z',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
      {
        id: 'task-3',
        provider: 'todoist',
        type: 'task',
        title: 'Future planning',
        status: 'pending',
        dueDate: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
    ];

    const mockWeatherItems: UniversalItem[] = [
      {
        id: 'w-1',
        provider: 'weather',
        type: 'weather',
        temp: 22,
        condition: 'Clear sky',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
    ];

    const mockRssItems: UniversalItem[] = [
      {
        id: 'rss-1',
        provider: 'rss',
        type: 'article',
        title: 'Older Post',
        url: 'https://news.com/1',
        publishedAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 'rss-2',
        provider: 'rss',
        type: 'article',
        title: 'Newer Post',
        url: 'https://news.com/2',
        publishedAt: '2026-10-02T12:00:00.000Z',
        updatedAt: '2026-10-02T12:00:00.000Z',
      },
    ];

    it('calendar.next_event returns the single next upcoming event', () => {
      const result = applyQueryTransformation('calendar', 'next_event', mockCalendarItems);
      expect(result).not.toBeNull();
      expect((result as UniversalItem).id).toBe('cal-1');
    });

    it('calendar.today returns all events occurring today', () => {
      const result = applyQueryTransformation('calendar', 'today', mockCalendarItems) as UniversalItem[];
      expect(result).toHaveLength(2);
    });

    it('tasks.today returns tasks scheduled for today', () => {
      const refDate = new Date('2026-10-02T12:00:00Z');
      const result = applyQueryTransformation('tasks', 'today', mockTaskItems, {
        referenceDate: refDate,
      }) as UniversalItem[];
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['task-1', 'task-2']);
    });

    it('tasks.incomplete returns only pending tasks', () => {
      const result = applyQueryTransformation('tasks', 'incomplete', mockTaskItems) as UniversalItem[];
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.type === 'task' && t.status === 'pending')).toBe(true);
    });

    it('weather.current returns current weather item', () => {
      const result = applyQueryTransformation('weather', 'current', mockWeatherItems) as UniversalItem;
      expect(result).not.toBeNull();
      expect(result.type).toBe('weather');
      if (result.type === 'weather') {
        expect(result.temp).toBe(22);
        expect(result.condition).toBe('Clear sky');
      }
    });

    it('rss.latest returns articles sorted chronologically descending', () => {
      const result = applyQueryTransformation('rss', 'latest', mockRssItems) as UniversalItem[];
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('rss-2'); // Newer post first
      expect(result[1].id).toBe('rss-1');
    });

    it('applies limit option correctly to list results', () => {
      const result = applyQueryTransformation('tasks', 'incomplete', mockTaskItems, {
        limit: 1,
      }) as UniversalItem[];
      expect(result).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Execution, Caching & Routing Tests
  // ---------------------------------------------------------------------------

  describe('Engine Execution & Caching', () => {
    it('routes query to connectorService, transforms, and populates cache', async () => {
      const mockItems: UniversalItem[] = [
        {
          id: 'w-1',
          provider: 'weather',
          type: 'weather',
          temp: 20,
          condition: 'Sunny',
          updatedAt: new Date().toISOString(),
        },
      ];

      const fetchSpy = jest
        .spyOn(connectorService, 'fetchNormalisedData')
        .mockResolvedValue(mockItems);

      // Fetch 1: Cache Miss
      const res1 = await engine.execute('weather.current');
      expect(fetchSpy).toHaveBeenCalledWith('weather', expect.any(Object), undefined);
      expect(res1.status).toBe('success');
      expect(res1.isCached).toBe(false);
      expect(res1.data).toEqual(mockItems[0]);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Fetch 2: Cache Hit
      const res2 = await engine.execute('weather.current');
      expect(res2.isCached).toBe(true);
      expect(res2.data).toEqual(mockItems[0]);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // Not called again!

      fetchSpy.mockRestore();
    });

    it('forceRefresh option bypasses cache', async () => {
      const mockItems: UniversalItem[] = [
        {
          id: 't-1',
          provider: 'todoist',
          type: 'task',
          title: 'Do task',
          status: 'pending',
          updatedAt: new Date().toISOString(),
        },
      ];

      const fetchSpy = jest
        .spyOn(connectorService, 'fetchNormalisedData')
        .mockResolvedValue(mockItems);

      await engine.execute('tasks.incomplete');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Force refresh
      const refreshed = await engine.execute('tasks.incomplete', { forceRefresh: true });
      expect(refreshed.isCached).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      fetchSpy.mockRestore();
    });

    it('invalidateCache removes cached entry', async () => {
      const mockItems: UniversalItem[] = [
        {
          id: 'cal-1',
          provider: 'calendar',
          type: 'calendar_event',
          title: 'Event',
          startAt: new Date().toISOString(),
          endAt: new Date().toISOString(),
          isAllDay: false,
          updatedAt: new Date().toISOString(),
          meta: { isNext: true },
        },
      ];

      const fetchSpy = jest
        .spyOn(connectorService, 'fetchNormalisedData')
        .mockResolvedValue(mockItems);

      await engine.execute('calendar.next_event');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      engine.invalidateCache('calendar');

      await engine.execute('calendar.next_event');
      expect(fetchSpy).toHaveBeenCalledTimes(2); // Called again after invalidation

      fetchSpy.mockRestore();
    });

    it('cache expires after ttlMs', async () => {
      testCache.set('test.key', { foo: 'bar' }, 50); // 50ms TTL
      expect(testCache.get('test.key')).toEqual({ foo: 'bar' });

      // Wait 60ms
      await new Promise((r) => setTimeout(r, 60));
      expect(testCache.get('test.key')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Error Handling
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {
    it('wraps connector fetch failure into WidgetQueryError', async () => {
      const fetchSpy = jest
        .spyOn(connectorService, 'fetchNormalisedData')
        .mockRejectedValue(new Error('Network connection timeout'));

      await expect(engine.execute('rss.latest')).rejects.toThrow(WidgetQueryError);

      try {
        await engine.execute('rss.latest');
      } catch (err: any) {
        expect(err).toBeInstanceOf(WidgetQueryError);
        expect(err.code).toBe('FETCH_FAILED');
        expect(err.message).toContain('Network connection timeout');
      }

      fetchSpy.mockRestore();
    });
  });
});
