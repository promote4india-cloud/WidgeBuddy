/**
 * src/widgets/schema.ts
 *
 * Single source of truth for ALL Zod schemas and inferred TypeScript types.
 * Every other module imports types from here — never from connector or renderer code.
 *
 * See docs/widget-schema.md for full documentation and examples.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// ConfigField — a single user-editable field declared by a WidgetDefinition
// ---------------------------------------------------------------------------

export const ConfigFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'select', 'color']),
  defaultValue: z.unknown().optional(),
  options: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  required: z.boolean().default(false),
});

export type ConfigField = z.infer<typeof ConfigFieldSchema>;

// ---------------------------------------------------------------------------
import {
  WidgetSizeSchema,
  SizeLayoutsSchema,
} from './declarative/layout';

export * from './declarative';

export const WidgetDefinitionSchema = z.object({
  /** Unique string ID, e.g. 'weather-card' */
  type: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  /** Semver string, e.g. '1.0.0' */
  version: z.string().default('1.0.0'),
  /** Author or team that created this widget */
  author: z.string().optional(),
  /** Category slug, e.g. 'weather', 'productivity', 'news', 'finance' */
  category: z.string().optional(),
  /** Search tags */
  tags: z.array(z.string()).optional(),
  /** Icon name for picker */
  icon: z.string().optional(),
  /** Which connector type slugs can feed this widget. Empty = no connector needed. */
  connectorTypes: z.array(z.string()),
  configFields: z.array(ConfigFieldSchema).default([]),
  /** Supported widget sizes */
  supportedSizes: z.array(WidgetSizeSchema).optional(),
  /** Default size when placed */
  defaultSize: WidgetSizeSchema.optional(),
  /** Declarative layout trees for small, medium, large */
  layouts: SizeLayoutsSchema.optional(),
  minW: z.number().int().min(1).default(2),
  minH: z.number().int().min(1).default(2),
  maxW: z.number().int().optional(),
  maxH: z.number().int().optional(),
});

export type WidgetDefinition = z.infer<typeof WidgetDefinitionSchema>;

// ---------------------------------------------------------------------------
// WidgetLayout — grid position and size of a placed widget instance
// ---------------------------------------------------------------------------

export const WidgetLayoutSchema = z.object({
  /** Zero-based page index */
  page: z.number().int().min(0).default(0),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  /** Width in grid columns (default grid = 6 columns) */
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>;

// ---------------------------------------------------------------------------
// WidgetInstance — one placed copy of a definition on a dashboard
// ---------------------------------------------------------------------------

export const WidgetInstanceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  /** References widget_definitions.id in Supabase */
  definitionId: z.string().uuid(),
  /** References connectors.id in Supabase. Null for connector-less widgets (e.g. clock). */
  connectorId: z.string().uuid().nullable(),
  layout: WidgetLayoutSchema,
  /** Freeform map validated at runtime against the definition's configFields */
  userConfig: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WidgetInstance = z.infer<typeof WidgetInstanceSchema>;

// ---------------------------------------------------------------------------
// Universal Data Model — consumed by the renderer layer
// ---------------------------------------------------------------------------

const BaseItemFields = {
  /** Stable identifier used as React list key */
  id: z.string(),
  /** Source provider slug (e.g. 'openweather', 'google_calendar') */
  provider: z.string(),
  updatedAt: z.string().datetime(),
  /** Optional freeform extras */
  meta: z.record(z.string(), z.unknown()).optional(),
};

export const WeatherItemSchema = z.object({
  ...BaseItemFields,
  type: z.literal('weather'),
  temp: z.number(),
  condition: z.string(),
  iconUrl: z.string().url().optional(),
  feelsLike: z.number().optional(),
  humidity: z.number().optional(),
});

export const CalendarEventItemSchema = z.object({
  ...BaseItemFields,
  type: z.literal('calendar_event'),
  title: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
});

export const TaskItemSchema = z.object({
  ...BaseItemFields,
  type: z.literal('task'),
  title: z.string(),
  status: z.enum(['pending', 'completed']),
  dueDate: z.string().datetime().optional(),
  priority: z.string().optional(),
  project: z.string().optional(),
});

export const ArticleItemSchema = z.object({
  ...BaseItemFields,
  type: z.literal('article'),
  title: z.string(),
  url: z.string().url(),
  summary: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
});

export const MetricItemSchema = z.object({
  ...BaseItemFields,
  type: z.literal('metric'),
  label: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  trend: z.enum(['up', 'down', 'flat']).optional(),
  change: z.number().optional(),
});

export const TextItemSchema = z.object({
  ...BaseItemFields,
  type: z.literal('text'),
  title: z.string().optional(),
  body: z.string(),
  format: z.enum(['plaintext', 'markdown']).default('plaintext'),
});

export const UniversalItemSchema = z.discriminatedUnion('type', [
  WeatherItemSchema,
  CalendarEventItemSchema,
  TaskItemSchema,
  ArticleItemSchema,
  MetricItemSchema,
  TextItemSchema,
]);

export type WeatherItem = z.infer<typeof WeatherItemSchema>;
export type CalendarEventItem = z.infer<typeof CalendarEventItemSchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export type ArticleItem = z.infer<typeof ArticleItemSchema>;
export type MetricItem = z.infer<typeof MetricItemSchema>;
export type TextItem = z.infer<typeof TextItemSchema>;
export type UniversalItem = z.infer<typeof UniversalItemSchema>;
