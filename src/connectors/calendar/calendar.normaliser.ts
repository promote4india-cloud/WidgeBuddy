/**
 * src/connectors/calendar/calendar.normaliser.ts
 *
 * Pure normaliser functions for Google Calendar events.
 * No network calls, no side-effects.
 *
 * Requirements:
 * - Normalizes events into UniversalItem (CalendarEventItem)
 * - Supports: next event, today's events, upcoming events
 * - Handles timezone correctly (timed events with offsets, all-day events)
 */

import { UniversalItem } from '@/widgets/schema';
import { RawCalendarData, CalendarConfig, GCalEvent } from './calendar.types';

/**
 * Returns the date string (YYYY-MM-DD) for a given timestamp in a specified timezone.
 */
export function getDateStringInTimeZone(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // 'YYYY-MM-DD'
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Parses and converts Google Calendar start/end objects into standard UTC ISO-8601 strings.
 */
export function parseEventTimeBounds(
  event: GCalEvent,
  timeZone: string,
): { startAt: string; endAt: string; isAllDay: boolean } {
  const isAllDay = !event.start.dateTime && Boolean(event.start.date);

  if (isAllDay && event.start.date) {
    // All-day event: start.date is 'YYYY-MM-DD', end.date is exclusive 'YYYY-MM-DD'
    const startDateStr = event.start.date;
    const endDateStr = event.end.date || event.start.date;

    // Build ISO timestamps for full day bounds
    const startAt = new Date(`${startDateStr}T00:00:00.000Z`).toISOString();
    
    // In GCal, single-day all-day events have end.date as next day.
    // If endDateStr > startDateStr, end bound is 23:59:59 of previous day.
    let endAt: string;
    if (endDateStr > startDateStr) {
      const endD = new Date(`${endDateStr}T00:00:00.000Z`);
      endD.setMilliseconds(endD.getMilliseconds() - 1);
      endAt = endD.toISOString();
    } else {
      endAt = new Date(`${endDateStr}T23:59:59.999Z`).toISOString();
    }

    return { startAt, endAt, isAllDay: true };
  }

  // Timed event: parse dateTime with timezone offset
  const startRaw = event.start.dateTime || `${event.start.date}T00:00:00Z`;
  const endRaw = event.end.dateTime || event.start.dateTime || `${event.start.date}T01:00:00Z`;

  const startAt = new Date(startRaw).toISOString();
  const endAt = new Date(endRaw).toISOString();

  return { startAt, endAt, isAllDay: false };
}

/**
 * Pure function: Transforms RawCalendarData into an array of UniversalItem (calendar_event).
 */
export function normaliseGCalEvents(
  raw: RawCalendarData,
  config: CalendarConfig,
  referenceDate: Date = new Date(),
): UniversalItem[] {
  const targetTimeZone = config.timeZone || raw.timeZone || 'UTC';
  const todayStr = getDateStringInTimeZone(referenceDate, targetTimeZone);
  const nowMs = referenceDate.getTime();

  // 1. Map each raw GCal event to a UniversalItem
  const items: UniversalItem[] = raw.events
    .filter((e) => e.status !== 'cancelled')
    .map((event) => {
      const { startAt, endAt, isAllDay } = parseEventTimeBounds(event, targetTimeZone);
      const startMs = new Date(startAt).getTime();
      const endMs = new Date(endAt).getTime();

      // Check if event occurs today in target timezone
      const eventStartDateStr = getDateStringInTimeZone(new Date(startAt), targetTimeZone);
      const eventEndDateStr = getDateStringInTimeZone(new Date(endAt), targetTimeZone);
      const isToday =
        eventStartDateStr === todayStr ||
        eventEndDateStr === todayStr ||
        (eventStartDateStr <= todayStr && eventEndDateStr >= todayStr);

      // Event is upcoming if it has not finished yet
      const isUpcoming = endMs >= nowMs;

      const attendees = event.attendees
        ?.map((a) => a.email)
        .filter((email): email is string => Boolean(email));

      const updatedAt = event.updated
        ? new Date(event.updated).toISOString()
        : raw.fetchedAt;

      return {
        id: event.id,
        provider: 'google_calendar',
        type: 'calendar_event',
        title: event.summary || 'Untitled Event',
        startAt,
        endAt,
        isAllDay,
        location: event.location,
        attendees,
        updatedAt,
        meta: {
          calendarId: raw.calendarId,
          calendarTitle: raw.calendarTitle,
          description: event.description,
          htmlLink: event.htmlLink,
          organizerEmail: event.organizer?.email,
          timeZone: targetTimeZone,
          isToday,
          isUpcoming,
          isNext: false, // Flagged below
        },
      };
    });

  // 2. Sort chronologically by startAt ascending
  items.sort((a, b) => {
    const timeA = a.type === 'calendar_event' && a.startAt ? new Date(a.startAt).getTime() : 0;
    const timeB = b.type === 'calendar_event' && b.startAt ? new Date(b.startAt).getTime() : 0;
    return timeA - timeB;
  });

  // 3. Mark the single earliest upcoming event as isNext
  const nextItem = items.find((item) => {
    if (item.type !== 'calendar_event' || !item.endAt) return false;
    const endMs = new Date(item.endAt).getTime();
    return endMs >= nowMs;
  });

  if (nextItem && nextItem.meta) {
    nextItem.meta.isNext = true;
  }

  return items;
}

// ---------------------------------------------------------------------------
// Query / Filter Helpers for Widgets
// ---------------------------------------------------------------------------

/**
 * Returns the single next upcoming event, or null if none exist.
 */
export function getNextEvent(items: UniversalItem[]): UniversalItem | null {
  return items.find((i) => i.type === 'calendar_event' && i.meta?.isNext) || null;
}

/**
 * Returns all events taking place today.
 */
export function getTodayEvents(items: UniversalItem[]): UniversalItem[] {
  return items.filter((i) => i.type === 'calendar_event' && i.meta?.isToday);
}

/**
 * Returns all upcoming events sorted chronologically into the future.
 */
export function getUpcomingEvents(items: UniversalItem[]): UniversalItem[] {
  return items.filter((i) => i.type === 'calendar_event' && i.meta?.isUpcoming);
}
