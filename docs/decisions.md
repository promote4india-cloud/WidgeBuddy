# WidgeBuddy — Architecture Decision Records

> ADRs capture *why* decisions were made, not just *what* was decided.  
> Format: lightweight (status, context, decision, consequences).

---

## ADR-001 — Use Supabase instead of a custom backend

**Status**: Accepted  
**Date**: 2026-09-19

### Context
A solo developer needs auth, a database, storage, and the ability to run small server-side functions without building and deploying a full backend server.

### Decision
Use Supabase as the entire backend: Postgres for data, Auth for user management, Row-Level Security for multi-tenancy, Storage for assets, and Edge Functions for server-side logic (e.g. OAuth callbacks).

### Consequences
- ✅ Zero backend infrastructure to maintain
- ✅ Realtime subscriptions built-in
- ✅ Typed client generated from DB schema
- ⚠️ Vendor lock-in — mitigated by keeping Supabase calls in `src/services/` only
- ⚠️ Edge Functions are Deno-based — minor context switch from Node

---

## ADR-002 — Zod as single schema source of truth

**Status**: Accepted  
**Date**: 2026-09-19

### Context
The app needs runtime validation of data from external APIs, user input in the widget editor, and stored JSON in Supabase. Keeping TypeScript types and validation logic in sync manually is error-prone.

### Decision
Define all data shapes as Zod schemas in `src/widgets/schema.ts` and infer TypeScript types from them. No hand-written interfaces for validated data.

### Consequences
- ✅ Types and validation are always in sync
- ✅ Zod parse errors are descriptive — useful in the editor
- ✅ AI assistants can read the schema file to understand all data shapes
- ⚠️ Zod adds ~13 KB to the bundle (acceptable)

---

## ADR-003 — TanStack Query for server state, Zustand for UI state

**Status**: Accepted  
**Date**: 2026-09-19

### Context
Two categories of state exist: (1) data that lives on servers (widget instances, connector data) and (2) ephemeral UI state (which widget is selected, the current drag position, an unsaved editor draft). Mixing them into one store leads to stale data and unnecessary complexity.

### Decision
- **TanStack Query v5** manages all server/remote state: fetching, caching, background refetch, and invalidation.
- **Zustand** manages all local UI state that doesn't need to survive beyond the current session (or does so via AsyncStorage persist middleware).

### Consequences
- ✅ Clear separation — no manual cache invalidation logic
- ✅ DevTools available for both
- ✅ Zustand is extremely lightweight (~1 KB)
- ⚠️ Developers must know which store to reach for — documented in `docs/ai-contract.md`

---

## ADR-004 — Declarative renderer-agnostic widget JSON model

**Status**: Accepted  
**Date**: 2026-09-19

### Context
The app needs to render widgets in React Native today and in native home-screen widgets (Android Glance, iOS WidgetKit) later. If widget logic is coupled to React Native, porting to native widgets requires a full rewrite.

### Decision
Widget definitions are pure JSON (validated by Zod). They describe *what* to display and *what config is needed*, not *how* to render. Renderers are separate modules that read the JSON model. This mirrors how tools like React Native Sketch Elements and Lottie work.

### Consequences
- ✅ Native renderers can be added without changing Layers 1–3
- ✅ AI can generate new widget definitions from the schema alone
- ✅ Definitions can be shared/sync'd to a CDN later
- ⚠️ More indirection than a simpler React-only approach — worth it for the native widget goal

---

## ADR-005 — Expo Managed Workflow

**Status**: Accepted  
**Date**: 2026-09-19

### Context
A solo developer should not spend time on Android Studio / Xcode configuration unless absolutely necessary.

### Decision
Use Expo Managed Workflow with Expo Router. Native modules that are not in the Expo SDK will be added via Config Plugins or custom Expo Modules when needed (primarily for native widgets, post-MVP).

### Consequences
- ✅ OTA updates via EAS Update
- ✅ No native build toolchain needed for development
- ✅ Expo Router handles navigation and deep links
- ⚠️ Ejecting would be required for complex native modules — not anticipated until native widget phase

---

## ADR-006 — 6-column grid layout

**Status**: Accepted  
**Date**: 2026-09-19

### Context
A dashboard grid needs a column count that allows both small (1×1, 2×2) and large (4×2, 6×2) widgets on a typical phone screen.

### Decision
Default grid is 6 columns. Widget definitions declare `minW`, `minH`, `maxW`, `maxH`. Users can resize within those bounds in the editor.

### Consequences
- ✅ Enough flexibility for diverse widget sizes
- ✅ Simple integer math for layout calculations
- ⚠️ Tablet layouts may need a wider grid — configurable per dashboard in schema, deferred to v2

---

## ADR-007 — Connector API keys stored in Supabase, not device

**Status**: Accepted  
**Date**: 2026-09-19

### Context
Users supply API keys (e.g. OpenWeather) to connect data sources. Storing them in AsyncStorage or SecureStore on the device means they are lost on reinstall and not synced across devices.

### Decision
Store connector configs (including API keys) in the `connectors.config` JSONB column in Supabase, encrypted at rest. Use Supabase Vault for high-sensitivity secrets (OAuth tokens). Keys are fetched at runtime and never persisted in the client state beyond the current session.

### Consequences
- ✅ Keys survive reinstall and sync across devices
- ✅ RLS ensures users can only read their own keys
- ⚠️ Keys are transmitted over the network on each session start — mitigated by HTTPS + short-lived JWTs
