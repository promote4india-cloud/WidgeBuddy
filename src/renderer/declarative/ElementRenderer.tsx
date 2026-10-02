/**
 * src/renderer/declarative/ElementRenderer.tsx
 *
 * Dispatches declarative WidgetElement objects to their respective React Native view components.
 * Fallback to UnsupportedView if unknown element type is provided.
 */

import React from 'react';
import { WidgetElement, WidgetElementInput, Action, UniversalItem } from '@/widgets/schema';
import { ContainerView } from './elements/ContainerView';
import { TextView } from './elements/TextView';
import { IconView } from './elements/IconView';
import { WeatherView } from './elements/WeatherView';
import { EventView } from './elements/EventView';
import { TaskListView } from './elements/TaskListView';
import { ArticleListView } from './elements/ArticleListView';
import { MetricView } from './elements/MetricView';
import { DividerView } from './elements/DividerView';
import { ActionView } from './elements/ActionView';
import { UnsupportedView } from './elements/UnsupportedView';

export interface ElementRendererProps {
  element: WidgetElement | WidgetElementInput;
  items?: UniversalItem[];
  userConfig?: Record<string, unknown>;
  onAction?: (action: Action) => void;
}

export const ElementRenderer = React.memo(function ElementRenderer({
  element,
  items,
  userConfig,
  onAction,
}: ElementRendererProps) {
  if (!element || !element.type) {
    return <UnsupportedView type="missing" />;
  }

  const props = { items, userConfig, onAction };

  switch (element.type) {
    case 'container':
      return <ContainerView element={element} {...props} />;
    case 'text':
      return <TextView element={element} {...props} />;
    case 'icon':
      return <IconView element={element} onAction={onAction} />;
    case 'weather':
      return <WeatherView element={element} {...props} />;
    case 'event':
      return <EventView element={element} {...props} />;
    case 'taskList':
      return <TaskListView element={element} {...props} />;
    case 'articleList':
      return <ArticleListView element={element} {...props} />;
    case 'metric':
      return <MetricView element={element} onAction={onAction} />;
    case 'divider':
      return <DividerView element={element} />;
    case 'action':
      return <ActionView element={element} onAction={onAction} />;
    default:
      // REASON: Graceful fallback for unexpected or future element types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <UnsupportedView type={(element as any).type} />;
  }
});
