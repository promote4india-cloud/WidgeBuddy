-- supabase/migrations/20260919000000_initial.sql
-- Initial schema migration for WidgeBuddy.
-- Run via: npx supabase db push
-- Auth is handled by Supabase (auth.users table exists by default).

-- ---------------------------------------------------------------------------
-- connectors — installed data source configs per user
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.connectors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type        text NOT NULL,        -- 'openweather' | 'google_calendar' | 'todoist' | 'rss'
  config      jsonb NOT NULL,       -- encrypted creds / tokens (use Supabase Vault for OAuth)
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- widget_definitions — blueprints for widget types
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.widget_definitions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users ON DELETE CASCADE,  -- NULL = built-in
  type          text NOT NULL UNIQUE,      -- 'weather-card' | 'calendar-list' | ...
  config_schema jsonb NOT NULL,            -- JSON Schema for user-facing config fields
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- widget_instances — placed widget copies on a dashboard
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.widget_instances (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  definition_id uuid NOT NULL REFERENCES public.widget_definitions ON DELETE CASCADE,
  connector_id  uuid REFERENCES public.connectors ON DELETE SET NULL,
  layout        jsonb NOT NULL,     -- { page, x, y, w, h }
  user_config   jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER widget_instances_updated_at
  BEFORE UPDATE ON public.widget_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.connectors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connectors"
  ON public.connectors
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own widget instances"
  ON public.widget_instances
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- widget_definitions are readable by all (built-ins are public)
ALTER TABLE public.widget_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Widget definitions are readable by all authenticated users"
  ON public.widget_definitions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own widget definitions"
  ON public.widget_definitions
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());
