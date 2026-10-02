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
 * Helper to retrieve a property from an object, supporting dot-notation paths,
 * meta property fallback, and direct key matching.
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  const record = obj as Record<string, unknown>;

  // 1. Direct key match (e.g. record["cityName"] or record["meta.cityName"])
  if (path in record && record[path] !== undefined) {
    return record[path];
  }

  // 2. Dot-separated path navigation (e.g. "meta.cityName" -> record.meta.cityName)
  const segments = path.split('.');
  let current: any = obj;
  let found = true;
  for (const seg of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      found = false;
      break;
    }
    current = current[seg];
  }
  if (found && current !== undefined) {
    return current;
  }

  // 3. Fallback: If obj has a `meta` dictionary, search inside `meta`
  if ('meta' in record && record.meta && typeof record.meta === 'object') {
    const metaRecord = record.meta as Record<string, unknown>;
    if (path in metaRecord && metaRecord[path] !== undefined) {
      return metaRecord[path];
    }
    // Also try nested in meta for dotted paths
    let metaCurrent: any = metaRecord;
    let metaFound = true;
    for (const seg of segments) {
      if (metaCurrent === null || metaCurrent === undefined || typeof metaCurrent !== 'object') {
        metaFound = false;
        break;
      }
      metaCurrent = metaCurrent[seg];
    }
    if (metaFound && metaCurrent !== undefined) {
      return metaCurrent;
    }
  }

  return undefined;
}

/**
 * Checks if a UniversalItem type matches a given type prefix or common alias.
 */
function isMatchingItemType(itemType: string, prefix: string): boolean {
  if (itemType === prefix) return true;
  if (prefix === 'event' && itemType === 'calendar_event') return true;
  if (prefix === 'calendar' && itemType === 'calendar_event') return true;
  if (prefix === 'tasks' && itemType === 'task') return true;
  if (prefix === 'news' && itemType === 'article') return true;
  if (prefix === 'articles' && itemType === 'article') return true;
  return false;
}

/**
 * Resolves template string placeholders like {{weather.temp}}, {{weather.cityName}},
 * {{weather.meta.cityName}}, or {{config.city}} using data from normalized items or user configuration.
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
      if (key.startsWith('config.')) {
        const val = getNestedValue(userConfig, key.slice(7));
        if (val !== undefined) return String(val);
      }
      const directConfigVal = getNestedValue(userConfig, key);
      if (directConfigVal !== undefined) {
        return String(directConfigVal);
      }
    }

    // 2. Check items by type prefix, e.g. {{weather.temp}}, {{weather.cityName}}, {{weather.meta.cityName}}
    if (items && items.length > 0) {
      const dotIndex = key.indexOf('.');
      if (dotIndex > 0) {
        const typePrefix = key.slice(0, dotIndex);
        const propPath = key.slice(dotIndex + 1);

        const matchedItem = items.find((it) => isMatchingItemType(it.type, typePrefix));
        if (matchedItem) {
          const val = getNestedValue(matchedItem, propPath);
          if (val !== undefined) {
            return String(val);
          }
        }
      }

      // 3. Fallback: Search property across all items (direct property or nested in meta)
      for (const item of items) {
        const val = getNestedValue(item, key);
        if (val !== undefined) {
          return String(val);
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
