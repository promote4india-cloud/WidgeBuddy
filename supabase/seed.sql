-- supabase/seed.sql
-- Inserts built-in widget_definitions and initial development seed data.
-- Run after migrations: npx supabase db seed

-- 1. Built-in legacy widget definitions
INSERT INTO public.widget_definitions (type, config_schema) VALUES
  ('clock',          '{"fields":[{"key":"format","type":"select"},{"key":"showSeconds","type":"boolean"},{"key":"showDate","type":"boolean"}]}'::jsonb),
  ('weather-card',   '{"fields":[{"key":"unit","type":"select"},{"key":"showForecast","type":"boolean"}]}'::jsonb),
  ('calendar-list',  '{"fields":[{"key":"maxEvents","type":"number"},{"key":"lookaheadDays","type":"number"},{"key":"showAllDay","type":"boolean"}]}'::jsonb),
  ('task-list',      '{"fields":[{"key":"maxTasks","type":"number"},{"key":"showCompleted","type":"boolean"},{"key":"filter","type":"select"}]}'::jsonb),
  ('rss-feed',       '{"fields":[{"key":"maxItems","type":"number"},{"key":"showImages","type":"boolean"}]}'::jsonb)
ON CONFLICT (type) DO NOTHING;

-- NOTE:
-- Tables created in 20260919100000_backend_foundation.sql:
--   - profiles
--   - widgets
--   - widget_versions
--   - connections
--   - user_preferences
-- All link directly to `auth.users(id)` and have Row Level Security enabled.
-- In development, user records are created automatically via auth.users triggers or test fixtures.
