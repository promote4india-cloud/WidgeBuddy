/**
 * src/query/useWidgetQuery.ts
 *
 * React Hook for executing declarative widget queries in components.
 * Manages loading states, error states, and cached normalized results.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { UniversalItem } from '@/widgets/schema';
import { widgetQueryEngine } from './queryEngine';
import { WidgetQueryOptions, WidgetQueryResult } from './query.types';

export interface UseWidgetQueryReturn<T = UniversalItem | UniversalItem[] | null> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isCached: boolean;
  refetch: () => Promise<void>;
}

export function useWidgetQuery<T = UniversalItem | UniversalItem[] | null>(
  query: string,
  options?: WidgetQueryOptions,
): UseWidgetQueryReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const queryOptions: WidgetQueryOptions = {
          ...optionsRef.current,
          forceRefresh: Boolean(force || optionsRef.current?.forceRefresh),
        };

        const result: WidgetQueryResult<T> = await widgetQueryEngine.execute<T>(
          query,
          queryOptions,
        );

        setData(result.data);
        setIsCached(result.isCached);
        setIsLoading(false);
      } catch (err: unknown) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        setIsError(true);
        setIsLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    execute(false);
  }, [execute]);

  const refetch = useCallback(() => execute(true), [execute]);

  return {
    data,
    isLoading,
    isError,
    error,
    isCached,
    refetch,
  };
}
