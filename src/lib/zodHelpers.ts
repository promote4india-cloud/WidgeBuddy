/**
 * src/lib/zodHelpers.ts
 *
 * Utility to build a Zod schema dynamically from a WidgetDefinition's configFields.
 * Used by the widget editor to validate user input before saving.
 *
 * See docs/widget-schema.md §7 for documentation.
 */

import { z } from 'zod';
import { ConfigField } from '@/widgets/schema';

/**
 * Builds a Zod object schema from a list of ConfigField definitions.
 * Each field maps to a Zod type based on its `type` property.
 *
 * REASON: ZodObject shape must be typed as `any` because the keys and types
 *         are determined at runtime from the widget definition.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildConfigSchema(fields: ConfigField[]): z.ZodObject<any> {
  // REASON: shape keys are dynamic — cannot be statically typed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
        schema = z.string();
        break;
      case 'number':
        schema = z.number();
        break;
      case 'boolean':
        schema = z.boolean();
        break;
      case 'color':
        schema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color, e.g. #ffffff');
        break;
      case 'select': {
        const values = (field.options ?? []).map((o) => o.value);
        if (values.length === 0) {
          schema = z.string();
        } else {
          schema = z.enum(values as [string, ...string[]]);
        }
        break;
      }
      default:
        schema = z.unknown();
    }

    if (!field.required) {
      schema = schema.optional();
    }

    if (field.defaultValue !== undefined) {
      // REASON: defaultValue is typed as unknown in ConfigField — safe here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema = (schema as any).default(field.defaultValue);
    }

    shape[field.key] = schema;
  }

  return z.object(shape);
}
