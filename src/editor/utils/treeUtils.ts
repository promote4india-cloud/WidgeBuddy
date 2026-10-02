/**
 * src/editor/utils/treeUtils.ts
 *
 * Pure, immutable tree manipulation utilities for DeclarativeWidgetDefinition layout trees.
 * Operates directly on ContainerElement and WidgetElement nodes.
 */

import {
  WidgetElement,
  ContainerElement,
  TextElement,
  IconElement,
  WeatherElement,
  EventElement,
  TaskListElement,
  ArticleListElement,
  MetricElement,
  DividerElement,
  ActionElement,
} from '@/widgets/declarative/elements';

export type WidgetElementType = WidgetElement['type'];

/**
 * Generates a stable unique ID for an element if it doesn't have one.
 */
let counter = 0;
export function generateElementId(type: string): string {
  counter += 1;
  return `elem_${type}_${Date.now()}_${counter}`;
}

/**
 * Recursively ensures all elements in a container have a non-empty `id`.
 */
export function assignMissingIds<T extends WidgetElement>(element: T): T {
  const id = element.id && element.id.length > 0 ? element.id : generateElementId(element.type);
  if (element.type === 'container') {
    const container = element as unknown as ContainerElement;
    return {
      ...container,
      id,
      children: (container.children ?? []).map((child) => assignMissingIds(child)),
    } as unknown as T;
  }
  return {
    ...element,
    id,
  };
}

/**
 * Recursively finds an element by ID within a container tree.
 */
export function findElementById(root: ContainerElement, id: string): WidgetElement | null {
  if (root.id === id) {
    return root;
  }
  for (const child of root.children ?? []) {
    if (child.id === id) {
      return child;
    }
    if (child.type === 'container') {
      const found = findElementById(child as ContainerElement, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Finds the parent container and child index of a target element ID.
 */
export function findParentContainer(
  root: ContainerElement,
  targetId: string,
): { parent: ContainerElement; index: number } | null {
  for (let i = 0; i < (root.children ?? []).length; i++) {
    const child = root.children[i];
    if (child.id === targetId) {
      return { parent: root, index: i };
    }
    if (child.type === 'container') {
      const found = findParentContainer(child as ContainerElement, targetId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Inserts a new element into a target container (or root if not found/specified).
 */
export function insertElement(
  root: ContainerElement,
  targetParentId: string | undefined,
  element: WidgetElement,
  index?: number,
): ContainerElement {
  const elementWithId = assignMissingIds(element);

  // If targeting root directly
  if (!targetParentId || root.id === targetParentId) {
    const children = [...(root.children ?? [])];
    if (index !== undefined && index >= 0 && index <= children.length) {
      children.splice(index, 0, elementWithId);
    } else {
      children.push(elementWithId);
    }
    return {
      ...root,
      children,
    };
  }

  // Recursively search and insert
  const newChildren = (root.children ?? []).map((child) => {
    if (child.type === 'container') {
      return insertElement(child as ContainerElement, targetParentId, elementWithId, index);
    }
    return child;
  });

  return {
    ...root,
    children: newChildren,
  };
}

/**
 * Removes an element by ID from the container tree. Root cannot be removed.
 */
export function removeElement(root: ContainerElement, idToRemove: string): ContainerElement {
  if (root.id === idToRemove) {
    return root; // Root cannot be deleted
  }

  const filteredChildren: WidgetElement[] = [];

  for (const child of root.children ?? []) {
    if (child.id === idToRemove) {
      continue; // Remove this child
    }
    if (child.type === 'container') {
      filteredChildren.push(removeElement(child as ContainerElement, idToRemove));
    } else {
      filteredChildren.push(child);
    }
  }

  return {
    ...root,
    children: filteredChildren,
  };
}

/**
 * Moves an element up or down among its siblings.
 */
export function moveElement(
  root: ContainerElement,
  elementId: string,
  direction: 'up' | 'down',
): ContainerElement {
  const parentInfo = findParentContainer(root, elementId);
  if (!parentInfo) {
    return root;
  }

  const { parent, index } = parentInfo;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= parent.children.length) {
    return root; // Already at boundary
  }

  const newSiblings = [...parent.children];
  const [moved] = newSiblings.splice(index, 1);
  newSiblings.splice(targetIndex, 0, moved);

  // If the parent is the root
  if (parent.id === root.id) {
    return {
      ...root,
      children: newSiblings,
    };
  }

  // Otherwise replace parent's children in the tree
  return updateElement(root, parent.id!, { children: newSiblings } as Partial<ContainerElement>) as ContainerElement;
}

/**
 * Updates properties of an element by ID anywhere in the tree.
 */
export function updateElement(
  root: ContainerElement,
  idToUpdate: string,
  patch: Partial<WidgetElement>,
): ContainerElement {
  if (root.id === idToUpdate) {
    return {
      ...root,
      ...patch,
      type: 'container',
    } as ContainerElement;
  }

  const updatedChildren = (root.children ?? []).map((child) => {
    if (child.id === idToUpdate) {
      return {
        ...child,
        ...patch,
      } as WidgetElement;
    }
    if (child.type === 'container') {
      return updateElement(child as ContainerElement, idToUpdate, patch);
    }
    return child;
  });

  return {
    ...root,
    children: updatedChildren,
  };
}

/**
 * Factory function creating sensible defaults for each component type.
 */
export function createDefaultElement(type: WidgetElementType): WidgetElement {
  const id = generateElementId(type);

  switch (type) {
    case 'text':
      return {
        type: 'text',
        id,
        content: 'New Text',
        variant: 'body',
        weight: 'regular',
        align: 'left',
      } satisfies TextElement;

    case 'icon':
      return {
        type: 'icon',
        id,
        name: 'sparkles',
        size: 'medium',
        color: '#6366f1',
      } satisfies IconElement;

    case 'weather':
      return {
        type: 'weather',
        id,
        displayMode: 'current',
        showConditionIcon: true,
        showHumidity: true,
        showWind: false,
        showFeelsLike: true,
        tempUnit: 'auto',
        forecastDays: 3,
      } satisfies WeatherElement;

    case 'event':
      return {
        type: 'event',
        id,
        title: 'Team Sync Meeting',
        startAt: new Date(Date.now() + 3600000).toISOString(),
        location: 'Virtual Conference',
        calendarColor: '#6366f1',
        showTime: true,
        showLocation: true,
        isAllDay: false,
      } satisfies EventElement;

    case 'taskList':
      return {
        type: 'taskList',
        id,
        maxItems: 3,
        showCheckbox: true,
        showDueDate: true,
        showPriority: false,
        filterStatus: 'pending',
        emptyMessage: 'No pending tasks',
        allowToggle: true,
      } satisfies TaskListElement;

    case 'articleList':
      return {
        type: 'articleList',
        id,
        maxItems: 3,
        showImage: true,
        showSummary: false,
        showAuthor: false,
        showTimestamp: true,
        layout: 'compact',
        emptyMessage: 'No articles available',
      } satisfies ArticleListElement;

    case 'metric':
      return {
        type: 'metric',
        id,
        label: 'Focus Time',
        value: '4.5 hrs',
        unit: 'today',
        trend: 'up',
        change: '+18%',
        trendColor: '#10b981',
        size: 'medium',
      } satisfies MetricElement;

    case 'divider':
      return {
        type: 'divider',
        id,
        orientation: 'horizontal',
        thickness: 1,
        color: '#e2e8f0',
        spacing: 8,
      } satisfies DividerElement;

    case 'container':
      return {
        type: 'container',
        id,
        direction: 'column',
        gap: 8,
        padding: 0,
        children: [],
      } satisfies ContainerElement;

    case 'action':
      return {
        type: 'action',
        id,
        label: 'Open Dashboard',
        variant: 'button',
        style: 'primary',
        disabled: false,
        action: {
          type: 'open_url',
          url: 'https://widgebuddy.app',
        },
      } satisfies ActionElement;
  }
}
