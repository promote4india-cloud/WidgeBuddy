/**
 * src/connectors/weather/weather.cache.ts
 *
 * In-memory and persistent cache for weather data.
 * Supports fresh TTL (10 minutes) and stale data fallback (up to 24 hours).
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheLookupResult<T> {
  data: T;
  cachedAt: string;
  ageMs: number;
  isStale: boolean;
}

export class WeatherCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();

  /** Default fresh time: 10 minutes */
  private readonly defaultFreshMs: number = 10 * 60 * 1000;
  /** Max stale retention time: 24 hours */
  private readonly maxStaleMs: number = 24 * 60 * 60 * 1000;

  constructor(freshMs?: number, maxStaleMs?: number) {
    if (freshMs !== undefined) this.defaultFreshMs = freshMs;
    if (maxStaleMs !== undefined) this.maxStaleMs = maxStaleMs;
  }

  /**
   * Set cached item.
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Look up an item.
   * If age <= freshMs: returns data with isStale: false.
   * If age > freshMs and age <= maxStaleMs: returns data with isStale: true (stale fallback).
   * If age > maxStaleMs or missing: returns null.
   */
  get(key: string, allowStale = true): CacheLookupResult<T> | null {
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

    // Expired beyond max stale allowance
    this.cache.delete(key);
    return null;
  }

  /**
   * Check if a valid fresh entry exists.
   */
  isFresh(key: string): boolean {
    const res = this.get(key, false);
    return res !== null && !res.isStale;
  }

  /**
   * Invalidate a key or clear the whole cache.
   */
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Inspect cache state (for debug/preview screen).
   */
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

/** Global default weather cache */
export const weatherCache = new WeatherCache();
