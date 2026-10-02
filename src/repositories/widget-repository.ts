/**
 * src/repositories/widget-repository.ts
 *
 * Abstract repository interface for widget definition persistence.
 *
 * UI components depend only on this interface (via getWidgetRepository()),
 * so the storage backend can be swapped from AsyncStorage → Supabase
 * with zero changes to component code.
 *
 * All methods validate widget data with Zod before persisting.
 */

import {
  DeclarativeWidgetDefinition,
  ParsedDeclarativeWidgetDefinition,
} from '@/widgets/declarative/definition';

// ---------------------------------------------------------------------------
// Error type for non-validation persistence failures
// ---------------------------------------------------------------------------

export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

// ---------------------------------------------------------------------------
// WidgetRepository — abstract CRUD contract
// ---------------------------------------------------------------------------

export interface WidgetRepository {
  /**
   * Create a new widget definition.
   *
   * @param widget  - Widget data (validated with Zod before storage).
   * @returns       The validated, persisted widget.
   * @throws        WidgetValidationError if schema validation fails.
   * @throws        RepositoryError if a widget with the same ID already exists.
   */
  create(widget: DeclarativeWidgetDefinition): Promise<ParsedDeclarativeWidgetDefinition>;

  /**
   * Retrieve a single widget definition by its ID.
   *
   * @param id  - The widget ID slug.
   * @returns   The widget if found, or `null` if not.
   */
  get(id: string): Promise<ParsedDeclarativeWidgetDefinition | null>;

  /**
   * List all persisted widget definitions.
   *
   * @returns  Array of validated widgets. Corrupt entries are skipped.
   */
  list(): Promise<ParsedDeclarativeWidgetDefinition[]>;

  /**
   * Update an existing widget definition.
   *
   * @param id      - The ID of the widget to update.
   * @param widget  - New widget data (validated with Zod before storage).
   * @returns       The validated, updated widget.
   * @throws        WidgetValidationError if schema validation fails.
   * @throws        RepositoryError if no widget with the given ID exists.
   */
  update(id: string, widget: DeclarativeWidgetDefinition): Promise<ParsedDeclarativeWidgetDefinition>;

  /**
   * Delete a widget definition by its ID.
   *
   * @param id  - The widget ID to delete.
   * @returns   `true` if a widget was deleted, `false` if not found.
   */
  delete(id: string): Promise<boolean>;
}
