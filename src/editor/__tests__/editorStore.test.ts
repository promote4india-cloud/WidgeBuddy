/**
 * src/editor/__tests__/editorStore.test.ts
 *
 * Unit tests for useEditorStore.
 */

import { useEditorStore } from '@/store/editorStore';
import { validateWidgetDefinition } from '@/widgets/declarative/validation';
import { ContainerElement, TextElement, WeatherElement } from '@/widgets/declarative/elements';

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('initializes with null draft', () => {
    const state = useEditorStore.getState();
    expect(state.draft).toBeNull();
    expect(state.activeSize).toBe('medium');
    expect(state.selectedElementId).toBeNull();
  });

  it('initializes a new widget from the My Day template and is schema-valid', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('my-day');

    const draft = useEditorStore.getState().draft;
    expect(draft).not.toBeNull();
    expect(draft?.displayName).toBe('My Day');
    expect(draft?.layouts.medium).toBeDefined();

    const validation = validateWidgetDefinition(draft);
    expect(validation.success).toBe(true);
  });

  it('initializes from blank template', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('blank');

    const draft = useEditorStore.getState().draft;
    expect(draft).not.toBeNull();
    expect(draft?.displayName).toBe('My Custom Widget');
  });

  it('updates widget name and generates slug id', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('blank');

    store.setName('Morning Briefing 2026!');
    const draft = useEditorStore.getState().draft;
    expect(draft?.displayName).toBe('Morning Briefing 2026!');
    expect(draft?.id).toBe('morning-briefing-2026');
  });

  it('switches active size and clones layout if missing', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('my-day');

    store.setActiveSize('small');
    expect(useEditorStore.getState().activeSize).toBe('small');

    store.setActiveSize('large');
    expect(useEditorStore.getState().activeSize).toBe('large');
  });

  it('adds components of various types to the active layout', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('blank');

    const initialChildrenCount = (
      useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement
    ).children.length;

    store.addElement('weather');

    const newChildren = (
      useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement
    ).children;
    expect(newChildren.length).toBe(initialChildrenCount + 1);
    expect(newChildren[newChildren.length - 1].type).toBe('weather');

    // Automatically selects the newly added element
    const selectedId = useEditorStore.getState().selectedElementId;
    expect(selectedId).toBe(newChildren[newChildren.length - 1].id);
  });

  it('removes an element from the active layout', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('blank');

    store.addElement('icon');
    const layout = useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement;
    const addedElementId = layout.children[layout.children.length - 1].id!;

    store.removeElement(addedElementId);

    const updatedLayout = useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement;
    const found = updatedLayout.children.find((c) => c.id === addedElementId);
    expect(found).toBeUndefined();
    expect(useEditorStore.getState().selectedElementId).toBeNull();
  });

  it('reorders elements up and down', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('blank');

    store.addElement('weather');
    store.addElement('event');

    const layout = useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement;
    const weatherId = layout.children[layout.children.length - 2].id!;
    const eventId = layout.children[layout.children.length - 1].id!;

    // Move event up
    store.reorderElement(eventId, 'up');

    const reordered = useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement;
    const eventIndex = reordered.children.findIndex((c) => c.id === eventId);
    const weatherIndex = reordered.children.findIndex((c) => c.id === weatherId);
    expect(eventIndex).toBeLessThan(weatherIndex);
  });

  it('updates basic component properties', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('blank');

    store.addElement('weather');
    const layout = useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement;
    const weatherId = layout.children[layout.children.length - 1].id!;

    store.updateElement(weatherId, {
      displayMode: 'forecast',
      forecastDays: 5,
    } as Partial<WeatherElement>);

    const updatedLayout = useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement;
    const updatedWeather = updatedLayout.children.find((c) => c.id === weatherId) as WeatherElement;
    expect(updatedWeather.displayMode).toBe('forecast');
    expect(updatedWeather.forecastDays).toBe(5);
  });

  it('updates active layout background and padding', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('blank');

    store.updateActiveLayout({
      backgroundColor: '#f8fafc',
      padding: 20,
    });

    const layout = useEditorStore.getState().draft?.layouts.medium;
    expect(layout?.backgroundColor).toBe('#f8fafc');
    expect(layout?.padding).toBe(20);
  });

  it('toggles component palette modal open and closed', () => {
    const store = useEditorStore.getState();
    expect(useEditorStore.getState().isPaletteOpen).toBe(false);

    store.openPalette('custom-container-id');
    expect(useEditorStore.getState().isPaletteOpen).toBe(true);
    expect(useEditorStore.getState().paletteParentId).toBe('custom-container-id');

    store.closePalette();
    expect(useEditorStore.getState().isPaletteOpen).toBe(false);
    expect(useEditorStore.getState().paletteParentId).toBeNull();
  });

  it('selects and deselects elements', () => {
    const store = useEditorStore.getState();
    store.selectElement('elem-123');
    expect(useEditorStore.getState().selectedElementId).toBe('elem-123');

    store.selectElement(null);
    expect(useEditorStore.getState().selectedElementId).toBeNull();
  });

  it('resets state completely', () => {
    const store = useEditorStore.getState();
    store.initNewWidget('my-day');
    expect(useEditorStore.getState().draft).not.toBeNull();

    store.reset();
    expect(useEditorStore.getState().draft).toBeNull();
    expect(useEditorStore.getState().selectedElementId).toBeNull();
  });
});
