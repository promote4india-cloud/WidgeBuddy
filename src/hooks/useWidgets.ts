/**
 * src/hooks/useWidgets.ts
 *
 * TanStack Query hooks for WidgetRepository CRUD operations.
 *
 * Uses getWidgetRepository() so hooks are fully decoupled from the storage
 * backend. All mutations automatically invalidate the ['widgets'] query key,
 * keeping the dashboard and widget library in sync.
 *
 * Rule: TanStack Query for server/persisted data, Zustand for UI state.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DeclarativeWidgetDefinition,
  ParsedDeclarativeWidgetDefinition,
} from '@/widgets/declarative/definition';
import { getWidgetRepository } from '@/repositories';

/** Query key used by all widget list queries. */
const WIDGETS_KEY = ['widgets'] as const;

/** Query key for a single widget by ID. */
function widgetKey(id: string) {
  return ['widgets', id] as const;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetches all persisted widget definitions.
 *
 * Usage:
 * ```tsx
 * const { widgets, isLoading, isError } = useWidgets();
 * ```
 */
export function useWidgets() {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ParsedDeclarativeWidgetDefinition[],
    Error
  >({
    queryKey: WIDGETS_KEY,
    queryFn: () => getWidgetRepository().list(),
  });

  return {
    widgets: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Fetches a single persisted widget definition by ID.
 *
 * Usage:
 * ```tsx
 * const { widget, isLoading } = useWidget('my-widget-id');
 * ```
 */
export function useWidget(id: string | null) {
  const { data, isLoading, isError, error } = useQuery<
    ParsedDeclarativeWidgetDefinition | null,
    Error
  >({
    queryKey: widgetKey(id ?? ''),
    queryFn: () => (id ? getWidgetRepository().get(id) : Promise.resolve(null)),
    enabled: !!id,
  });

  return {
    widget: data ?? null,
    isLoading,
    isError,
    error,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Mutation hook to create a new widget definition.
 *
 * Usage:
 * ```tsx
 * const createWidget = useCreateWidget();
 * createWidget.mutate(widgetDef, { onSuccess: (saved) => { ... } });
 * ```
 */
export function useCreateWidget() {
  const queryClient = useQueryClient();

  return useMutation<
    ParsedDeclarativeWidgetDefinition,
    Error,
    DeclarativeWidgetDefinition
  >({
    mutationFn: (widget) => getWidgetRepository().create(widget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_KEY });
    },
  });
}

/**
 * Mutation hook to update an existing widget definition.
 *
 * Usage:
 * ```tsx
 * const updateWidget = useUpdateWidget();
 * updateWidget.mutate({ id: 'my-widget', widget: updatedDef });
 * ```
 */
export function useUpdateWidget() {
  const queryClient = useQueryClient();

  return useMutation<
    ParsedDeclarativeWidgetDefinition,
    Error,
    { id: string; widget: DeclarativeWidgetDefinition }
  >({
    mutationFn: ({ id, widget }) => getWidgetRepository().update(id, widget),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_KEY });
      queryClient.invalidateQueries({ queryKey: widgetKey(variables.id) });
    },
  });
}

/**
 * Mutation hook to delete a widget definition.
 *
 * Usage:
 * ```tsx
 * const deleteWidget = useDeleteWidget();
 * deleteWidget.mutate('my-widget-id');
 * ```
 */
export function useDeleteWidget() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: (id) => getWidgetRepository().delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_KEY });
      queryClient.invalidateQueries({ queryKey: widgetKey(id) });
    },
  });
}
