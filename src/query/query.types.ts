/**
 * src/query/query.types.ts
 *
 * Types and Zod schemas for the declarative Widget Query Engine.
 * Allows widget components to request data declaratively (e.g. 'calendar.next_event', 'tasks.today').
 */

import { z } from 'zod';
import { UniversalItem } from '@/widgets/schema';

// ---------------------------------------------------------------------------
// Supported Domains & Selectors
// ---------------------------------------------------------------------------

export const QueryDomainSchema = z.enum([
  'calendar',
  'tasks',
  'weather',
  'rss',
]);

export type QueryDomain = z.infer<typeof QueryDomainSchema>;

export const QuerySelectorSchema = z.enum([
  // Calendar selectors
  'next_event',
  'today',
  'upcoming',
  // Tasks selectors
  'incomplete',
  'completed',
  'all',
  // Weather selectors
  'current',
  'forecast',
  // RSS selectors
  'latest',
]);

export type QuerySelector = z.infer<typeof QuerySelectorSchema>;

/**
 * Standard declarative query strings matching <domain>.<selector>.
 * Examples: 'calendar.next_event', 'calendar.today', 'tasks.today', 'tasks.incomplete', 'weather.current', 'rss.latest'
 */
export const WidgetQueryStringSchema = z
  .string()
  .min(3)
  .regex(/^[a-z_]+\.[a-z_]+$/, 'Query must be formatted as "<domain>.<selector>"');

export const ParsedQuerySchema = z.object({
  raw: z.string(),
  domain: QueryDomainSchema,
  selector: z.string(),
});

export type ParsedWidgetQuery = z.infer<typeof ParsedQuerySchema>;

// ---------------------------------------------------------------------------
// Query Options & Result
// ---------------------------------------------------------------------------

export const WidgetQueryOptionsSchema = z.object({
  /** Custom connector config override (if omitted, default active config is used) */
  config: z.unknown().optional(),
  /** Specific connector parameters */
  params: z.record(z.string(), z.unknown()).optional(),
  /** Max items to return for list queries */
  limit: z.number().int().positive().optional(),
  /** Force network refetch bypassing cache */
  forceRefresh: z.boolean().optional(),
  /** Custom cache TTL in milliseconds */
  ttlMs: z.number().int().positive().optional(),
  /** Reference date for today/upcoming calculations */
  referenceDate: z.date().optional(),
});

export type WidgetQueryOptions = z.infer<typeof WidgetQueryOptionsSchema>;

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface WidgetQueryResult<T = UniversalItem | UniversalItem[] | null> {
  data: T;
  query: string;
  status: QueryStatus;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isCached: boolean;
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// Query Engine Error
// ---------------------------------------------------------------------------

export class WidgetQueryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_QUERY_SYNTAX'
      | 'UNSUPPORTED_DOMAIN'
      | 'UNSUPPORTED_SELECTOR'
      | 'CONNECTOR_NOT_FOUND'
      | 'FETCH_FAILED',
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'WidgetQueryError';
  }
}
