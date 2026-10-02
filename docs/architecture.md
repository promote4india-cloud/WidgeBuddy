# WidgeBuddy — Architecture

> **Status**: MVP Design v0.1 · **Updated**: 2026-09-19

---

## 1. Overview

WidgeBuddy lets users connect external data sources (calendar, weather, tasks, RSS …) and compose configurable **widgets** that display normalised information from those sources. The long-term goal is native Android / iOS home-screen widgets; the immediate goal is a polished in-app dashboard.

### Design Principles

| Principle | Implication |
|---|---|
| MVP-first | Build the minimum that works; defer anything speculative |
| Renderer-agnostic widget model | Widgets are JSON; renderers are pluggable |
| Single source of truth per concern | Remote data → TanStack Query · UI state → Zustand · Persistence → Supabase |
| Solo-dev friendly | Fewest moving parts; AI can understand every file |

---

## 2. Four-Layer Model

```
┌─────────────────────────────────────────────────────┐
│  Layer 4 — RENDERER                                 │
│  React Native views  │  (future) Glance / WidgetKit │
├─────────────────────────────────────────────────────┤
│  Layer 3 — WIDGET MODEL                             │
│  Declarative JSON validated by Zod                  │
│  WidgetDefinition · WidgetInstance · WidgetLayout   │
├─────────────────────────────────────────────────────┤
│  Layer 2 — NORMALISER                               │
│  ConnectorData → NormalisedItem[]                   │
│  One transform function per connector type          │
├─────────────────────────────────────────────────────┤
│  Layer 1 — CONNECTOR                                │
│  OAuth / API keys / device sensors                  │
│  Google Calendar · OpenWeather · Todoist · RSS …    │
└─────────────────────────────────────────────────────┘
```

Layers communicate through typed interfaces only. Renderers never call connectors; connectors never know what widget displays their data.

---

## 3. Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Mobile app | React Native + Expo SDK 51 | Managed workflow; OTA; no native toolchain needed |
| Language | TypeScript (strict mode) | End-to-end type safety |
| Backend / DB / Auth | Supabase | Postgres + RLS + Auth + Storage in one service |
| Runtime validation | Zod | Schema → TypeScript types + parse + error messages |
| Server state | TanStack Query v5 | Caching, background refetch, query invalidation |
| Local / UI state | Zustand | Widget editor, drag state, ephemeral selection |
| Navigation | Expo Router (file-based) | Simple; works with Expo web if needed later |
| Native widgets (future) | Expo Modules + Glance / WidgetKit | Bridge via same JSON model |

---

## 4. Data Flow

```
User Action
    │
    ▼
[Zustand — UI state (editor / drag / selection)]
    │  triggers
    ▼
[TanStack Query — queryFn calls ConnectorService]
    │  raw API response
    ▼
[Normaliser — raw → NormalisedItem[]]
    │
    ▼
[Supabase — persist / read widget instances & connector configs]
    │
    ▼
[Renderer — WidgetInstance + NormalisedItem[] → React Native view]
```

### Caching

- **TanStack Query** owns all remote data. `staleTime` is set per connector:
  - Weather: 10 minutes
  - Calendar: 2 minutes
  - Tasks: 30 seconds
  - RSS: 15 minutes
- **Supabase Realtime** optionally triggers query invalidation for shared dashboards.
- **Zustand + AsyncStorage** persists the unsaved widget editor draft across app restarts.

---

## 5. Folder Structure

```
WidgeBuddy/
├── app/                          # Expo Router pages
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── editor.tsx
│   │   └── settings.tsx
│   └── _layout.tsx
│
├── src/
│   ├── connectors/               # Layer 1 — one sub-folder per integration
│   │   ├── base/
│   │   │   └── connector.types.ts
│   │   ├── weather/
│   │   ├── calendar/
│   │   ├── tasks/
│   │   └── rss/
│   │
│   ├── normaliser/               # Layer 2
│   │   └── index.ts
│   │
│   ├── widgets/                  # Layer 3
│   │   ├── schema.ts             # Zod schemas — single source of truth
│   │   ├── registry.ts
│   │   └── built-in/
│   │
│   ├── renderer/                 # Layer 4
│   │   ├── WidgetRenderer.tsx
│   │   └── views/
│   │
│   ├── services/
│   │   ├── supabase.ts
│   │   └── queryClient.ts
│   │
│   ├── store/
│   │   ├── editorStore.ts
│   │   └── dashboardStore.ts
│   │
│   ├── hooks/
│   │   ├── useWidgetData.ts
│   │   └── useConnectors.ts
│   │
│   ├── lib/
│   └── types/
│
├── docs/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── AGENTS.md
└── package.json
```

---

## 6. Database Schema

```sql
-- Auth handled by Supabase (auth.users)

CREATE TABLE connectors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type        text NOT NULL,
  config      jsonb NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE widget_definitions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users ON DELETE CASCADE,
  type          text NOT NULL UNIQUE,
  config_schema jsonb NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE widget_instances (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  definition_id uuid NOT NULL REFERENCES widget_definitions,
  connector_id  uuid REFERENCES connectors,
  layout        jsonb NOT NULL,
  user_config   jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Row-Level Security
ALTER TABLE connectors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_instances  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON connectors       USING (user_id = auth.uid());
CREATE POLICY "own rows" ON widget_instances USING (user_id = auth.uid());
```

---

## 7. State Management Responsibility Matrix

| What | Owner | Why |
|---|---|---|
| Widget instances (remote) | TanStack Query | Needs caching + background refresh |
| Connector credentials | Supabase (encrypted) | Sensitive; server-side |
| Dashboard layout during drag | Zustand editorStore | Ephemeral, high-frequency updates |
| Selected / focused widget | Zustand dashboardStore | UI-only, not persisted |
| Auth session | Supabase Auth SDK | Built-in token refresh |

---

## 8. Native Widget Path (Post-MVP)

An Expo Module will bridge React Native to Android Glance / iOS WidgetKit:

1. A background task syncs widget_instances to a local SQLite mirror.
2. The native module reads the same WidgetDefinition JSON.
3. A minimal interpreter renders it via Jetpack Compose (Android) or SwiftUI (iOS).

No changes to Layers 1-3 are required because the widget model is renderer-agnostic.

---

## 9. Complexity Budget (Solo Dev Rules)

| Removed | Reason |
|---|---|
| Separate API server | Supabase Edge Functions handle server logic |
| GraphQL | REST + Supabase client is sufficient |
| Redux / MobX / Jotai | Zustand is lighter and fully typed |
| Custom auth server | Supabase Auth covers OAuth + JWT |
| Monorepo (Nx / Turborepo) | Promote only if a separate web app is added |
| Event bus / pub-sub | TanStack Query invalidation replaces it |

---

## 10. Open Questions

- [ ] OAuth token refresh strategy: Supabase Vault vs Edge Function proxy?
- [ ] Multi-dashboard support: schema supports it; MVP ships one page.
- [ ] Widget sharing: defer to v2.
- [ ] Full offline mode: defer to v2.
