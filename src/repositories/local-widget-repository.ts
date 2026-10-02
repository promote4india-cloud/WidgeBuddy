/**
 * src/repositories/local-widget-repository.ts
 *
 * AsyncStorage-backed implementation of WidgetRepository.
 *
 * Uses the same storage key as the legacy localWidgetService to preserve
 * any widgets already saved by the editor. All data is Zod-validated on
 * both read and write.
 *
 * When a Supabase-backed implementation is added later, it will implement
 * the same WidgetRepository interface and be swapped in via the factory
 * in repositories/index.ts.
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
import { WidgetRepository, RepositoryError } from './widget-repository';

const STORAGE_KEY = '@widgebuddy/custom_widgets';

export class LocalWidgetRepository implements WidgetRepository {
  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Reads and validates all stored widgets, silently skipping corrupt entries.
   */
  private async readAll(): Promise<ParsedDeclarativeWidgetDefinition[]> {
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
          console.warn('LocalWidgetRepository: skipping invalid stored widget:', result.errorSummary);
        }
      }
      return validWidgets;
    } catch (error) {
      console.error('LocalWidgetRepository: failed to read from AsyncStorage:', error);
      return [];
    }
  }

  /**
   * Persists the given widget array, replacing the full stored list.
   */
  private async writeAll(widgets: ParsedDeclarativeWidgetDefinition[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }

  /**
   * Validates a widget definition and returns the parsed result, or throws.
   */
  private validate(widget: DeclarativeWidgetDefinition): ParsedDeclarativeWidgetDefinition {
    const result = validateWidgetDefinition(widget);
    if (!result.success) {
      throw new WidgetValidationError(result.errorSummary, result.errors);
    }
    return result.data;
  }

  // ---------------------------------------------------------------------------
  // WidgetRepository interface
  // ---------------------------------------------------------------------------

  async create(widget: DeclarativeWidgetDefinition): Promise<ParsedDeclarativeWidgetDefinition> {
    const validated = this.validate(widget);
    const existing = await this.readAll();

    if (existing.some((w) => w.id === validated.id)) {
      throw new RepositoryError(`Widget with ID "${validated.id}" already exists. Use update() instead.`);
    }

    // Prepend new widget (newest first)
    const updated = [validated, ...existing];
    await this.writeAll(updated);
    return validated;
  }

  async get(id: string): Promise<ParsedDeclarativeWidgetDefinition | null> {
    const all = await this.readAll();
    return all.find((w) => w.id === id) ?? null;
  }

  async list(): Promise<ParsedDeclarativeWidgetDefinition[]> {
    return this.readAll();
  }

  async update(id: string, widget: DeclarativeWidgetDefinition): Promise<ParsedDeclarativeWidgetDefinition> {
    const validated = this.validate(widget);
    const existing = await this.readAll();

    const index = existing.findIndex((w) => w.id === id);
    if (index < 0) {
      throw new RepositoryError(`Widget with ID "${id}" not found. Use create() for new widgets.`);
    }

    // Replace in-place, preserving list order
    const updated = [...existing];
    updated[index] = validated;
    await this.writeAll(updated);
    return validated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.readAll();
    const filtered = existing.filter((w) => w.id !== id);

    if (filtered.length === existing.length) {
      return false; // Nothing was deleted
    }

    await this.writeAll(filtered);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Testing utility (not part of the WidgetRepository interface)
  // ---------------------------------------------------------------------------

  /**
   * Clears all stored widgets. Primarily used for testing and cache reset.
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
