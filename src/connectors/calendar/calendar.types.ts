/**
 * src/connectors/calendar/calendar.types.ts
 *
 * Strict Zod schemas and internal types for Google Calendar integration.
 * Raw Google Calendar API shapes are isolated here and NEVER escape to widgets.
 */

import { z } from 'zod';
import { UniversalItem } from '@/widgets/schema';

// ---------------------------------------------------------------------------
// Google Calendar API Response Schemas (Layer 1 Internal)
// ---------------------------------------------------------------------------

export const GCalDateTimeSchema = z
  .object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  })
  .refine((val) => Boolean(val.dateTime || val.date), {
    message: 'Either dateTime or date must be provided in Google Calendar date object',
  });

export type GCalDateTime = z.infer<typeof GCalDateTimeSchema>;

export const GCalAttendeeSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  responseStatus: z.string().optional(),
  self: z.boolean().optional(),
});

export type GCalAttendee = z.infer<typeof GCalAttendeeSchema>;

export const GCalEventSchema = z.object({
  id: z.string().min(1),
  summary: z.string().optional().default('Untitled Event'),
  description: z.string().optional(),
  location: z.string().optional(),
  start: GCalDateTimeSchema,
  end: GCalDateTimeSchema,
  status: z.string().optional(),
  htmlLink: z.string().url().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
  attendees: z.array(GCalAttendeeSchema).optional(),
  organizer: z
    .object({
      email: z.string().optional(),
      displayName: z.string().optional(),
      self: z.boolean().optional(),
    })
    .optional(),
});

export type GCalEvent = z.infer<typeof GCalEventSchema>;

export const GCalEventsResponseSchema = z.object({
  kind: z.string().optional(),
  etag: z.string().optional(),
  summary: z.string().optional(),
  timeZone: z.string().optional(),
  updated: z.string().optional(),
  items: z.array(GCalEventSchema),
  nextPageToken: z.string().optional(),
});

export type GCalEventsResponse = z.infer<typeof GCalEventsResponseSchema>;

// ---------------------------------------------------------------------------
// Connector Configuration Schema
// ---------------------------------------------------------------------------

export const CalendarConfigSchema = z.object({
  /** Google Calendar ID, e.g. 'primary' or specific calendar email */
  calendarId: z.string().default('primary'),
  /** Target timezone for calculations and day boundaries (e.g. 'America/New_York', 'UTC') */
  timeZone: z.string().optional(),
  /** Maximum number of events to fetch */
  maxResults: z.number().int().min(1).max(250).default(50),
  /** Expand recurring events into single instances */
  singleEvents: z.boolean().default(true),
  /** Order results by startTime */
  orderBy: z.enum(['startTime', 'updated']).default('startTime'),
  /** Lower bound for event end times (ISO string) */
  timeMin: z.string().optional(),
  /** Upper bound for event start times (ISO string) */
  timeMax: z.string().optional(),
  /** OAuth 2.0 access token */
  accessToken: z.string().optional(),
  /** OAuth 2.0 refresh token */
  refreshToken: z.string().optional(),
  /** Expiration timestamp in milliseconds since epoch */
  tokenExpiresAt: z.number().optional(),
  /** User email associated with the connected account */
  accountEmail: z.string().optional(),
});

export type CalendarConfigInput = z.input<typeof CalendarConfigSchema>;
export type CalendarConfig = z.infer<typeof CalendarConfigSchema>;

// ---------------------------------------------------------------------------
// Internal Raw Calendar Data Container
// ---------------------------------------------------------------------------

export interface RawCalendarData {
  calendarId: string;
  timeZone: string;
  calendarTitle?: string;
  events: GCalEvent[];
  fetchedAt: string;
  isStale?: boolean;
}

// ---------------------------------------------------------------------------
// Extended Meta for Calendar UniversalItems
// ---------------------------------------------------------------------------

export interface CalendarEventMeta extends Record<string, unknown> {
  calendarId: string;
  isNext?: boolean;
  isToday?: boolean;
  isUpcoming?: boolean;
  timeZone?: string;
  description?: string;
  htmlLink?: string;
  organizerEmail?: string;
}
