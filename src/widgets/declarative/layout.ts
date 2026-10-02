/**
 * src/widgets/declarative/layout.ts
 *
 * Declarative layout and size schemas for WidgeBuddy widgets.
 * Supports:
 * - small / medium / large sizes
 * - layout trees for each supported size
 * - grid dimension helpers
 */

import { z } from 'zod';
import {
  ContainerElement,
  ContainerElementInput,
  ContainerElementSchema,
  Padding,
  PaddingSchema,
} from './elements';

// ---------------------------------------------------------------------------
// Widget Sizes
// ---------------------------------------------------------------------------

export const WidgetSizeSchema = z.enum(['small', 'medium', 'large']);
export type WidgetSize = z.infer<typeof WidgetSizeSchema>;

export interface SizeDimension {
  w: number;
  h: number;
}

/** Default grid column and row dimensions for each widget size in a 6-column grid */
export const WIDGET_SIZE_DIMENSIONS: Record<WidgetSize, SizeDimension> = {
  small: { w: 2, h: 2 },
  medium: { w: 4, h: 2 },
  large: { w: 6, h: 4 },
};

// ---------------------------------------------------------------------------
// WidgetLayoutDefinition — Root layout tree for a single size
// ---------------------------------------------------------------------------

export interface WidgetLayoutDefinitionInput {
  root: ContainerElementInput;
  backgroundColor?: string;
  padding?: Padding;
}

export interface WidgetLayoutDefinition {
  root: ContainerElement;
  backgroundColor?: string;
  padding?: Padding;
}

export const WidgetLayoutDefinitionSchema = z.object({
  root: ContainerElementSchema,
  backgroundColor: z.string().optional(),
  padding: PaddingSchema.optional(),
});

// ---------------------------------------------------------------------------
// SizeLayouts — Layouts partitioned by widget size
// ---------------------------------------------------------------------------

export interface SizeLayoutsInput {
  small?: WidgetLayoutDefinitionInput;
  medium?: WidgetLayoutDefinitionInput;
  large?: WidgetLayoutDefinitionInput;
}

export interface SizeLayouts {
  small?: WidgetLayoutDefinition;
  medium?: WidgetLayoutDefinition;
  large?: WidgetLayoutDefinition;
}

export const SizeLayoutsSchema = z
  .object({
    small: WidgetLayoutDefinitionSchema.optional(),
    medium: WidgetLayoutDefinitionSchema.optional(),
    large: WidgetLayoutDefinitionSchema.optional(),
  })
  .refine(
    (layouts) =>
      layouts.small !== undefined ||
      layouts.medium !== undefined ||
      layouts.large !== undefined,
    {
      message: 'Widget definition must provide at least one size layout (small, medium, or large)',
    }
  );
