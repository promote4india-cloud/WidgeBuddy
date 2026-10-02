/**
 * src/widgets/declarative/definition.ts
 *
 * Declarative widget definition schema for WidgeBuddy.
 * Incorporates:
 * - widget metadata (id, displayName, description, version, author, category, tags, icon)
 * - data requirements (connectorTypes)
 * - user configuration (configFields)
 * - multi-size layouts (small, medium, large)
 */

import { z } from 'zod';
import { ConfigFieldSchema } from '../schema';
import {
  WidgetSizeSchema,
  SizeLayoutsSchema,
  SizeLayouts,
} from './layout';

// ---------------------------------------------------------------------------
// Semver regex validation
// ---------------------------------------------------------------------------
const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// ---------------------------------------------------------------------------
// DeclarativeWidgetDefinition Schema
// ---------------------------------------------------------------------------

export const DeclarativeWidgetDefinitionSchema = z
  .object({
    /** Unique slug/identifier, e.g. 'weather-card' */
    id: z
      .string()
      .min(1, 'Widget id is required')
      .regex(/^[a-z0-9-_]+$/, 'Widget id must be lowercase alphanumeric with hyphens or underscores'),
    /** User-visible title in the widget picker and dashboard */
    displayName: z.string().min(1, 'Display name is required'),
    /** Detailed description of what the widget provides */
    description: z.string().optional(),
    /** Semantic version string, e.g. '1.0.0' */
    version: z
      .string()
      .regex(SEMVER_REGEX, 'Version must be a valid semver string (e.g. 1.0.0)')
      .default('1.0.0'),
    /** Author or team that created this widget definition */
    author: z.string().optional(),
    /** Category slug, e.g. 'weather', 'productivity', 'news', 'finance' */
    category: z.string().optional(),
    /** Search tags */
    tags: z.array(z.string()).default([]),
    /** Icon name for widget picker display */
    icon: z.string().optional(),
    /** Which connector types can feed this widget (empty = standalone/clock/etc.) */
    connectorTypes: z.array(z.string()).default([]),
    /** User-configurable fields shown in the widget settings editor */
    configFields: z.array(ConfigFieldSchema).default([]),
    /** Array of supported widget sizes */
    supportedSizes: z.array(WidgetSizeSchema).min(1, 'At least one size must be supported').default(['small', 'medium', 'large']),
    /** Default size when widget is first added */
    defaultSize: WidgetSizeSchema.default('medium'),
    /** Declarative layout trees for each supported size */
    layouts: SizeLayoutsSchema,
  })
  .superRefine((def, ctx) => {
    const layouts = def.layouts as SizeLayouts;
    if (!layouts[def.defaultSize]) {
      ctx.addIssue({
        code: 'custom',
        message: `Default size "${def.defaultSize}" must have a corresponding layout in layouts`,
        path: ['defaultSize'],
      });
    }
    const missing = def.supportedSizes.filter((s) => !layouts[s]);
    if (missing.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: `The following supported sizes are missing a layout definition: ${missing.join(', ')}`,
        path: ['supportedSizes'],
      });
    }
  });

export type DeclarativeWidgetDefinition = z.input<typeof DeclarativeWidgetDefinitionSchema>;
export type ParsedDeclarativeWidgetDefinition = z.output<typeof DeclarativeWidgetDefinitionSchema>;
