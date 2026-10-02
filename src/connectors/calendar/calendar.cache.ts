/**
 * src/connectors/calendar/calendar.cache.ts
 *
 * In-memory and persistent cache for Google Calendar data.
 * Supports fresh TTL (2 minutes) and stale data fallback (up to 12 hours).
 */

export interface CalendarCacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CalendarCacheLookupResult<T> {
  data: T;
  cachedAt: string;
  ageMs: number;
  isStale: boolean;
}

export class CalendarCache<T = unknown> {
  private cache = new Map<string, CalendarCacheEntry<T>>();

  /** Default fresh time: 2 minutes */
  private readonly defaultFreshMs: number = 2 * 60 * 1000;
  /** Max stale retention time: 12 hours */
  private readonly maxStaleMs: number = 12 * 60 * 60 * 1000;

  constructor(freshMs?: number, maxStaleMs?: number) {
    if (freshMs !== undefined) this.defaultFreshMs = freshMs;
    if (maxStaleMs !== undefined) this.maxStaleMs = maxStaleMs;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string, allowStale = true): CalendarCacheLookupResult<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ageMs = Date.now() - entry.timestamp;

    if (ageMs <= this.defaultFreshMs) {
      return {
        data: entry.data,
        cachedAt: new Date(entry.timestamp).toISOString(),
        ageMs,
        isStale: false,
      };
    }

    if (allowStale && ageMs <= this.maxStaleMs) {
      return {
        data: entry.data,
        cachedAt: new Date(entry.timestamp).toISOString(),
        ageMs,
        isStale: true,
      };
    }

    // Beyond max stale retention
    this.cache.delete(key);
    return null;
  }

  isFresh(key: string): boolean {
    const res = this.get(key, false);
    return res !== null && !res.isStale;
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  inspect(): Array<{
    key: string;
    cachedAt: string;
    ageSeconds: number;
    isFresh: boolean;
    isStale: boolean;
  }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => {
      const ageMs = now - entry.timestamp;
      const isFresh = ageMs <= this.defaultFreshMs;
      const isStale = ageMs > this.defaultFreshMs && ageMs <= this.maxStaleMs;
      return {
        key,
        cachedAt: new Date(entry.timestamp).toISOString(),
        ageSeconds: Math.floor(ageMs / 1000),
        isFresh,
        isStale,
      };
    });
  }
}

export const calendarCache = new CalendarCache();
