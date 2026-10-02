# WidgeBuddy — AI Contract

> This document tells an AI coding assistant (Claude, Gemini, GPT-4, etc.) everything it needs to  
> generate correct, consistent code for this project without reading the entire codebase.

---

## 1. Project in One Paragraph

WidgeBuddy is a React Native + Expo + TypeScript app where users connect data sources (weather, calendar, tasks, RSS) and compose configurable widgets on a dashboard. The backend is Supabase. All data is validated with Zod. Server state lives in TanStack Query; UI/editor state lives in Zustand. Widget definitions are renderer-agnostic JSON so they can be displayed in-app today and as native home-screen widgets later.

---

## 2. File Map (Cheat Sheet)

| Purpose | File |
|---|---|
| Zod schemas for all core types | `src/widgets/schema.ts` |
| Widget registry (type → definition) | `src/widgets/registry.ts` |
| Connector interface | `src/connectors/base/connector.types.ts` |
| Runtime connector dispatch | `src/services/connectorService.ts` |
| Supabase client (typed) | `src/services/supabase.ts` |
| TanStack Query client config | `src/services/queryClient.ts` |
| Editor Zustand store | `src/store/editorStore.ts` |
| Dashboard Zustand store | `src/store/dashboardStore.ts` |
| useWidgetData hook | `src/hooks/useWidgetData.ts` |
| Main widget renderer | `src/renderer/WidgetRenderer.tsx` |
| Architecture overview | `docs/architecture.md` |
| Widget schema spec | `docs/widget-schema.md` |
| Connector contract | `docs/connector-contract.md` |

---

## 3. Coding Conventions

### TypeScript

- `strict: true` in tsconfig. No `any` without a comment explaining why.
- Prefer `type` over `interface` for data shapes; use `interface` only for class contracts.
- Infer types from Zod schemas: `type Foo = z.infer<typeof FooSchema>`.
- Name Zod schemas with `Schema` suffix: `WidgetInstanceSchema`, `ConnectorDefSchema`.

### Imports

- Use path aliases: `@/connectors/...`, `@/widgets/...`, `@/services/...`, `@/store/...`  
  (configured in `tsconfig.json` and `babel.config.js`).
- Never import directly between `connectors/` and `renderer/`. All cross-layer communication flows through the normalised types in `src/widgets/schema.ts`.

### Naming

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `WidgetRenderer` |
| Hooks | camelCase, prefix `use` | `useWidgetData` |
| Zustand stores | camelCase, suffix `Store` | `editorStore` |
| Connector impls | camelCase, suffix `Connector` | `weatherConnector` |
| Zod schemas | PascalCase, suffix `Schema` | `NormalisedItemSchema` |
| Files | kebab-case | `weather-card.tsx` |
| DB columns | snake_case | `user_id`, `created_at` |

### React Native

- Use `StyleSheet.create(...)` — no inline style objects in JSX (performance).
- Prefer `FlatList` over `ScrollView` for lists.
- Use `React.memo` on widget view components — they re-render frequently.

---

## 4. Key Patterns

### Fetching widget data

```typescript
// src/hooks/useWidgetData.ts
import { useQuery } from '@tanstack/react-query';
import { fetchNormalisedData } from '@/services/connectorService';
import { WidgetInstance } from '@/widgets/schema';
import { useConnectorConfig } from './useConnectors';

export function useWidgetData(instance: WidgetInstance) {
  const config = useConnectorConfig(instance.connectorId);

  return useQuery({
    queryKey:  ['widget-data', instance.id, instance.connectorId],
    queryFn:   () => fetchNormalisedData(config.type, config.config),
    staleTime: config.staleTimeMs,
    enabled:   !!instance.connectorId && !!config,
  });
}
```

### Zustand store pattern

```typescript
// src/store/editorStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WidgetInstance } from '@/widgets/schema';

interface EditorState {
  draft:     Partial<WidgetInstance> | null;
  setDraft:  (draft: Partial<WidgetInstance>) => void;
  clearDraft: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      draft:     null,
      setDraft:  (draft) => set({ draft }),
      clearDraft: ()     => set({ draft: null }),
    }),
    { name: 'widget-editor-draft' },
  ),
);
```

### Adding a connector

1. Create `src/connectors/<name>/<name>.connector.ts`.
2. Implement `ConnectorDef<TConfig, TRaw>` (see `docs/connector-contract.md`).
3. Register in `src/services/connectorService.ts`.
4. Add widget definitions that list this connector type in `connectorTypes`.

### Adding a widget type

1. Create `src/widgets/built-in/<type>.ts` exporting a `WidgetDefinition`.
2. Register in `src/widgets/registry.ts`.
3. Create `src/renderer/views/<type>.tsx` accepting `{ instance, items }` props.
4. Add the view to the switch in `src/renderer/WidgetRenderer.tsx`.

---

## 5. DO / DON'T Rules

### DO
- Parse all external data with Zod before use.
- Keep connector `normalise()` as pure functions (no network, no side-effects).
- Use TanStack Query for any data that comes from a server or external API.
- Use Zustand only for local UI state (selection, drag, unsaved drafts).
- Write one connector per file; keep them small.

### DON'T
- Don't call Supabase directly from a component — go through a hook or service.
- Don't import renderer code into connectors or vice versa.
- Don't store sensitive credentials (API keys, OAuth tokens) in Zustand — use Supabase.
- Don't use `console.log` in production paths — use a logger utility.
- Don't add a new dependency without checking if an existing one covers the need.

---

## 6. Supabase Cheat Sheet

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.d.ts'; // generated types

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
);
```

- Generate TypeScript types with: `npx supabase gen types typescript --linked > src/types/supabase.d.ts`
- Always use `.eq('user_id', session.user.id)` even though RLS enforces it (defence in depth).
- Use `.select()` with explicit column lists — never `select('*')` in production queries.

---

## 7. Environment Variables

| Variable | Used by |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase client |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `OPENWEATHER_API_KEY` | Weather connector (stored in Supabase, not env) |

All connector API keys are stored in the `connectors.config` JSONB column per user — never in environment variables on the client.

---

## 8. Testing Conventions (future)

- Unit tests go in `__tests__/` next to the file under test.
- Test connector `normalise()` functions heavily — they are pure and easy to test.
- Test Zod schemas with valid and invalid inputs.
- Use `msw` (Mock Service Worker) for integration tests of connector `fetch()`.
- Do NOT test UI snapshot by default; prefer interaction tests with Testing Library.
