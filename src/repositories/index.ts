/**
 * src/repositories/index.ts
 *
 * Barrel exports and singleton factory for WidgetRepository.
 *
 * The getWidgetRepository() factory is the single point of swap when migrating
 * from local AsyncStorage to Supabase. UI code imports only from this module.
 */

export { WidgetRepository, RepositoryError } from './widget-repository';
export { LocalWidgetRepository } from './local-widget-repository';

import { WidgetRepository } from './widget-repository';
import { LocalWidgetRepository } from './local-widget-repository';

let instance: WidgetRepository | null = null;

/**
 * Returns the singleton WidgetRepository instance.
 *
 * Currently returns a LocalWidgetRepository (AsyncStorage-backed).
 * To migrate to Supabase, swap the implementation here — no UI changes needed.
 */
export function getWidgetRepository(): WidgetRepository {
  if (!instance) {
    instance = new LocalWidgetRepository();
  }
  return instance;
}

/**
 * Replaces the singleton instance. Primarily for testing with mocks or
 * for swapping backends at runtime (e.g. after user authentication).
 */
export function setWidgetRepository(repo: WidgetRepository): void {
  instance = repo;
}

/**
 * Resets the singleton to null (forces re-creation on next access).
 * Used in test teardown.
 */
export function resetWidgetRepository(): void {
  instance = null;
}
