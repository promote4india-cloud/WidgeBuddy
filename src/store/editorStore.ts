/**
 * src/store/editorStore.ts
 *
 * Zustand store for temporary widget editor state.
 *
 * Requirements:
 * - Use Zustand ONLY for temporary editor state (draft, activeSize, selectedElementId, palette state).
 * - Use DeclarativeWidgetDefinition as the single source of truth.
 * - Do NOT create a second widget representation.
 * - Persisted widgets are saved to AsyncStorage via localWidgetService, not here.
 */

import { create } from 'zustand';
import { DeclarativeWidgetDefinition } from '@/widgets/declarative/definition';
import { WidgetSize } from '@/widgets/declarative/layout';
import {
  WidgetElement,
  ContainerElement,
  Padding,
} from '@/widgets/declarative/elements';
import {
  WidgetElementType,
  createDefaultElement,
  insertElement,
  removeElement,
  moveElement,
  updateElement,
  assignMissingIds,
  generateElementId,
} from '@/editor/utils/treeUtils';
import { getTemplate } from '@/editor/templates';

export interface EditorState {
  /** Unsaved widget definition draft. Null when editor is closed. */
  draft: DeclarativeWidgetDefinition | null;
  /** Active size layout being edited and previewed ('small' | 'medium' | 'large') */
  activeSize: WidgetSize;
  /** ID of the element currently selected for editing in the property inspector */
  selectedElementId: string | null;
  /** Whether the "+ Add Component" palette modal is open */
  isPaletteOpen: boolean;
  /** Container ID where newly selected component from palette should be placed (null = root) */
  paletteParentId: string | null;

  // Actions
  initNewWidget: (templateId?: string) => void;
  loadWidget: (definition: DeclarativeWidgetDefinition) => void;
  setName: (displayName: string) => void;
  setDescription: (description: string) => void;
  setCategory: (category: string) => void;
  setActiveSize: (size: WidgetSize) => void;
  setSupportedSizes: (sizes: WidgetSize[]) => void;
  selectElement: (id: string | null) => void;
  openPalette: (targetContainerId?: string) => void;
  closePalette: () => void;
  addElement: (type: WidgetElementType, parentId?: string) => void;
  removeElement: (elementId: string) => void;
  reorderElement: (elementId: string, direction: 'up' | 'down') => void;
  updateElement: (elementId: string, patch: Partial<WidgetElement>) => void;
  updateActiveLayout: (patch: { backgroundColor?: string; padding?: Padding }) => void;
  reset: () => void;
}

/**
 * Creates a slug from a display name, e.g. "My Day Widget" -> "my-day-widget"
 */
function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return base.length > 0 ? base : 'custom-widget';
}

export const useEditorStore = create<EditorState>((set, get) => ({
  draft: null,
  activeSize: 'medium',
  selectedElementId: null,
  isPaletteOpen: false,
  paletteParentId: null,

  initNewWidget: (templateId = 'my-day') => {
    const template = getTemplate(templateId);
    // Deep clone template definition so edits don't mutate template constant
    const clonedDef: DeclarativeWidgetDefinition = JSON.parse(JSON.stringify(template.definition));
    
    // Assign fresh IDs to all root containers and children
    for (const size of Object.keys(clonedDef.layouts) as WidgetSize[]) {
      const layout = clonedDef.layouts[size];
      if (layout) {
        layout.root = assignMissingIds(layout.root as unknown as ContainerElement);
      }
    }

    set({
      draft: clonedDef,
      activeSize: clonedDef.defaultSize || 'medium',
      selectedElementId: null,
      isPaletteOpen: false,
      paletteParentId: null,
    });
  },

  loadWidget: (definition: DeclarativeWidgetDefinition) => {
    const clonedDef: DeclarativeWidgetDefinition = JSON.parse(JSON.stringify(definition));
    
    // Ensure all elements have IDs
    for (const size of Object.keys(clonedDef.layouts) as WidgetSize[]) {
      const layout = clonedDef.layouts[size];
      if (layout) {
        layout.root = assignMissingIds(layout.root as unknown as ContainerElement);
      }
    }

    const supported = clonedDef.supportedSizes ?? ['small', 'medium', 'large'];
    const defaultSize = clonedDef.defaultSize || (supported[0] ?? 'medium');

    set({
      draft: clonedDef,
      activeSize: defaultSize,
      selectedElementId: null,
      isPaletteOpen: false,
      paletteParentId: null,
    });
  },

  setName: (displayName: string) => {
    const { draft } = get();
    if (!draft) return;

    const id = slugify(displayName);
    set({
      draft: {
        ...draft,
        displayName,
        id,
      },
    });
  },

  setDescription: (description: string) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: {
        ...draft,
        description,
      },
    });
  },

  setCategory: (category: string) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: {
        ...draft,
        category,
      },
    });
  },

  setActiveSize: (size: WidgetSize) => {
    const { draft, activeSize } = get();
    if (!draft) return;

    // If target size layout does not exist yet, clone from active layout or initialize
    const currentLayout = draft.layouts[activeSize];
    const targetLayout = draft.layouts[size];
    const currentSupported = draft.supportedSizes ?? ['small', 'medium', 'large'];

    let updatedDraft = draft;
    if (!targetLayout && currentLayout) {
      // Clone current layout into new size
      const clonedLayout = JSON.parse(JSON.stringify(currentLayout));
      clonedLayout.root = assignMissingIds(clonedLayout.root as unknown as ContainerElement);

      // Ensure supportedSizes includes target size
      const supported = currentSupported.includes(size)
        ? currentSupported
        : [...currentSupported, size];

      updatedDraft = {
        ...draft,
        supportedSizes: supported,
        layouts: {
          ...draft.layouts,
          [size]: clonedLayout,
        },
      };
    } else if (!targetLayout) {
      // Create empty root container
      const newRoot: ContainerElement = {
        type: 'container',
        id: generateElementId('container'),
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [],
      };

      const supported = currentSupported.includes(size)
        ? currentSupported
        : [...currentSupported, size];

      updatedDraft = {
        ...draft,
        supportedSizes: supported,
        layouts: {
          ...draft.layouts,
          [size]: {
            backgroundColor: '#ffffff',
            padding: 14,
            root: newRoot,
          },
        },
      };
    }

    set({
      draft: updatedDraft,
      activeSize: size,
      selectedElementId: null,
    });
  },

  setSupportedSizes: (supportedSizes: WidgetSize[]) => {
    const { draft } = get();
    if (!draft || supportedSizes.length === 0) return;

    set({
      draft: {
        ...draft,
        supportedSizes,
      },
    });
  },

  selectElement: (id: string | null) => {
    set({ selectedElementId: id });
  },

  openPalette: (targetContainerId?: string) => {
    set({
      isPaletteOpen: true,
      paletteParentId: targetContainerId ?? null,
    });
  },

  closePalette: () => {
    set({
      isPaletteOpen: false,
      paletteParentId: null,
    });
  },

  addElement: (type: WidgetElementType, parentId?: string) => {
    const { draft, activeSize, paletteParentId } = get();
    if (!draft) return;

    const layout = draft.layouts[activeSize];
    if (!layout) return;

    const rootContainer = layout.root as unknown as ContainerElement;
    const targetParent = parentId ?? paletteParentId ?? rootContainer.id;
    const newElement = createDefaultElement(type);
    const updatedRoot = insertElement(rootContainer, targetParent, newElement);

    set({
      draft: {
        ...draft,
        layouts: {
          ...draft.layouts,
          [activeSize]: {
            ...layout,
            root: updatedRoot,
          },
        },
      },
      selectedElementId: newElement.id ?? null,
      isPaletteOpen: false,
      paletteParentId: null,
    });
  },

  removeElement: (elementId: string) => {
    const { draft, activeSize, selectedElementId } = get();
    if (!draft) return;

    const layout = draft.layouts[activeSize];
    if (!layout) return;

    const rootContainer = layout.root as unknown as ContainerElement;
    const updatedRoot = removeElement(rootContainer, elementId);

    set({
      draft: {
        ...draft,
        layouts: {
          ...draft.layouts,
          [activeSize]: {
            ...layout,
            root: updatedRoot,
          },
        },
      },
      selectedElementId: selectedElementId === elementId ? null : selectedElementId,
    });
  },

  reorderElement: (elementId: string, direction: 'up' | 'down') => {
    const { draft, activeSize } = get();
    if (!draft) return;

    const layout = draft.layouts[activeSize];
    if (!layout) return;

    const rootContainer = layout.root as unknown as ContainerElement;
    const updatedRoot = moveElement(rootContainer, elementId, direction);

    set({
      draft: {
        ...draft,
        layouts: {
          ...draft.layouts,
          [activeSize]: {
            ...layout,
            root: updatedRoot,
          },
        },
      },
    });
  },

  updateElement: (elementId: string, patch: Partial<WidgetElement>) => {
    const { draft, activeSize } = get();
    if (!draft) return;

    const layout = draft.layouts[activeSize];
    if (!layout) return;

    const rootContainer = layout.root as unknown as ContainerElement;
    const updatedRoot = updateElement(rootContainer, elementId, patch);

    set({
      draft: {
        ...draft,
        layouts: {
          ...draft.layouts,
          [activeSize]: {
            ...layout,
            root: updatedRoot,
          },
        },
      },
    });
  },

  updateActiveLayout: (patch: { backgroundColor?: string; padding?: Padding }) => {
    const { draft, activeSize } = get();
    if (!draft) return;

    const layout = draft.layouts[activeSize];
    if (!layout) return;

    set({
      draft: {
        ...draft,
        layouts: {
          ...draft.layouts,
          [activeSize]: {
            ...layout,
            ...patch,
          },
        },
      },
    });
  },

  reset: () => {
    set({
      draft: null,
      activeSize: 'medium',
      selectedElementId: null,
      isPaletteOpen: false,
      paletteParentId: null,
    });
  },
}));
