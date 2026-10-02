/**
 * src/repositories/__tests__/widget-repository.test.ts
 *
 * Comprehensive CRUD tests for LocalWidgetRepository.
 * Covers create, get, list, update, delete, validation errors,
 * duplicate detection, not-found errors, and full lifecycle roundtrip.
 */

import { LocalWidgetRepository } from '../local-widget-repository';
import { RepositoryError } from '../widget-repository';
import { DeclarativeWidgetDefinition } from '@/widgets/declarative/definition';
import { WidgetValidationError } from '@/widgets/declarative/validation';

describe('LocalWidgetRepository', () => {
  let repo: LocalWidgetRepository;

  beforeEach(async () => {
    repo = new LocalWidgetRepository();
    await repo.clearAll();
  });

  afterEach(async () => {
    await repo.clearAll();
  });

  // ---------------------------------------------------------------------------
  // Test fixture — a valid widget definition
  // ---------------------------------------------------------------------------

  const validWidget: DeclarativeWidgetDefinition = {
    id: 'test-widget-alpha',
    displayName: 'Alpha Widget',
    description: 'A test widget for CRUD tests',
    version: '1.0.0',
    category: 'productivity',
    tags: ['test', 'crud'],
    connectorTypes: [],
    configFields: [],
    supportedSizes: ['small', 'medium'],
    defaultSize: 'medium',
    layouts: {
      small: {
        root: {
          type: 'container',
          id: 'root-s',
          direction: 'column',
          gap: 4,
          padding: 0,
          children: [
            {
              type: 'text',
              id: 'txt-s',
              content: 'Small layout',
            },
          ],
        },
      },
      medium: {
        root: {
          type: 'container',
          id: 'root-m',
          direction: 'column',
          gap: 8,
          padding: 0,
          children: [
            {
              type: 'text',
              id: 'txt-m',
              content: 'Medium layout',
            },
          ],
        },
      },
    },
  };

  const secondWidget: DeclarativeWidgetDefinition = {
    ...validWidget,
    id: 'test-widget-beta',
    displayName: 'Beta Widget',
  };

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('saves and returns a validated widget', async () => {
      const result = await repo.create(validWidget);

      expect(result.id).toBe('test-widget-alpha');
      expect(result.displayName).toBe('Alpha Widget');
      expect(result.description).toBe('A test widget for CRUD tests');
      expect(result.version).toBe('1.0.0');
      expect(result.supportedSizes).toEqual(['small', 'medium']);
    });

    it('rejects an invalid widget definition with WidgetValidationError', async () => {
      const invalid = {
        id: 'INVALID CAPS ID',
        displayName: '',
        supportedSizes: [],
        layouts: {},
      } as unknown as DeclarativeWidgetDefinition;

      await expect(repo.create(invalid)).rejects.toThrow(WidgetValidationError);
    });

    it('throws RepositoryError on duplicate ID', async () => {
      await repo.create(validWidget);
      await expect(repo.create(validWidget)).rejects.toThrow(RepositoryError);
      await expect(repo.create(validWidget)).rejects.toThrow(/already exists/);
    });
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------

  describe('get', () => {
    it('returns a saved widget by ID', async () => {
      await repo.create(validWidget);

      const found = await repo.get('test-widget-alpha');
      expect(found).not.toBeNull();
      expect(found?.displayName).toBe('Alpha Widget');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repo.get('no-such-widget');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------

  describe('list', () => {
    it('returns all saved widgets', async () => {
      await repo.create(validWidget);
      await repo.create(secondWidget);

      const all = await repo.list();
      expect(all).toHaveLength(2);

      const ids = all.map((w) => w.id);
      expect(ids).toContain('test-widget-alpha');
      expect(ids).toContain('test-widget-beta');
    });

    it('returns an empty array when nothing is saved', async () => {
      const all = await repo.list();
      expect(all).toEqual([]);
    });

    it('preserves insertion order (newest first)', async () => {
      await repo.create(validWidget);
      await repo.create(secondWidget);

      const all = await repo.list();
      // secondWidget was created after validWidget, so it should be first
      expect(all[0].id).toBe('test-widget-beta');
      expect(all[1].id).toBe('test-widget-alpha');
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    it('modifies an existing widget\'s fields', async () => {
      await repo.create(validWidget);

      const updated = await repo.update('test-widget-alpha', {
        ...validWidget,
        displayName: 'Updated Alpha Widget',
        description: 'Updated description',
      });

      expect(updated.displayName).toBe('Updated Alpha Widget');
      expect(updated.description).toBe('Updated description');

      // Verify persistence
      const fetched = await repo.get('test-widget-alpha');
      expect(fetched?.displayName).toBe('Updated Alpha Widget');
    });

    it('throws RepositoryError when updating a non-existent widget', async () => {
      await expect(
        repo.update('non-existent-id', validWidget),
      ).rejects.toThrow(RepositoryError);
      await expect(
        repo.update('non-existent-id', validWidget),
      ).rejects.toThrow(/not found/);
    });

    it('rejects invalid data with WidgetValidationError', async () => {
      await repo.create(validWidget);

      const invalidUpdate = {
        ...validWidget,
        id: 'INVALID CAPS',
        displayName: '',
      } as unknown as DeclarativeWidgetDefinition;

      await expect(
        repo.update('test-widget-alpha', invalidUpdate),
      ).rejects.toThrow(WidgetValidationError);
    });

    it('does not affect other widgets when updating one', async () => {
      await repo.create(validWidget);
      await repo.create(secondWidget);

      await repo.update('test-widget-alpha', {
        ...validWidget,
        displayName: 'Modified Alpha',
      });

      // secondWidget should be unchanged
      const beta = await repo.get('test-widget-beta');
      expect(beta?.displayName).toBe('Beta Widget');
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------

  describe('delete', () => {
    it('removes a widget and returns true', async () => {
      await repo.create(validWidget);

      const deleted = await repo.delete('test-widget-alpha');
      expect(deleted).toBe(true);

      // Verify it's gone
      const found = await repo.get('test-widget-alpha');
      expect(found).toBeNull();
    });

    it('returns false for a non-existent ID', async () => {
      const result = await repo.delete('ghost-widget');
      expect(result).toBe(false);
    });

    it('does not affect other widgets when deleting one', async () => {
      await repo.create(validWidget);
      await repo.create(secondWidget);

      await repo.delete('test-widget-alpha');

      const all = await repo.list();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('test-widget-beta');
    });
  });

  // ---------------------------------------------------------------------------
  // Full lifecycle roundtrip
  // ---------------------------------------------------------------------------

  describe('full lifecycle roundtrip', () => {
    it('create → get → update → list → delete', async () => {
      // Create
      const created = await repo.create(validWidget);
      expect(created.id).toBe('test-widget-alpha');

      // Get
      const fetched = await repo.get('test-widget-alpha');
      expect(fetched).not.toBeNull();
      expect(fetched?.displayName).toBe('Alpha Widget');

      // Update
      const updated = await repo.update('test-widget-alpha', {
        ...validWidget,
        displayName: 'Renamed Alpha',
        tags: ['renamed'],
      });
      expect(updated.displayName).toBe('Renamed Alpha');
      expect(updated.tags).toEqual(['renamed']);

      // List
      const all = await repo.list();
      expect(all).toHaveLength(1);
      expect(all[0].displayName).toBe('Renamed Alpha');

      // Delete
      const deleted = await repo.delete('test-widget-alpha');
      expect(deleted).toBe(true);

      // Verify empty
      const afterDelete = await repo.list();
      expect(afterDelete).toHaveLength(0);

      const refetch = await repo.get('test-widget-alpha');
      expect(refetch).toBeNull();
    });
  });
});
