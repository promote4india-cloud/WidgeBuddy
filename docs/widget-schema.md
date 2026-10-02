# WidgeBuddy — Widget Schema

> The widget JSON model is the **lingua franca** between the editor, the renderer, and future native renderers.  
> All types are defined in Zod at `src/widgets/schema.ts`; TypeScript types are inferred from those schemas.

---

## 1. Concepts

| Term | Meaning |
|---|---|
| **WidgetDefinition** | A blueprint for a widget type (e.g. "Weather Card"). Static, ships with the app or is user-created. |
| **WidgetInstance** | One placed copy of a definition on a dashboard. Holds layout + user config. |
| **WidgetLayout** | Grid position and size of an instance on its page. |
| **ConfigField** | A user-editable field declared by a definition (text, select, toggle, …). |
| **NormalisedItem** | A connector-agnostic data record fed to the renderer. |

---

## 2. WidgetDefinition

```typescript
// src/widgets/schema.ts

import { z } from 'zod';

export const ConfigFieldSchema = z.object({
  key:          z.string(),
  label:        z.string(),
  type:         z.enum(['text', 'number', 'boolean', 'select', 'color']),
  defaultValue: z.unknown().optional(),
  options:      z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  required:     z.boolean().default(false),
});

export const WidgetDefinitionSchema = z.object({
  type:           z.string(),       // unique ID, e.g. 'weather-card'
  displayName:    z.string(),
  description:    z.string().optional(),
  version:        z.string().default('1.0.0'),
  connectorTypes: z.array(z.string()),  // which connector types can feed this widget
  configFields:   z.array(ConfigFieldSchema).default([]),
  minW:           z.number().int().min(1).default(2),
  minH:           z.number().int().min(1).default(2),
  maxW:           z.number().int().optional(),
  maxH:           z.number().int().optional(),
});

export type WidgetDefinition = z.infer<typeof WidgetDefinitionSchema>;
```

### Example — Weather Card definition

```json
{
  "type": "weather-card",
  "displayName": "Weather Card",
  "description": "Current conditions and today's forecast",
  "version": "1.0.0",
  "connectorTypes": ["weather"],
  "configFields": [
    {
      "key": "unit",
      "label": "Temperature unit",
      "type": "select",
      "defaultValue": "celsius",
      "options": [
        { "label": "Celsius", "value": "celsius" },
        { "label": "Fahrenheit", "value": "fahrenheit" }
      ],
      "required": true
    },
    {
      "key": "showForecast",
      "label": "Show 3-day forecast",
      "type": "boolean",
      "defaultValue": true,
      "required": false
    }
  ],
  "minW": 2,
  "minH": 2
}
```

---

## 3. WidgetLayout

```typescript
export const WidgetLayoutSchema = z.object({
  page: z.number().int().min(0).default(0),
  x:    z.number().int().min(0),
  y:    z.number().int().min(0),
  w:    z.number().int().min(1),
  h:    z.number().int().min(1),
});

export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>;
```

The grid is a **6-column** layout by default (configurable per dashboard).

---

## 4. WidgetInstance

```typescript
export const WidgetInstanceSchema = z.object({
  id:           z.string().uuid(),
  userId:       z.string().uuid(),
  definitionId: z.string().uuid(),
  connectorId:  z.string().uuid().nullable(),
  layout:       WidgetLayoutSchema,
  userConfig:   z.record(z.unknown()).default({}),
  createdAt:    z.string().datetime(),
  updatedAt:    z.string().datetime(),
});

export type WidgetInstance = z.infer<typeof WidgetInstanceSchema>;
```

`userConfig` is a freeform map validated at runtime against the definition's `configFields`.

---

## 5. NormalisedItem

`NormalisedItem` is the **connector-agnostic** payload the renderer receives.  
Connectors produce it; renderers consume it. Normalisers are responsible for the transform.

```typescript
export const NormalisedItemSchema = z.object({
  id:          z.string(),           // stable identifier (used for list keys)
  connectorId: z.string(),           // which connector produced this
  type:        z.string(),           // e.g. 'weather.current' | 'calendar.event'
  title:       z.string(),
  subtitle:    z.string().optional(),
  body:        z.string().optional(),
  imageUrl:    z.string().url().optional(),
  startAt:     z.string().datetime().optional(),
  endAt:       z.string().datetime().optional(),
  meta:        z.record(z.unknown()).optional(), // type-specific extras
  updatedAt:   z.string().datetime(),
});

export type NormalisedItem = z.infer<typeof NormalisedItemSchema>;
```

### NormalisedItem type conventions

| `type` value | Produced by | Key `meta` fields |
|---|---|---|
| `weather.current` | weather connector | `temp`, `feelsLike`, `humidity`, `condition`, `icon` |
| `weather.forecast` | weather connector | `temp`, `condition`, `icon`, `date` |
| `calendar.event` | calendar connector | `allDay`, `location`, `attendees`, `calendarId` |
| `task.item` | tasks connector | `completed`, `priority`, `dueAt`, `listId` |
| `rss.entry` | rss connector | `author`, `link`, `feedTitle` |

---

## 6. Widget Registry

```typescript
// src/widgets/registry.ts

import { WidgetDefinition } from './schema';
import { weatherCardDef }   from './built-in/weather-card';
import { calendarListDef }  from './built-in/calendar-list';
import { taskListDef }      from './built-in/task-list';
import { rssFeedDef }       from './built-in/rss-feed';
import { clockDef }         from './built-in/clock';

const registry = new Map<string, WidgetDefinition>([
  ['weather-card',   weatherCardDef],
  ['calendar-list',  calendarListDef],
  ['task-list',      taskListDef],
  ['rss-feed',       rssFeedDef],
  ['clock',          clockDef],
]);

export const getDefinition = (type: string) => registry.get(type);
export const getAllDefinitions = ()          => Array.from(registry.values());
```

---

## 7. Config Validation Helper

```typescript
// src/lib/zodHelpers.ts

import { z } from 'zod';
import { ConfigField } from '../widgets/schema';

/**
 * Build a Zod schema dynamically from a WidgetDefinition's configFields.
 * Used by the editor to validate user input before saving.
 */
export function buildConfigSchema(fields: ConfigField[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let s: z.ZodTypeAny;
    switch (field.type) {
      case 'text':    s = z.string(); break;
      case 'number':  s = z.number(); break;
      case 'boolean': s = z.boolean(); break;
      case 'color':   s = z.string().regex(/^#[0-9a-fA-F]{6}$/); break;
      case 'select':
        const values = (field.options ?? []).map(o => o.value) as [string, ...string[]];
        s = z.enum(values);
        break;
      default: s = z.unknown();
    }
    if (!field.required) s = s.optional();
    if (field.defaultValue !== undefined) s = s.default(field.defaultValue as any);
    shape[field.key] = s;
  }
  return z.object(shape);
}
```

---

## 8. Versioning Strategy

- `WidgetDefinition.version` follows **semver**.
- Breaking config changes (removed field, changed type) → bump major version.
- Renderer checks `instance.definitionVersion` and migrates `userConfig` if needed.
- Migration functions live in `src/widgets/built-in/<type>/migrations.ts`.
