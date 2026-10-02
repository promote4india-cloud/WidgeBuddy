/**
 * src/types/supabase.d.ts
 *
 * Supabase database type definitions for WidgeBuddy.
 * Includes all 8 tables across 20260919000000_initial.sql and 20260919100000_backend_foundation.sql.
 *
 * Can be regenerated against a live linked database with:
 *   npx supabase gen types typescript --linked > src/types/supabase.d.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Legacy table (20260919000000_initial.sql) — preserved for backward compatibility
      connectors: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          config?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connectors_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // Legacy table (20260919000000_initial.sql) — preserved for backward compatibility
      widget_definitions: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          config_schema: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          config_schema?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string;
          config_schema?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'widget_definitions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // Legacy table (20260919000000_initial.sql) — preserved for backward compatibility
      widget_instances: {
        Row: {
          id: string;
          user_id: string;
          definition_id: string;
          connector_id: string | null;
          layout: Json;
          user_config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          definition_id: string;
          connector_id?: string | null;
          layout?: Json;
          user_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          definition_id?: string;
          connector_id?: string | null;
          layout?: Json;
          user_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'widget_instances_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'widget_instances_definition_id_fkey';
            columns: ['definition_id'];
            referencedRelation: 'widget_definitions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'widget_instances_connector_id_fkey';
            columns: ['connector_id'];
            referencedRelation: 'connectors';
            referencedColumns: ['id'];
          }
        ];
      };

      // ----------------------------------------------------------------------
      // Prompt 9 Tables (20260919100000_backend_foundation.sql)
      // ----------------------------------------------------------------------

      // User profile synced with auth.users
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          schema_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          schema_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          schema_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // Full declarative widget definitions stored as JSONB
      widgets: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          display_name: string;
          description: string | null;
          definition: Json;
          is_published: boolean;
          schema_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          display_name: string;
          description?: string | null;
          definition?: Json;
          is_published?: boolean;
          schema_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          display_name?: string;
          description?: string | null;
          definition?: Json;
          is_published?: boolean;
          schema_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'widgets_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // Immutable version history snapshots for widgets
      widget_versions: {
        Row: {
          id: string;
          widget_id: string;
          user_id: string;
          version: string;
          definition: Json;
          changelog: string | null;
          schema_version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          widget_id: string;
          user_id: string;
          version: string;
          definition: Json;
          changelog?: string | null;
          schema_version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          widget_id?: string;
          user_id?: string;
          version?: string;
          definition?: Json;
          changelog?: string | null;
          schema_version?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'widget_versions_widget_id_fkey';
            columns: ['widget_id'];
            referencedRelation: 'widgets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'widget_versions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // User data source connections (replaces legacy connectors table)
      connections: {
        Row: {
          id: string;
          user_id: string;
          provider_type: string;
          display_name: string;
          config: Json;
          is_active: boolean;
          schema_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider_type: string;
          display_name?: string;
          config?: Json;
          is_active?: boolean;
          schema_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider_type?: string;
          display_name?: string;
          config?: Json;
          is_active?: boolean;
          schema_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connections_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // App-wide user settings and preferences
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          preferences: Json;
          schema_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          preferences?: Json;
          schema_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          preferences?: Json;
          schema_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
  };
}

// ----------------------------------------------------------------------------
// Convenience Type Aliases
// ----------------------------------------------------------------------------

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type ProfileRow = Tables<'profiles'>;
export type ProfileInsert = InsertTables<'profiles'>;
export type ProfileUpdate = UpdateTables<'profiles'>;

export type WidgetRow = Tables<'widgets'>;
export type WidgetInsert = InsertTables<'widgets'>;
export type WidgetUpdate = UpdateTables<'widgets'>;

export type WidgetVersionRow = Tables<'widget_versions'>;
export type WidgetVersionInsert = InsertTables<'widget_versions'>;
export type WidgetVersionUpdate = UpdateTables<'widget_versions'>;

export type ConnectionRow = Tables<'connections'>;
export type ConnectionInsert = InsertTables<'connections'>;
export type ConnectionUpdate = UpdateTables<'connections'>;

export type UserPreferencesRow = Tables<'user_preferences'>;
export type UserPreferencesInsert = InsertTables<'user_preferences'>;
export type UserPreferencesUpdate = UpdateTables<'user_preferences'>;
