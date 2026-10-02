-- supabase/migrations/20260919100000_backend_foundation.sql
--
-- Backend foundation migration for WidgeBuddy (Prompt 9).
-- Adds: profiles, widgets, widget_versions, connections, user_preferences
-- All tables use UUID PKs, created_at/updated_at timestamps, user ownership,
-- schema_version fields, and Row Level Security.
--
-- This migration builds on top of 20260919000000_initial.sql.
-- The initial tables (connectors, widget_definitions, widget_instances) are
-- preserved for backward compatibility.
--
-- Run via: npx supabase db push

-- ============================================================================
-- PROFILES — User profile linked to auth.users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name  text,
  avatar_url    text,
  schema_version integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles synced from auth.users. One row per user.';
COMMENT ON COLUMN public.profiles.schema_version IS 'Version of the profile JSONB structure for future migrations.';

-- Auto-create profile on user signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- updated_at trigger
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- WIDGETS — Full declarative widget definitions stored as JSONB
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.widgets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  slug          text NOT NULL,
  display_name  text NOT NULL,
  description   text,
  definition    jsonb NOT NULL DEFAULT '{}',
  is_published  boolean NOT NULL DEFAULT false,
  schema_version integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- Each user can have at most one widget with a given slug
  UNIQUE (user_id, slug)
);

COMMENT ON TABLE public.widgets IS 'User-created declarative widget definitions. Definition stored as JSONB (DeclarativeWidgetDefinition).';
COMMENT ON COLUMN public.widgets.slug IS 'URL-safe identifier for the widget, unique per user.';
COMMENT ON COLUMN public.widgets.definition IS 'Full DeclarativeWidgetDefinition JSON including layouts, configFields, connectorTypes.';
COMMENT ON COLUMN public.widgets.is_published IS 'Whether this widget is visible to other authenticated users.';
COMMENT ON COLUMN public.widgets.schema_version IS 'Version of the definition JSONB structure for future migrations.';

CREATE INDEX IF NOT EXISTS idx_widgets_user_id ON public.widgets (user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_published ON public.widgets (is_published) WHERE is_published = true;

CREATE TRIGGER widgets_updated_at
  BEFORE UPDATE ON public.widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- WIDGET_VERSIONS — Immutable version history snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.widget_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id     uuid NOT NULL REFERENCES public.widgets ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  version       text NOT NULL,
  definition    jsonb NOT NULL,
  changelog     text,
  schema_version integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- Each widget can have at most one entry per version string
  UNIQUE (widget_id, version)
);

COMMENT ON TABLE public.widget_versions IS 'Immutable version history for widget definitions. No UPDATE or DELETE allowed via RLS.';
COMMENT ON COLUMN public.widget_versions.version IS 'Semantic version string (e.g. 1.0.0, 1.1.0).';
COMMENT ON COLUMN public.widget_versions.definition IS 'Snapshot of the full DeclarativeWidgetDefinition at this version.';
COMMENT ON COLUMN public.widget_versions.changelog IS 'Optional human-readable description of what changed in this version.';

CREATE INDEX IF NOT EXISTS idx_widget_versions_widget_id ON public.widget_versions (widget_id);

-- widget_versions has no updated_at — versions are immutable

-- ============================================================================
-- CONNECTIONS — Data source configurations (supersedes connectors table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.connections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider_type text NOT NULL,
  display_name  text NOT NULL DEFAULT '',
  config        jsonb NOT NULL DEFAULT '{}',
  is_active     boolean NOT NULL DEFAULT true,
  schema_version integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.connections IS 'Data source configurations per user. Supersedes the legacy connectors table.';
COMMENT ON COLUMN public.connections.provider_type IS 'Provider slug: openweather, google_calendar, todoist, rss, etc.';
COMMENT ON COLUMN public.connections.config IS 'Non-sensitive configuration (city names, feed URLs, preferences). OAuth tokens are managed server-side via Supabase Vault / Edge Functions.';
COMMENT ON COLUMN public.connections.is_active IS 'Whether this connection is currently active and should be used for data fetching.';

CREATE INDEX IF NOT EXISTS idx_connections_user_id ON public.connections (user_id);

CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- USER_PREFERENCES — App-wide settings per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE UNIQUE,
  theme         text NOT NULL DEFAULT 'system',
  preferences   jsonb NOT NULL DEFAULT '{}',
  schema_version integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_preferences IS 'Per-user application settings and preferences.';
COMMENT ON COLUMN public.user_preferences.theme IS 'UI theme: system, light, or dark.';
COMMENT ON COLUMN public.user_preferences.preferences IS 'Freeform JSONB for app settings (notification prefs, default sizes, etc.).';
COMMENT ON COLUMN public.user_preferences.user_id IS 'One preferences row per user (UNIQUE constraint).';

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY — All new tables
-- ============================================================================

-- ---------- profiles ----------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- No DELETE policy — profile deletion cascades from auth.users

-- ---------- widgets ----------
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own widgets"
  ON public.widgets
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can view published widgets"
  ON public.widgets
  FOR SELECT
  USING (is_published = true AND auth.role() = 'authenticated');

-- ---------- widget_versions ----------
ALTER TABLE public.widget_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own widget versions"
  ON public.widget_versions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own widget versions"
  ON public.widget_versions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- No UPDATE or DELETE policies — versions are immutable

-- ---------- connections ----------
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
  ON public.connections
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------- user_preferences ----------
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
