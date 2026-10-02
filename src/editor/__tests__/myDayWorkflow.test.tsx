/**
 * src/editor/__tests__/myDayWorkflow.test.tsx
 *
 * End-to-end integration test verifying the complete user workflow for Prompt 7:
 * - Create a widget
 * - Name it
 * - Choose size
 * - Add components
 * - Remove components
 * - Reorder components
 * - Edit basic component properties
 * - Preview the widget (render with DeclarativeWidgetRenderer)
 * - Save the widget locally to AsyncStorage
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useEditorStore } from '@/store/editorStore';
import { saveCustomWidget, getCustomWidgets, clearAllCustomWidgets } from '@/services/localWidgetService';
import { DeclarativeWidgetRenderer } from '@/renderer/declarative/DeclarativeWidgetRenderer';
import { mockUniversalItems } from '@/renderer/mockData';
import {
  WidgetElement,
  ContainerElement,
  TextElement,
  WeatherElement,
  EventElement,
  TaskListElement,
} from '@/widgets/declarative/elements';
import { validateWidgetDefinition } from '@/widgets/declarative/validation';

describe('Prompt 7 — My Day Widget Editor Workflow', () => {
  beforeEach(async () => {
    useEditorStore.getState().reset();
    await clearAllCustomWidgets();
  });

  it('allows a user to build a complete My Day widget from scratch, configure it, preview it, and save it', async () => {
    const store = useEditorStore.getState();

    // 1. Create a widget (start from blank canvas)
    store.initNewWidget('blank');
    expect(useEditorStore.getState().draft).not.toBeNull();

    // 2. Name it
    store.setName('My Day Dashboard');
    store.setDescription('Morning briefing with weather, upcoming meeting, and priorities');
    expect(useEditorStore.getState().draft?.displayName).toBe('My Day Dashboard');
    expect(useEditorStore.getState().draft?.id).toBe('my-day-dashboard');

    // 3. Choose size (switch to large layout for rich composition)
    store.setActiveSize('large');
    expect(useEditorStore.getState().activeSize).toBe('large');

    // Remove placeholder children to build strictly from scratch
    const initialDraft = useEditorStore.getState().draft!;
    const initialRoot = initialDraft.layouts.large!.root as unknown as ContainerElement;
    for (const child of [...initialRoot.children]) {
      if (child.id) store.removeElement(child.id);
    }

    // 4. Add components
    // - Add greeting text
    store.addElement('text');
    // - Add weather block
    store.addElement('weather');
    // - Add divider
    store.addElement('divider');
    // - Add next calendar event
    store.addElement('event');
    // - Add task list
    store.addElement('taskList');

    let draft = useEditorStore.getState().draft!;
    let root = draft.layouts.large!.root as unknown as ContainerElement;
    expect(root.children.length).toBeGreaterThanOrEqual(5);

    // 5. Edit basic component properties
    const textElem = root.children.find((c) => c.type === 'text') as TextElement;
    store.updateElement(textElem.id!, {
      content: 'Good morning, Alex! ☀️',
      variant: 'heading',
      weight: 'bold',
      color: '#0f172a',
    });

    const weatherElem = root.children.find((c) => c.type === 'weather') as WeatherElement;
    store.updateElement(weatherElem.id!, {
      displayMode: 'compact',
      showHumidity: true,
      showFeelsLike: true,
      tempUnit: 'celsius',
    });

    const eventElem = root.children.find((c) => c.type === 'event') as EventElement;
    store.updateElement(eventElem.id!, {
      title: 'Quarterly Planning Sync',
      location: 'Conference Room 4B',
      calendarColor: '#6366f1',
      showTime: true,
      showLocation: true,
    });

    const taskElem = root.children.find((c) => c.type === 'taskList') as TaskListElement;
    store.updateElement(taskElem.id!, {
      maxItems: 4,
      showCheckbox: true,
      showDueDate: true,
      showPriority: true,
      filterStatus: 'pending',
    });

    // 6. Reorder components: move weather above text, then back below
    store.reorderElement(weatherElem.id!, 'up');
    draft = useEditorStore.getState().draft!;
    root = draft.layouts.large!.root as unknown as ContainerElement;
    let weatherIdx = root.children.findIndex((c) => c.id === weatherElem.id);
    let textIdx = root.children.findIndex((c) => c.id === textElem.id);
    expect(weatherIdx).toBeLessThan(textIdx);

    // Move text back to top
    store.reorderElement(textElem.id!, 'up');

    // 7. Remove components: add a dummy metric and then remove it
    store.addElement('metric');
    draft = useEditorStore.getState().draft!;
    root = draft.layouts.large!.root as unknown as ContainerElement;
    const metricElem = root.children.find((c) => c.type === 'metric')!;
    expect(metricElem).toBeDefined();

    store.removeElement(metricElem.id!);
    draft = useEditorStore.getState().draft!;
    root = draft.layouts.large!.root as unknown as ContainerElement;
    expect(root.children.find((c) => c.id === metricElem.id)).toBeUndefined();

    // 8. Validate schema
    const validation = validateWidgetDefinition(draft);
    expect(validation.success).toBe(true);

    // 9. Live Preview verification (renders correctly in React Native view tree)
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <DeclarativeWidgetRenderer
          definition={draft}
          size="large"
          items={mockUniversalItems}
        />
      );
    });

    const tree = renderer!.toJSON();
    expect(tree).toBeDefined();

    // 10. Save widget locally to AsyncStorage
    await saveCustomWidget(draft);

    const savedWidgets = await getCustomWidgets();
    expect(savedWidgets.length).toBe(1);
    expect(savedWidgets[0].id).toBe('my-day-dashboard');
    expect(savedWidgets[0].displayName).toBe('My Day Dashboard');
    expect(savedWidgets[0].layouts.large).toBeDefined();

    // Verify properties were persisted properly
    const savedRoot = savedWidgets[0].layouts.large!.root;
    const savedText = savedRoot.children.find((c: WidgetElement) => c.type === 'text') as TextElement;
    expect(savedText.content).toBe('Good morning, Alex! ☀️');

    const savedWeather = savedRoot.children.find((c: WidgetElement) => c.type === 'weather') as WeatherElement;
    expect(savedWeather.displayMode).toBe('compact');
    expect(savedWeather.tempUnit).toBe('celsius');
  });
});
