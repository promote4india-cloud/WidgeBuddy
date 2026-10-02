/**
 * src/query/queryEngine.ts
 *
 * Lightweight Declarative Widget Data & Query Engine.
 *
 * Resolves declarative queries like:
 * - 'calendar.next_event'
 * - 'calendar.today'
 * - 'tasks.today'
 * - 'tasks.incomplete'
 * - 'weather.current'
 * - 'rss.latest'
 *
 * Requirements:
 * 1. Parse and validate queries with Zod.
 * 2. Find the appropriate connector/data source without exposing connector logic to widgets.
 * 3. Fetch or retrieve cached normalized data.
 * 4. Apply transformations.
 * 5. Return standardized results with loading & error state support.
 */

import { UniversalItem } from '@/widgets/schema';
import { fetchNormalisedData, getConnectorStaleTime } from '@/services/connectorService';
import { getNextEvent, getTodayEvents, getUpcomingEvents } from '@/connectors/calendar/calendar.normaliser';
import { getTodayTasks, getIncompleteTasks, getCompletedTasks } from '@/connectors/tasks/tasks.connector';
import { getLatestArticles } from '@/connectors/rss/rss.connector';
import {
  QueryDomain,
  QueryDomainSchema,
  ParsedWidgetQuery,
  WidgetQueryStringSchema,
  WidgetQueryOptions,
  WidgetQueryResult,
  WidgetQueryError,
} from './query.types';

// ---------------------------------------------------------------------------
// In-Memory Query Cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ---------------------------------------------------------------------------
// Domain Default Configurations
// ---------------------------------------------------------------------------

const DOMAIN_DEFAULTS: Record<QueryDomain, { connectorType: string; defaultConfig: unknown; defaultTtlMs: number }> = {
  calendar: {
    connectorType: 'calendar',
    defaultConfig: { calendarId: 'primary', timeZone: 'UTC' },
    defaultTtlMs: 2 * 60 * 1000, // 2 minutes
  },
  tasks: {
    connectorType: 'todoist',
    defaultConfig: { apiToken: 'simulated_todoist_token' },
    defaultTtlMs: 30 * 1000, // 30 seconds
  },
  weather: {
    connectorType: 'weather',
    defaultConfig: { city: 'New York', units: 'celsius', useCurrentLocation: false },
    defaultTtlMs: 10 * 60 * 1000, // 10 minutes
  },
  rss: {
    connectorType: 'rss',
    defaultConfig: { feedUrl: 'https://news.ycombinator.com/rss' },
    defaultTtlMs: 15 * 60 * 1000, // 15 minutes
  },
};

// ---------------------------------------------------------------------------
// Query Parser & Validator
// ---------------------------------------------------------------------------

export function parseWidgetQuery(queryStr: string): ParsedWidgetQuery {
  const parsedStr = WidgetQueryStringSchema.safeParse(queryStr);
  if (!parsedStr.success) {
    throw new WidgetQueryError(
      `Invalid query syntax "${queryStr}". Queries must follow the format "<domain>.<selector>" (e.g. "calendar.today").`,
      'INVALID_QUERY_SYNTAX',
      parsedStr.error,
    );
  }

  const [rawDomain, rawSelector] = queryStr.split('.');

  const domainResult = QueryDomainSchema.safeParse(rawDomain);
  if (!domainResult.success) {
    throw new WidgetQueryError(
      `Unsupported domain "${rawDomain}". Supported domains: calendar, tasks, weather, rss.`,
      'UNSUPPORTED_DOMAIN',
    );
  }

  if (!rawSelector || rawSelector.trim().length === 0) {
    throw new WidgetQueryError(
      `Missing selector in query "${queryStr}".`,
      'UNSUPPORTED_SELECTOR',
    );
  }

  return {
    raw: queryStr,
    domain: domainResult.data,
    selector: rawSelector,
  };
}

// ---------------------------------------------------------------------------
// Transformation Engine
// ---------------------------------------------------------------------------

export function applyQueryTransformation(
  domain: QueryDomain,
  selector: string,
  items: UniversalItem[],
  options?: WidgetQueryOptions,
): UniversalItem | UniversalItem[] | null {
  const limit = options?.limit;

  switch (domain) {
    case 'calendar': {
      if (selector === 'next_event') {
        return getNextEvent(items);
      }
      if (selector === 'today') {
        const result = getTodayEvents(items);
        return limit ? result.slice(0, limit) : result;
      }
      if (selector === 'upcoming') {
        const result = getUpcomingEvents(items);
        return limit ? result.slice(0, limit) : result;
      }
      const allEvents = items.filter((i) => i.type === 'calendar_event');
      return limit ? allEvents.slice(0, limit) : allEvents;
    }

    case 'tasks': {
      if (selector === 'today') {
        const result = getTodayTasks(items, options?.referenceDate);
        return limit ? result.slice(0, limit) : result;
      }
      if (selector === 'incomplete') {
        const result = getIncompleteTasks(items);
        return limit ? result.slice(0, limit) : result;
      }
      if (selector === 'completed') {
        const result = getCompletedTasks(items);
        return limit ? result.slice(0, limit) : result;
      }
      const allTasks = items.filter((i) => i.type === 'task');
      return limit ? allTasks.slice(0, limit) : allTasks;
    }

    case 'weather': {
      if (selector === 'current') {
        return items.find((i) => i.type === 'weather') || items[0] || null;
      }
      if (selector === 'forecast') {
        return limit ? items.slice(0, limit) : items;
      }
      return items.find((i) => i.type === 'weather') || items[0] || null;
    }

    case 'rss': {
      if (selector === 'latest') {
        return getLatestArticles(items, limit);
      }
      const allArticles = items.filter((i) => i.type === 'article');
      return limit ? allArticles.slice(0, limit) : allArticles;
    }

    default:
      return limit ? items.slice(0, limit) : items;
  }
}

// ---------------------------------------------------------------------------
// Query Engine Class
// ---------------------------------------------------------------------------

export class WidgetQueryEngine {
  private cache: QueryCache;

  constructor(cache?: QueryCache) {
    this.cache = cache || new QueryCache();
  }

  /**
   * Execute a declarative query and return data formatted for the widget renderer.
   */
  async execute<T = UniversalItem | UniversalItem[] | null>(
    queryStr: string,
    options?: WidgetQueryOptions,
  ): Promise<WidgetQueryResult<T>> {
    const parsed = parseWidgetQuery(queryStr);
    const domainDef = DOMAIN_DEFAULTS[parsed.domain];

    const config = options?.config ?? domainDef.defaultConfig;
    const ttlMs = options?.ttlMs ?? domainDef.defaultTtlMs;

    // Cache key incorporates query, config serialization, and limits
    const cacheKey = `${parsed.raw}:${JSON.stringify(config)}:${options?.limit ?? 'all'}`;

    // 1. Check cache (unless forceRefresh requested)
    if (!options?.forceRefresh) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== null) {
        return {
          data: cached,
          query: queryStr,
          status: 'success',
          isLoading: false,
          isError: false,
          error: null,
          isCached: true,
          fetchedAt: new Date().toISOString(),
        };
      }
    }

    // 2. Fetch normalized data through the connector service
    try {
      const items = await fetchNormalisedData(
        domainDef.connectorType,
        config,
        options?.params,
      );

      // 3. Apply declarative transformation
      const transformed = applyQueryTransformation(
        parsed.domain,
        parsed.selector,
        items,
        options,
      ) as T;

      // 4. Update cache
      this.cache.set(cacheKey, transformed, ttlMs);

      return {
        data: transformed,
        query: queryStr,
        status: 'success',
        isLoading: false,
        isError: false,
        error: null,
        isCached: false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      throw new WidgetQueryError(
        `Query "${queryStr}" failed: ${errorInstance.message}`,
        'FETCH_FAILED',
        errorInstance,
      );
    }
  }

  /**
   * Invalidate cached query results.
   */
  invalidateCache(queryPattern?: string): void {
    this.cache.invalidate(queryPattern);
  }

  /**
   * Clear the entire query cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const widgetQueryEngine = new WidgetQueryEngine();
