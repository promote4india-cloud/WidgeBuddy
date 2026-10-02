/**
 * src/hooks/useConnectors.ts
 *
 * Hooks for listing and reading installed connector configs from Supabase.
 *
 * NOTE: These are stubs — real Supabase queries will be implemented in a later prompt.
 * The return shapes and hook signatures are final.
 */

import { useQuery } from '@tanstack/react-query';
import { ConnectorMeta } from '@/connectors/base/connector.types';
import { getAllConnectorMetas } from '@/services/connectorService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstalledConnector {
  id: string;
  type: string;
  meta: ConnectorMeta;
  /** Raw config from Supabase (connector-specific shape) */
  config: unknown;
  staleTimeMs?: number;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Returns all connector metas available in the registry (installed or not).
 * Used by the connector picker UI.
 */
export function useAvailableConnectors(): ConnectorMeta[] {
  return getAllConnectorMetas();
}

/**
 * Returns the installed connectors for the current user from Supabase.
 * STUB: returns empty array until Supabase auth is wired up.
 */
export function useInstalledConnectors() {
  return useQuery<InstalledConnector[]>({
    queryKey: ['connectors'],
    queryFn: async (): Promise<InstalledConnector[]> => {
      // Default connectors configured for local mode
      return [
        {
          id: 'weather',
          type: 'weather',
          meta: {
            id: 'weather',
            name: 'Weather',
            type: 'weather',
            displayName: 'Weather',
            description: 'Live weather conditions & forecast',
            authType: 'none',
            staleTimeMs: 10 * 60 * 1000,
          },
          config: {
            useCurrentLocation: true,
            units: 'celsius',
            fallbackCity: 'New York',
          },
          staleTimeMs: 10 * 60 * 1000,
        },
        {
          id: 'openweather',
          type: 'openweather',
          meta: {
            id: 'openweather',
            name: 'OpenWeather',
            type: 'openweather',
            displayName: 'OpenWeather',
            description: 'Live weather conditions & forecast',
            authType: 'none',
            staleTimeMs: 10 * 60 * 1000,
          },
          config: {
            useCurrentLocation: true,
            units: 'celsius',
            fallbackCity: 'New York',
          },
          staleTimeMs: 10 * 60 * 1000,
        },
      ];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Returns the config for a specific installed connector by its ID or type.
 */
export function useConnectorConfig(connectorId: string | null): InstalledConnector | null {
  const { data } = useInstalledConnectors();
  if (!connectorId || !data) return null;
  return data.find((c) => c.id === connectorId || c.type === connectorId) ?? null;
}
