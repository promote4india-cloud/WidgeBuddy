/**
 * src/renderer/mockData.ts
 *
 * Mock normalized dataset (UniversalItem[]) for widget previews and tests.
 * The renderer uses this data and NEVER calls external APIs directly.
 */

import { UniversalItem } from '@/widgets/schema';

export const mockUniversalItems: UniversalItem[] = [
  // -------------------------------------------------------------------------
  // Weather
  // -------------------------------------------------------------------------
  {
    id: 'weather-sf',
    provider: 'openweather',
    type: 'weather',
    temp: 21,
    condition: 'Mostly Sunny',
    feelsLike: 20,
    humidity: 64,
    updatedAt: '2026-09-19T14:00:00.000Z',
    meta: {
      location: 'San Francisco, CA',
      windSpeed: '14 km/h',
      uvIndex: '5 Moderate',
      forecast: [
        { day: 'Today', temp: 21, condition: 'Sunny', icon: 'sun' },
        { day: 'Sun', temp: 22, condition: 'Mostly Sunny', icon: 'cloud-sun' },
        { day: 'Mon', temp: 19, condition: 'Partly Cloudy', icon: 'cloud' },
        { day: 'Tue', temp: 18, condition: 'Light Rain', icon: 'cloud-rain' },
        { day: 'Wed', temp: 20, condition: 'Sunny', icon: 'sun' },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Calendar Events
  // -------------------------------------------------------------------------
  {
    id: 'event-1',
    provider: 'google_calendar',
    type: 'calendar_event',
    title: 'Product Sync & Sprint Review',
    startAt: '2026-09-19T10:30:00.000Z',
    endAt: '2026-09-19T11:30:00.000Z',
    isAllDay: false,
    location: 'Conference Room B / Google Meet',
    attendees: ['alice@example.com', 'bob@example.com', 'charlie@example.com'],
    updatedAt: '2026-09-19T08:00:00.000Z',
    meta: { calendarColor: '#3b82f6' },
  },
  {
    id: 'event-2',
    provider: 'google_calendar',
    type: 'calendar_event',
    title: 'Design Review: Widget Dashboard',
    startAt: '2026-09-19T14:00:00.000Z',
    endAt: '2026-09-19T15:00:00.000Z',
    isAllDay: false,
    location: 'Virtual Room #4',
    attendees: ['design-team@example.com'],
    updatedAt: '2026-09-19T08:00:00.000Z',
    meta: { calendarColor: '#10b981' },
  },
  {
    id: 'event-3',
    provider: 'google_calendar',
    type: 'calendar_event',
    title: 'Quarterly OKR Planning',
    startAt: '2026-09-19T16:30:00.000Z',
    endAt: '2026-09-19T17:30:00.000Z',
    isAllDay: false,
    location: 'Executive Boardroom',
    updatedAt: '2026-09-19T08:00:00.000Z',
    meta: { calendarColor: '#8b5cf6' },
  },

  // -------------------------------------------------------------------------
  // Tasks
  // -------------------------------------------------------------------------
  {
    id: 'task-1',
    provider: 'todoist',
    type: 'task',
    title: 'Finalize mobile widget declarative schema',
    status: 'pending',
    dueDate: '2026-09-19T18:00:00.000Z',
    priority: 'high',
    project: 'WidgeBuddy MVP',
    updatedAt: '2026-09-19T09:00:00.000Z',
  },
  {
    id: 'task-2',
    provider: 'todoist',
    type: 'task',
    title: 'Review user feedback on dashboard layout',
    status: 'pending',
    dueDate: '2026-09-19T20:00:00.000Z',
    priority: 'medium',
    project: 'Research',
    updatedAt: '2026-09-19T09:15:00.000Z',
  },
  {
    id: 'task-3',
    provider: 'todoist',
    type: 'task',
    title: 'Write automated unit tests for renderer',
    status: 'pending',
    dueDate: '2026-09-20T12:00:00.000Z',
    priority: 'high',
    project: 'Testing',
    updatedAt: '2026-09-19T10:00:00.000Z',
  },
  {
    id: 'task-4',
    provider: 'todoist',
    type: 'task',
    title: 'Set up Supabase authentication policies',
    status: 'completed',
    dueDate: '2026-09-18T18:00:00.000Z',
    priority: 'medium',
    project: 'Backend',
    updatedAt: '2026-09-18T17:45:00.000Z',
  },

  // -------------------------------------------------------------------------
  // Articles
  // -------------------------------------------------------------------------
  {
    id: 'article-1',
    provider: 'rss',
    type: 'article',
    title: 'Next-gen AI models transform personal productivity apps',
    url: 'https://techcrunch.com/productivity-ai',
    summary: 'How declarative UI paradigms and AI generation are converging in modern application design.',
    author: 'Sarah Chen',
    publishedAt: '2026-09-19T13:45:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200',
    updatedAt: '2026-09-19T14:00:00.000Z',
  },
  {
    id: 'article-2',
    provider: 'rss',
    type: 'article',
    title: 'TypeScript 6.0 released with native pattern matching',
    url: 'https://devblogs.microsoft.com/typescript',
    summary: 'Full compiler optimization and ergonomics improvements for complex discriminated unions.',
    author: 'Anders Hejlsberg',
    publishedAt: '2026-09-19T11:20:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200',
    updatedAt: '2026-09-19T12:00:00.000Z',
  },
  {
    id: 'article-3',
    provider: 'rss',
    type: 'article',
    title: 'Designing glanceable mobile widgets: Best practices',
    url: 'https://uxdesign.cc/mobile-widgets',
    summary: 'A deep dive into information hierarchy and layout responsiveness on Android & iOS.',
    author: 'Marcus Vance',
    publishedAt: '2026-09-19T09:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200',
    updatedAt: '2026-09-19T09:30:00.000Z',
  },

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------
  {
    id: 'metric-mrr',
    provider: 'internal',
    type: 'metric',
    label: 'MRR',
    value: 48250,
    unit: 'USD',
    trend: 'up',
    change: 14.2,
    updatedAt: '2026-09-19T14:00:00.000Z',
  },
  {
    id: 'metric-users',
    provider: 'internal',
    type: 'metric',
    label: 'Active Users',
    value: 12480,
    unit: 'users',
    trend: 'up',
    change: 5.8,
    updatedAt: '2026-09-19T14:00:00.000Z',
  },
  {
    id: 'metric-latency',
    provider: 'internal',
    type: 'metric',
    label: 'Avg Latency',
    value: 185,
    unit: 'ms',
    trend: 'down',
    change: -24,
    updatedAt: '2026-09-19T14:00:00.000Z',
  },
];
