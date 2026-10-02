# AGENTS.md — WidgeBuddy Coding Guidelines for AI Assistants

> Read this file before writing any code for WidgeBuddy.  
> For deep context, read the full docs in `docs/`.

---

## Project Summary

WidgeBuddy is a React Native + Expo + TypeScript app.  
Users connect data sources (weather, calendar, tasks, RSS) and build configurable widgets on a dashboard.  
Backend: Supabase. Validation: Zod. Server state: TanStack Query. UI state: Zustand.

---

## Architecture (quick reference)

```
Layer 1 — CONNECTOR     src/connectors/<name>/
Layer 2 — NORMALISER    src/normaliser/
Layer 3 — WIDGET MODEL  src/widgets/
Layer 4 — RENDERER      src/renderer/
```

Cross-layer rule: **each layer only imports from the layer below it via typed interfaces**.  
Renderers never import connectors. Connectors never import widgets.

Full architecture: `docs/architecture.md`

---

## Key Files

| File | Purpose |
|---|---|
| `src/widgets/schema.ts` | ALL Zod schemas — start here |
| `src/widgets/registry.ts` | Widget type registry |
| `src/connectors/base/connector.types.ts` | ConnectorDef interface |
| `src/services/connectorService.ts` | Runtime connector dispatch |
| `src/services/supabase.ts` | Typed Supabase client |
| `docs/ai-contract.md` | Detailed coding conventions and patterns |

---

## Non-Negotiable Rules

1. **Zod first** — All external data MUST be parsed with Zod before use. No raw `JSON.parse` without a schema.
2. **Layer boundaries** — Never import across non-adjacent layers.
3. **No inline styles** — Use `StyleSheet.create(...)` in React Native components.
4. **No `any`** — Use `unknown` and narrow properly. If `any` is unavoidable, add a `// REASON: ...` comment.
5. **TanStack Query for server data, Zustand for UI state** — Do not store server data in Zustand or put ephemeral UI state in TanStack Query.
6. **No secrets on the client** — API keys and OAuth tokens live in Supabase. Never in env vars, AsyncStorage, or Zustand.
7. **Pure normalisers** — `ConnectorDef.normalise()` must be a pure function. No network calls, no side-effects.

---

## How to Add Things

### New connector
1. `src/connectors/<name>/<name>.connector.ts` implementing `ConnectorDef`
2. Register in `src/services/connectorService.ts`
3. See `docs/connector-contract.md` for the full spec

### New widget type
1. `src/widgets/built-in/<type>.ts` — export a `WidgetDefinition`
2. Register in `src/widgets/registry.ts`
3. `src/renderer/views/<type>.tsx` — the React Native view component
4. Add to the switch in `src/renderer/WidgetRenderer.tsx`

### New Supabase table
1. Create a migration in `supabase/migrations/`
2. Run `npx supabase gen types typescript --linked > src/types/supabase.d.ts`
3. Add RLS policies

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `WeatherCard` |
| Hooks | `use` prefix, camelCase | `useWidgetData` |
| Zustand stores | camelCase, `Store` suffix | `editorStore` |
| Connector impls | camelCase, `Connector` suffix | `weatherConnector` |
| Zod schemas | PascalCase, `Schema` suffix | `WidgetInstanceSchema` |
| Files | kebab-case | `weather-card.tsx` |
| DB columns | snake_case | `user_id` |

---

## Full Documentation

| Doc | Contents |
|---|---|
| `docs/architecture.md` | System design, data flow, DB schema |
| `docs/widget-schema.md` | Widget JSON model, Zod types, examples |
| `docs/connector-contract.md` | ConnectorDef interface + reference impl |
| `docs/ai-contract.md` | Patterns, conventions, DO/DON'T rules |
| `docs/decisions.md` | Architecture Decision Records |
