/**
 * src/types/__tests__/supabase-types.test.ts
 *
 * Compile-time and runtime type consistency tests for Supabase tables
 * ensuring compliance with Prompt 9 backend foundation requirements.
 */

import type {
  Database,
  ProfileRow,
  ProfileInsert,
  ProfileUpdate,
  WidgetRow,
  WidgetInsert,
  WidgetUpdate,
  WidgetVersionRow,
  WidgetVersionInsert,
  ConnectionRow,
  ConnectionInsert,
  ConnectionUpdate,
  UserPreferencesRow,
  UserPreferencesInsert,
  UserPreferencesUpdate,
} from '../supabase';

describe('Supabase Database TypeScript Types (Prompt 9)', () => {
  describe('profiles table types', () => {
    it('accepts valid ProfileRow object', () => {
      const profile: ProfileRow = {
        id: '11111111-1111-1111-1111-111111111111',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.png',
        schema_version: 1,
        created_at: '2026-09-19T00:00:00Z',
        updated_at: '2026-09-19T00:00:00Z',
      };
      expect(profile.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(profile.schema_version).toBe(1);
    });

    it('accepts minimal ProfileInsert with required id', () => {
      const insert: ProfileInsert = {
        id: '11111111-1111-1111-1111-111111111111',
      };
      expect(insert.id).toBeDefined();
    });

    it('accepts ProfileUpdate with partial fields', () => {
      const update: ProfileUpdate = {
        display_name: 'Updated Name',
      };
      expect(update.display_name).toBe('Updated Name');
    });
  });

  describe('widgets table types', () => {
    it('accepts valid WidgetRow with JSONB definition', () => {
      const widget: WidgetRow = {
        id: '22222222-2222-2222-2222-222222222222',
        user_id: '11111111-1111-1111-1111-111111111111',
        slug: 'weather-widget',
        display_name: 'My Weather',
        description: 'Shows local weather forecast',
        definition: {
          id: 'weather-widget',
          displayName: 'My Weather',
          root: { id: 'root', type: 'container', children: [] },
        },
        is_published: false,
        schema_version: 1,
        created_at: '2026-09-19T00:00:00Z',
        updated_at: '2026-09-19T00:00:00Z',
      };

      expect(widget.slug).toBe('weather-widget');
      expect(widget.is_published).toBe(false);
      expect(widget.schema_version).toBe(1);
    });

    it('accepts minimal WidgetInsert with required fields', () => {
      const insert: WidgetInsert = {
        user_id: '11111111-1111-1111-1111-111111111111',
        slug: 'clock-widget',
        display_name: 'Minimal Clock',
      };
      expect(insert.user_id).toBe('11111111-1111-1111-1111-111111111111');
      expect(insert.slug).toBe('clock-widget');
    });

    it('accepts partial WidgetUpdate', () => {
      const update: WidgetUpdate = {
        is_published: true,
      };
      expect(update.is_published).toBe(true);
    });
  });

  describe('widget_versions table types', () => {
    it('accepts valid WidgetVersionRow', () => {
      const version: WidgetVersionRow = {
        id: '33333333-3333-3333-3333-333333333333',
        widget_id: '22222222-2222-2222-2222-222222222222',
        user_id: '11111111-1111-1111-1111-111111111111',
        version: '1.0.0',
        definition: { test: true },
        changelog: 'Initial version',
        schema_version: 1,
        created_at: '2026-09-19T00:00:00Z',
      };

      expect(version.version).toBe('1.0.0');
      expect(version.changelog).toBe('Initial version');
    });

    it('accepts minimal WidgetVersionInsert', () => {
      const insert: WidgetVersionInsert = {
        widget_id: '22222222-2222-2222-2222-222222222222',
        user_id: '11111111-1111-1111-1111-111111111111',
        version: '1.0.1',
        definition: { test: true },
      };
      expect(insert.version).toBe('1.0.1');
    });
  });

  describe('connections table types', () => {
    it('accepts valid ConnectionRow', () => {
      const connection: ConnectionRow = {
        id: '44444444-4444-4444-4444-444444444444',
        user_id: '11111111-1111-1111-1111-111111111111',
        provider_type: 'openweather',
        display_name: 'Work Weather',
        config: { city: 'San Francisco', units: 'metric' },
        is_active: true,
        schema_version: 1,
        created_at: '2026-09-19T00:00:00Z',
        updated_at: '2026-09-19T00:00:00Z',
      };

      expect(connection.provider_type).toBe('openweather');
      expect(connection.is_active).toBe(true);
      expect(connection.schema_version).toBe(1);
    });

    it('accepts minimal ConnectionInsert', () => {
      const insert: ConnectionInsert = {
        user_id: '11111111-1111-1111-1111-111111111111',
        provider_type: 'rss',
      };
      expect(insert.provider_type).toBe('rss');
    });

    it('accepts partial ConnectionUpdate', () => {
      const update: ConnectionUpdate = {
        is_active: false,
      };
      expect(update.is_active).toBe(false);
    });
  });

  describe('user_preferences table types', () => {
    it('accepts valid UserPreferencesRow', () => {
      const prefs: UserPreferencesRow = {
        id: '55555555-5555-5555-5555-555555555555',
        user_id: '11111111-1111-1111-1111-111111111111',
        theme: 'dark',
        preferences: { autoRefreshInterval: 300 },
        schema_version: 1,
        created_at: '2026-09-19T00:00:00Z',
        updated_at: '2026-09-19T00:00:00Z',
      };

      expect(prefs.theme).toBe('dark');
      expect(prefs.schema_version).toBe(1);
    });

    it('accepts minimal UserPreferencesInsert', () => {
      const insert: UserPreferencesInsert = {
        user_id: '11111111-1111-1111-1111-111111111111',
      };
      expect(insert.user_id).toBe('11111111-1111-1111-1111-111111111111');
    });

    it('accepts partial UserPreferencesUpdate', () => {
      const update: UserPreferencesUpdate = {
        theme: 'light',
      };
      expect(update.theme).toBe('light');
    });
  });

  describe('Database type structure', () => {
    it('contains all 8 required tables in Database public schema', () => {
      type PublicTables = keyof Database['public']['Tables'];
      const requiredTables: Record<PublicTables, boolean> = {
        connectors: true,
        widget_definitions: true,
        widget_instances: true,
        profiles: true,
        widgets: true,
        widget_versions: true,
        connections: true,
        user_preferences: true,
      };

      expect(Object.keys(requiredTables)).toHaveLength(8);
    });
  });
});
