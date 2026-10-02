/**
 * src/renderer/declarative/dataBinding.ts
 *
 * Pure data resolution and template interpolation functions for the widget renderer.
 * Renderer-agnostic and side-effect free.
 */

import { UniversalItem } from '@/widgets/schema';

/**
 * Filters items by type from a UniversalItem array.
 */
export function getItemsByType<T extends UniversalItem['type']>(
  items: UniversalItem[] | undefined,
  type: T
): Extract<UniversalItem, { type: T }>[] {
  if (!items) return [];
  return items.filter((item): item is Extract<UniversalItem, { type: T }> => item.type === type);
}

/**
 * Retrieves the first item matching the given type, or undefined.
 */
export function getFirstItemByType<T extends UniversalItem['type']>(
  items: UniversalItem[] | undefined,
  type: T
): Extract<UniversalItem, { type: T }> | undefined {
  if (!items) return undefined;
  return items.find((item): item is Extract<UniversalItem, { type: T }> => item.type === type);
}

/**
 * Resolves template string placeholders like {{weather.temp}} or {{config.city}}
 * using data from normalized items or user configuration.
 */
export function resolveTemplate(
  template: string,
  items?: UniversalItem[],
  userConfig?: Record<string, unknown>
): string {
  if (!template || !template.includes('{{')) {
    return template;
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key: string) => {
    // 1. Check user config, e.g. {{config.city}} or {{city}}
    if (userConfig) {
      if (key.startsWith('config.') && key.slice(7) in userConfig) {
        const val = userConfig[key.slice(7)];
        return val !== undefined ? String(val) : match;
      }
      if (key in userConfig) {
        const val = userConfig[key];
        return val !== undefined ? String(val) : match;
      }
    }

    // 2. Check items by type prefix, e.g. {{weather.temp}} or {{weather.condition}}
    if (items) {
      const dotIndex = key.indexOf('.');
      if (dotIndex > 0) {
        const typePrefix = key.slice(0, dotIndex);
        const propName = key.slice(dotIndex + 1);
        const matchedItem = items.find((it) => it.type === typePrefix);
        if (matchedItem && propName in matchedItem) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const val = (matchedItem as any)[propName];
          return val !== undefined ? String(val) : match;
        }
      }

      // Check top-level property across all items
      for (const item of items) {
        if (key in item) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const val = (item as any)[key];
          return val !== undefined ? String(val) : match;
        }
      }
    }

    return match;
  });
}

/**
 * Formats an ISO datetime string into a 12-hour time (e.g. "10:30 AM").
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO datetime string into short date (e.g. "Sep 19").
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return isoString;
  }
}
