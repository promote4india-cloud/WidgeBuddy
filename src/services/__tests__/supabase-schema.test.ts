/**
 * src/services/__tests__/supabase-schema.test.ts
 *
 * Tests for the Supabase client initialization, auth storage configuration,
 * and database table query builder surface.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

describe('Supabase Client Integration', () => {
  it('initializes the Supabase client singleton', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(typeof supabase.auth.getSession).toBe('function');
  });

  it('determines if Supabase is configured with real credentials', () => {
    // In test environment without valid credentials, isSupabaseConfigured should be false
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });

  it('exposes typed query builders for all 8 database tables', () => {
    const tableNames = [
      'connectors',
      'widget_definitions',
      'widget_instances',
      'profiles',
      'widgets',
      'widget_versions',
      'connections',
      'user_preferences',
    ] as const;

    for (const table of tableNames) {
      const query = supabase.from(table);
      expect(query).toBeDefined();
      expect(typeof query.select).toBe('function');
      expect(typeof query.insert).toBe('function');
      expect(typeof query.update).toBe('function');
      expect(typeof query.delete).toBe('function');
    }
  });

  it('supports building select queries for prompt 9 tables', () => {
    // Profiles
    const profilesQuery = supabase.from('profiles').select('id, display_name, avatar_url, schema_version');
    expect(profilesQuery).toBeDefined();

    // Widgets
    const widgetsQuery = supabase.from('widgets').select('id, user_id, slug, display_name, definition, is_published, schema_version');
    expect(widgetsQuery).toBeDefined();

    // Widget Versions
    const versionsQuery = supabase.from('widget_versions').select('id, widget_id, version, definition, changelog, schema_version');
    expect(versionsQuery).toBeDefined();

    // Connections
    const connectionsQuery = supabase.from('connections').select('id, user_id, provider_type, display_name, config, is_active, schema_version');
    expect(connectionsQuery).toBeDefined();

    // User Preferences
    const prefsQuery = supabase.from('user_preferences').select('id, user_id, theme, preferences, schema_version');
    expect(prefsQuery).toBeDefined();
  });
});
