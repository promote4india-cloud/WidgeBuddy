/**
 * src/widgets/registry.ts
 *
 * Maps widget type strings to their WidgetDefinition objects.
 * Add new widget types here after creating their definition file.
 *
 * See docs/ai-contract.md §4 "Adding a widget type" for the full checklist.
 */

import { WidgetDefinition } from './schema';
import { clockDef } from './built-in/clock';
import { weatherCardDef } from './built-in/weather-card';
import { calendarListDef } from './built-in/calendar-list';
import { taskListDef } from './built-in/task-list';
import { rssFeedDef } from './built-in/rss-feed';

const registry = new Map<string, WidgetDefinition>([
  ['clock', clockDef],
  ['weather-card', weatherCardDef],
  ['calendar-list', calendarListDef],
  ['task-list', taskListDef],
  ['rss-feed', rssFeedDef],
]);

/** Returns the WidgetDefinition for a given type slug, or undefined if not registered. */
export function getDefinition(type: string): WidgetDefinition | undefined {
  return registry.get(type);
}

/** Returns all registered WidgetDefinitions (used in the widget picker UI). */
export function getAllDefinitions(): WidgetDefinition[] {
  return Array.from(registry.values());
}
