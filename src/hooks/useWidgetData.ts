/**
 * src/hooks/useWidgetData.ts
 *
 * TanStack Query hook — fetches normalised data for a widget instance.
 *
 * Handles:
 * - Skipping the query for connector-less widgets (e.g. Clock)
 * - Per-connector staleTime
 * - ConnectorError propagation to the renderer
 */

import { useQuery } from '@tanstack/react-query';
import { WidgetInstance, UniversalItem } from '@/widgets/schema';
import { fetchNormalisedData, getConnectorStaleTime } from '@/services/connectorService';
import { useConnectorConfig } from './useConnectors';

export interface UseWidgetDataResult {
  items: UniversalItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches normalised data for a widget instance.
 *
 * Returns empty items immediately for widgets with no connectorId (e.g. Clock).
 * Query is disabled until the connector config is available.
 */
export function useWidgetData(instance: WidgetInstance): UseWidgetDataResult {
  const connectorConfig = useConnectorConfig(instance.connectorId);

  const { data, isLoading, isError, error, refetch } = useQuery<UniversalItem[], Error>({
    queryKey: ['widget-data', instance.id, instance.connectorId],
    queryFn: () => {
      if (!connectorConfig) {
        return Promise.resolve([]);
      }
      return fetchNormalisedData(
        connectorConfig.type,
        connectorConfig.config,
      );
    },
    enabled: !!instance.connectorId && !!connectorConfig,
    staleTime: connectorConfig?.staleTimeMs ?? getConnectorStaleTime(connectorConfig?.type ?? ''),
  });

  return {
    items: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
