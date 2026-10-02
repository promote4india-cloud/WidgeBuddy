# WidgeBuddy — Connector Contract

> Every external integration (weather, calendar, tasks, RSS, …) is a **Connector**.  
> This document defines the interface that every connector MUST implement.

---

## 1. What a Connector Is

A connector is a TypeScript module that:

1. **Fetches** raw data from an external source (HTTP API, device sensor, etc.).
2. **Normalises** that data into `NormalisedItem[]`.
3. **Declares** its metadata so the UI can discover and configure it.

Connectors live in `src/connectors/<name>/` and must export a single `ConnectorDef` object.

---

## 2. ConnectorDef Interface

```typescript
// src/connectors/base/connector.types.ts

import { z } from 'zod';
import { NormalisedItem } from '../../widgets/schema';

/** Connector-level metadata exposed in the UI */
export interface ConnectorMeta {
  type:        string;           // unique slug, e.g. 'openweather'
  displayName: string;
  description: string;
  iconUrl?:    string;
  authType:    'none' | 'apiKey' | 'oauth2';
}

/**
 * The config schema defines what fields the user must fill in
 * when installing the connector (API key, city name, etc.)
 */
export interface ConnectorDef<TConfig = unknown, TRaw = unknown> {
  meta:         ConnectorMeta;
  configSchema: z.ZodType<TConfig>;  // validated before saving to Supabase

  /**
   * Fetch raw data from the external source.
   * @param config - Parsed connector config (already Zod-validated)
   * @param params - Runtime params passed by the widget (e.g. date range)
   * @returns Raw API response (connector-specific shape)
   */
  fetch(config: TConfig, params?: Record<string, unknown>): Promise<TRaw>;

  /**
   * Transform raw response into normalised items the renderer can use.
   * Must be a pure function — no side-effects, no network calls.
   */
  normalise(raw: TRaw, config: TConfig): NormalisedItem[];

  /**
   * Optional: default staleTime in milliseconds for TanStack Query.
   * Overrides the global default for this connector type.
   */
  staleTimeMs?: number;
}
```

---

## 3. Reference Implementation — OpenWeather

```typescript
// src/connectors/weather/weather.connector.ts

import { z }             from 'zod';
import { ConnectorDef }  from '../base/connector.types';
import { NormalisedItem } from '../../widgets/schema';

// Config schema — validated when user installs the connector
const WeatherConfigSchema = z.object({
  apiKey:  z.string().min(1),
  city:    z.string().min(1),
  country: z.string().length(2).default('US'),
});
type WeatherConfig = z.infer<typeof WeatherConfigSchema>;

// Shape of the OpenWeather API response (minimal subset)
interface OWCurrent {
  weather: { description: string; icon: string }[];
  main:    { temp: number; feels_like: number; humidity: number };
  dt:      number;
  name:    string;
}

export const weatherConnector: ConnectorDef<WeatherConfig, OWCurrent> = {
  meta: {
    type:        'openweather',
    displayName: 'OpenWeather',
    description: 'Current conditions and forecasts from OpenWeatherMap',
    authType:    'apiKey',
  },

  configSchema: WeatherConfigSchema,

  async fetch(config) {
    const url = `https://api.openweathermap.org/data/2.5/weather`
      + `?q=${config.city},${config.country}`
      + `&appid=${config.apiKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenWeather: ${res.status} ${res.statusText}`);
    return res.json() as Promise<OWCurrent>;
  },

  normalise(raw, _config): NormalisedItem[] {
    return [{
      id:          `weather-current-${raw.dt}`,
      connectorId: 'openweather',
      type:        'weather.current',
      title:       raw.weather[0]?.description ?? 'Weather',
      updatedAt:   new Date(raw.dt * 1000).toISOString(),
      meta: {
        temp:      raw.main.temp,
        feelsLike: raw.main.feels_like,
        humidity:  raw.main.humidity,
        icon:      `https://openweathermap.org/img/wn/${raw.weather[0]?.icon}@2x.png`,
        condition: raw.weather[0]?.description,
      },
    }];
  },

  staleTimeMs: 10 * 60 * 1000, // 10 minutes
};
```

---

## 4. ConnectorService — Runtime Dispatch

```typescript
// src/services/connectorService.ts

import { ConnectorDef }  from '../connectors/base/connector.types';
import { NormalisedItem } from '../widgets/schema';
import { weatherConnector } from '../connectors/weather/weather.connector';
// import other connectors as added ...

const CONNECTOR_REGISTRY: Record<string, ConnectorDef> = {
  openweather: weatherConnector,
  // google_calendar: calendarConnector,
  // todoist: todoistConnector,
  // rss: rssConnector,
};

export async function fetchNormalisedData(
  connectorType: string,
  config:        unknown,
  params?:       Record<string, unknown>,
): Promise<NormalisedItem[]> {
  const def = CONNECTOR_REGISTRY[connectorType];
  if (!def) throw new Error(`Unknown connector type: ${connectorType}`);

  // Runtime validate config before use
  const parsedConfig = def.configSchema.parse(config);
  const raw          = await def.fetch(parsedConfig, params);
  return def.normalise(raw, parsedConfig);
}
```

---

## 5. Adding a New Connector — Checklist

```
src/connectors/<name>/
├── <name>.connector.ts    # ConnectorDef implementation
└── <name>.normaliser.ts   # (optional) if normalise logic is large
```

1. Create the folder and implement `ConnectorDef`.
2. Register it in `src/services/connectorService.ts`.
3. Add the connector type string to `connectorTypes` in any compatible `WidgetDefinition`.
4. Add a Supabase migration if the config shape needs special indexing.
5. Document the `NormalisedItem` types and `meta` fields the connector produces in `docs/widget-schema.md`.

---

## 6. Auth Handling

| Auth type | How |
|---|---|
| `none` | No creds needed (e.g. public RSS) |
| `apiKey` | User pastes key; stored in `connectors.config` (jsonb, encrypted at rest) |
| `oauth2` | Supabase Edge Function acts as OAuth callback receiver; stores tokens in `connectors.config` |

OAuth refresh tokens are **never sent to the client**. The Edge Function refreshes tokens on behalf of the user and returns only the data.

---

## 7. Error Handling Contract

`fetch()` must:
- Throw a typed error (extend `ConnectorError`) with a human-readable `message` and optional `code`.
- Never swallow errors silently.

TanStack Query surfaces errors via `useQuery(...).error` and the renderer shows a widget-level error state.

```typescript
export class ConnectorError extends Error {
  constructor(
    message: string,
    public code?: string,
    public retryable: boolean = true,
  ) {
    super(message);
    this.name = 'ConnectorError';
  }
}
```
