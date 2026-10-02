/**
 * src/widgets/declarative/elements.ts
 *
 * Declarative UI element schemas for WidgeBuddy widgets.
 * Supports:
 * - action (standalone buttons/links or attached to elements)
 * - text
 * - icons
 * - weather
 * - event
 * - task list
 * - article list
 * - metric
 * - divider
 * - container (recursive tree layout)
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Action & Interaction
// ---------------------------------------------------------------------------

export const ActionTypeSchema = z.enum([
  'open_url',
  'navigate',
  'run_connector',
  'toggle_task',
  'custom',
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

export const ActionSchema = z.object({
  type: ActionTypeSchema,
  url: z.string().url('Invalid URL format for open_url action').optional(),
  route: z.string().optional(),
  actionName: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type Action = z.infer<typeof ActionSchema>;

export const ActionVariantSchema = z.enum(['button', 'icon_button', 'link', 'badge']);
export type ActionVariant = z.infer<typeof ActionVariantSchema>;

export const ActionStyleSchema = z.enum(['primary', 'secondary', 'destructive', 'ghost']);
export type ActionStyle = z.infer<typeof ActionStyleSchema>;

export const ActionElementSchema = z.object({
  type: z.literal('action'),
  id: z.string().optional(),
  label: z.string().optional(),
  icon: z.string().optional(),
  action: ActionSchema,
  variant: ActionVariantSchema.default('button'),
  style: ActionStyleSchema.default('primary'),
  disabled: z.boolean().default(false),
});

export type ActionElement = z.infer<typeof ActionElementSchema>;
export type ActionElementInput = z.input<typeof ActionElementSchema>;

// ---------------------------------------------------------------------------
// Text Element
// ---------------------------------------------------------------------------

export const TextVariantSchema = z.enum([
  'heading',
  'title',
  'subtitle',
  'body',
  'caption',
  'label',
  'metric',
]);
export type TextVariant = z.infer<typeof TextVariantSchema>;

export const FontWeightSchema = z.enum([
  'light',
  'regular',
  'medium',
  'semibold',
  'bold',
]);
export type FontWeight = z.infer<typeof FontWeightSchema>;

export const TextAlignSchema = z.enum(['left', 'center', 'right']);
export type TextAlign = z.infer<typeof TextAlignSchema>;

export const TextSizeSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);
export type TextSize = z.infer<typeof TextSizeSchema>;

export const TextElementSchema = z.object({
  type: z.literal('text'),
  id: z.string().optional(),
  content: z.string(),
  variant: TextVariantSchema.default('body'),
  size: z.union([TextSizeSchema, z.number().positive()]).optional(),
  weight: FontWeightSchema.default('regular'),
  color: z.string().optional(),
  align: TextAlignSchema.default('left'),
  maxLines: z.number().int().positive().optional(),
  action: ActionSchema.optional(),
});

export type TextElement = z.infer<typeof TextElementSchema>;
export type TextElementInput = z.input<typeof TextElementSchema>;

// ---------------------------------------------------------------------------
// Icon Element
// ---------------------------------------------------------------------------

export const IconElementSchema = z.object({
  type: z.literal('icon'),
  id: z.string().optional(),
  name: z.string().min(1, 'Icon name cannot be empty'),
  size: z.union([z.enum(['small', 'medium', 'large']), z.number().positive()]).default('medium'),
  color: z.string().optional(),
  action: ActionSchema.optional(),
});

export type IconElement = z.infer<typeof IconElementSchema>;
export type IconElementInput = z.input<typeof IconElementSchema>;

// ---------------------------------------------------------------------------
// Weather Element
// ---------------------------------------------------------------------------

export const WeatherDisplayModeSchema = z.enum([
  'current',
  'forecast',
  'compact',
  'detailed',
]);
export type WeatherDisplayMode = z.infer<typeof WeatherDisplayModeSchema>;

export const WeatherElementSchema = z.object({
  type: z.literal('weather'),
  id: z.string().optional(),
  displayMode: WeatherDisplayModeSchema.default('current'),
  showConditionIcon: z.boolean().default(true),
  showHumidity: z.boolean().default(false),
  showWind: z.boolean().default(false),
  showFeelsLike: z.boolean().default(false),
  tempUnit: z.enum(['celsius', 'fahrenheit', 'auto']).default('auto'),
  forecastDays: z.number().int().min(1).max(7).default(3),
  action: ActionSchema.optional(),
});

export type WeatherElement = z.infer<typeof WeatherElementSchema>;
export type WeatherElementInput = z.input<typeof WeatherElementSchema>;

// ---------------------------------------------------------------------------
// Event Element
// ---------------------------------------------------------------------------

export const EventElementSchema = z.object({
  type: z.literal('event'),
  id: z.string().optional(),
  title: z.string().min(1, 'Event title is required'),
  startAt: z.string(),
  endAt: z.string().optional(),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
  calendarColor: z.string().optional(),
  showTime: z.boolean().default(true),
  showLocation: z.boolean().default(true),
  action: ActionSchema.optional(),
});

export type EventElement = z.infer<typeof EventElementSchema>;
export type EventElementInput = z.input<typeof EventElementSchema>;

// ---------------------------------------------------------------------------
// Task List Element
// ---------------------------------------------------------------------------

export const TaskListElementSchema = z.object({
  type: z.literal('taskList'),
  id: z.string().optional(),
  maxItems: z.number().int().positive().default(5),
  showCheckbox: z.boolean().default(true),
  showDueDate: z.boolean().default(true),
  showPriority: z.boolean().default(false),
  filterStatus: z.enum(['all', 'pending', 'completed']).default('pending'),
  emptyMessage: z.string().default('No tasks to show'),
  allowToggle: z.boolean().default(true),
});

export type TaskListElement = z.infer<typeof TaskListElementSchema>;
export type TaskListElementInput = z.input<typeof TaskListElementSchema>;

// ---------------------------------------------------------------------------
// Article List Element
// ---------------------------------------------------------------------------

export const ArticleListElementSchema = z.object({
  type: z.literal('articleList'),
  id: z.string().optional(),
  maxItems: z.number().int().positive().default(3),
  showImage: z.boolean().default(true),
  showSummary: z.boolean().default(false),
  showAuthor: z.boolean().default(false),
  showTimestamp: z.boolean().default(true),
  layout: z.enum(['compact', 'card', 'headline_only']).default('compact'),
  emptyMessage: z.string().default('No articles available'),
});

export type ArticleListElement = z.infer<typeof ArticleListElementSchema>;
export type ArticleListElementInput = z.input<typeof ArticleListElementSchema>;

// ---------------------------------------------------------------------------
// Metric Element
// ---------------------------------------------------------------------------

export const MetricTrendSchema = z.enum(['up', 'down', 'flat']);
export type MetricTrend = z.infer<typeof MetricTrendSchema>;

export const MetricElementSchema = z.object({
  type: z.literal('metric'),
  id: z.string().optional(),
  label: z.string().min(1, 'Metric label is required'),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  trend: MetricTrendSchema.optional(),
  change: z.union([z.string(), z.number()]).optional(),
  trendColor: z.string().optional(),
  icon: z.string().optional(),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  action: ActionSchema.optional(),
});

export type MetricElement = z.infer<typeof MetricElementSchema>;
export type MetricElementInput = z.input<typeof MetricElementSchema>;

// ---------------------------------------------------------------------------
// Divider Element
// ---------------------------------------------------------------------------

export const DividerElementSchema = z.object({
  type: z.literal('divider'),
  id: z.string().optional(),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  thickness: z.number().positive().default(1),
  color: z.string().default('#e5e7eb'),
  spacing: z.number().min(0).default(8),
});

export type DividerElement = z.infer<typeof DividerElementSchema>;
export type DividerElementInput = z.input<typeof DividerElementSchema>;

// ---------------------------------------------------------------------------
// Layout Helpers for Container
// ---------------------------------------------------------------------------

export const ContainerDirectionSchema = z.enum(['column', 'row', 'stack']);
export type ContainerDirection = z.infer<typeof ContainerDirectionSchema>;

export const AlignmentSchema = z.object({
  horizontal: z.enum(['left', 'center', 'right', 'stretch', 'space-between', 'space-around']).optional(),
  vertical: z.enum(['top', 'center', 'bottom', 'stretch', 'space-between', 'space-around']).optional(),
});
export type Alignment = z.infer<typeof AlignmentSchema>;

export const PaddingSchema = z.union([
  z.number().min(0),
  z.object({
    top: z.number().min(0).optional(),
    right: z.number().min(0).optional(),
    bottom: z.number().min(0).optional(),
    left: z.number().min(0).optional(),
    horizontal: z.number().min(0).optional(),
    vertical: z.number().min(0).optional(),
  }),
]);
export type Padding = z.infer<typeof PaddingSchema>;

export const BorderSchema = z.object({
  width: z.number().positive(),
  color: z.string(),
});
export type Border = z.infer<typeof BorderSchema>;

// ---------------------------------------------------------------------------
// Container & Union Element Types
// ---------------------------------------------------------------------------

export interface ContainerElementInput {
  type: 'container';
  id?: string;
  direction?: ContainerDirection;
  alignment?: Alignment;
  gap?: number;
  padding?: Padding;
  backgroundColor?: string;
  borderRadius?: number;
  border?: Border;
  flex?: number;
  action?: Action;
  children?: WidgetElementInput[];
}

export type WidgetElementInput =
  | ActionElementInput
  | TextElementInput
  | IconElementInput
  | WeatherElementInput
  | EventElementInput
  | TaskListElementInput
  | ArticleListElementInput
  | MetricElementInput
  | DividerElementInput
  | ContainerElementInput;

export interface ContainerElement {
  type: 'container';
  id?: string;
  direction: ContainerDirection;
  alignment?: Alignment;
  gap: number;
  padding?: Padding;
  backgroundColor?: string;
  borderRadius?: number;
  border?: Border;
  flex?: number;
  action?: Action;
  children: WidgetElement[];
}

export type WidgetElement =
  | ActionElement
  | TextElement
  | IconElement
  | WeatherElement
  | EventElement
  | TaskListElement
  | ArticleListElement
  | MetricElement
  | DividerElement
  | ContainerElement;

// REASON: Circular type reference in recursive ContainerElement requires any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ContainerElementSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal('container'),
    id: z.string().optional(),
    direction: ContainerDirectionSchema.default('column'),
    alignment: AlignmentSchema.optional(),
    gap: z.number().min(0).default(0),
    padding: PaddingSchema.optional(),
    backgroundColor: z.string().optional(),
    borderRadius: z.number().min(0).optional(),
    border: BorderSchema.optional(),
    flex: z.number().min(0).optional(),
    action: ActionSchema.optional(),
    // REASON: Recursive array of WidgetElement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: z.lazy(() => z.array(WidgetElementSchema)).default([]) as any,
  })
);

// REASON: Circular type reference in recursive WidgetElement requires any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WidgetElementSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion('type', [
    ActionElementSchema,
    TextElementSchema,
    IconElementSchema,
    WeatherElementSchema,
    EventElementSchema,
    TaskListElementSchema,
    ArticleListElementSchema,
    MetricElementSchema,
    DividerElementSchema,
    // REASON: ContainerElementSchema is recursive
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ContainerElementSchema as any,
  ])
);
