/**
 * src/store/dashboardStore.ts
 *
 * Zustand store for dashboard UI state.
 * Ephemeral — not persisted. Resets on app restart.
 *
 * Use this store for: selected widget, current page.
 * Do NOT use this store for: widget instance data (use TanStack Query).
 */

import { create } from 'zustand';

interface DashboardState {
  /** ID of the currently focused/selected widget instance, or null. */
  selectedWidgetId: string | null;
  /** Current dashboard page index (zero-based). */
  currentPage: number;
  /** Whether the dashboard is in "edit mode" (drag/resize enabled). */
  isEditMode: boolean;

  // Actions
  selectWidget: (id: string | null) => void;
  setPage: (page: number) => void;
  enterEditMode: () => void;
  exitEditMode: () => void;
  toggleEditMode: () => void;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  selectedWidgetId: null,
  currentPage: 0,
  isEditMode: false,

  selectWidget: (id) => set({ selectedWidgetId: id }),

  setPage: (page) => set({ currentPage: page }),

  enterEditMode: () => set({ isEditMode: true }),

  exitEditMode: () =>
    set({ isEditMode: false, selectedWidgetId: null }),

  toggleEditMode: () =>
    set({ isEditMode: !get().isEditMode }),
}));
