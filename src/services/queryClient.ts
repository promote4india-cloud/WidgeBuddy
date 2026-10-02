/**
 * src/services/queryClient.ts
 *
 * TanStack Query client configuration.
 * Import `queryClient` to use with QueryClientProvider in app/_layout.tsx.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** 5 minutes global default — overridden per-connector via staleTimeMs */
      staleTime: 5 * 60 * 1000,
      /** Retry failed queries up to 2 times with exponential backoff */
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: {
      retry: 0,
    },
  },
});
