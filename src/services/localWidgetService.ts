/**
 * src/services/localWidgetService.ts
 *
 * @deprecated Use `getWidgetRepository()` from `@/repositories` instead.
 * This module is retained for backward compatibility but should not be used
 * in new code. All CRUD operations should go through the WidgetRepository interface.
 *
 * Legacy service for locally persisting custom DeclarativeWidgetDefinitions in AsyncStorage.
 * Ensures all saved and retrieved widgets are validated against DeclarativeWidgetDefinitionSchema.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DeclarativeWidgetDefinition,
  ParsedDeclarativeWidgetDefinition,
} from '@/widgets/declarative/definition';
import {
  validateWidgetDefinition,
  WidgetValidationError,
} from '@/widgets/declarative/validation';

const STORAGE_KEY = '@widgebuddy/custom_widgets';

/**
 * Retrieves all locally saved custom widget definitions.
 * @deprecated Use `getWidgetRepository().list()` instead.
 */
export async function getCustomWidgets(): Promise<ParsedDeclarativeWidgetDefinition[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validWidgets: ParsedDeclarativeWidgetDefinition[] = [];
    for (const item of parsed) {
      const result = validateWidgetDefinition(item);
      if (result.success) {
        validWidgets.push(result.data);
      } else {
        // Log warning but continue loading valid widgets
        console.warn('Skipping invalid stored custom widget:', result.errorSummary);
      }
    }
    return validWidgets;
  } catch (error) {
    console.error('Failed to load custom widgets from AsyncStorage:', error);
    return [];
  }
}

/**
 * Retrieves a single custom widget definition by ID.
 * @deprecated Use `getWidgetRepository().get(id)` instead.
 */
export async function getCustomWidget(id: string): Promise<ParsedDeclarativeWidgetDefinition | null> {
  const all = await getCustomWidgets();
  return all.find((w) => w.id === id) ?? null;
}

/**
 * Validates and saves a custom widget definition locally.
 * Overwrites existing widget if the same ID already exists, otherwise appends.
 * @deprecated Use `getWidgetRepository().create()` or `.update()` instead.
 */
export async function saveCustomWidget(widget: DeclarativeWidgetDefinition): Promise<ParsedDeclarativeWidgetDefinition> {
  // Validate schema before persisting
  const validation = validateWidgetDefinition(widget);
  if (!validation.success) {
    throw new WidgetValidationError(validation.errorSummary, validation.errors);
  }

  const validWidget = validation.data;
  const existing = await getCustomWidgets();

  const index = existing.findIndex((w) => w.id === validWidget.id);
  let updated: ParsedDeclarativeWidgetDefinition[];

  if (index >= 0) {
    // Update existing
    updated = [...existing];
    updated[index] = validWidget;
  } else {
    // Prepend new
    updated = [validWidget, ...existing];
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return validWidget;
}

/**
 * Deletes a custom widget by ID.
 * @deprecated Use `getWidgetRepository().delete(id)` instead.
 */
export async function deleteCustomWidget(id: string): Promise<boolean> {
  const existing = await getCustomWidgets();
  const filtered = existing.filter((w) => w.id !== id);

  if (filtered.length === existing.length) {
    return false; // Nothing deleted
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Clears all custom widgets (primarily for testing and cache reset).
 * @deprecated Use `LocalWidgetRepository.clearAll()` directly for testing.
 */
export async function clearAllCustomWidgets(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
