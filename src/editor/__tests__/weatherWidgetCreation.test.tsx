/**
 * src/editor/__tests__/weatherWidgetCreation.test.tsx
 *
 * Tests verifying end-to-end weather widget creation, template resolution,
 * repository persistence, and DeclarativeWidgetRenderer rendering.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { getTemplate } from '@/editor/templates';
import { getWidgetRepository } from '@/repositories';
import { validateWidgetDefinition } from '@/widgets/declarative/validation';
import { DeclarativeWidgetRenderer } from '@/renderer/declarative/DeclarativeWidgetRenderer';
import { mockUniversalItems } from '@/renderer/mockData';
import { useEditorStore } from '@/store/editorStore';

describe('Weather Widget Creation & Persistence', () => {
  beforeEach(async () => {
    useEditorStore.getState().reset();
    const repo = getWidgetRepository();
    // Clear any previous widgets
    const existing = await repo.list();
    for (const w of existing) {
      await repo.delete(w.id);
    }
  });

  it('resolves weather-card, weather, and weather-focus aliases to the weather-focus template', () => {
    const tmplFromCard = getTemplate('weather-card');
    const tmplFromWeather = getTemplate('weather');
    const tmplFromFocus = getTemplate('weather-focus');

    expect(tmplFromCard.id).toBe('weather-focus');
    expect(tmplFromWeather.id).toBe('weather-focus');
    expect(tmplFromFocus.id).toBe('weather-focus');
    expect(tmplFromCard.definition.category).toBe('weather');
    expect(tmplFromCard.definition.connectorTypes).toContain('weather');
  });

  it('validates the weather-focus template against DeclarativeWidgetDefinitionSchema', () => {
    const tmpl = getTemplate('weather-focus');
    const validation = validateWidgetDefinition(tmpl.definition);
    expect(validation.success).toBe(true);
  });

  it('allows initializing editor with weather-focus and saves to repository', async () => {
    const store = useEditorStore.getState();
    store.initNewWidget('weather-focus');

    const draft = useEditorStore.getState().draft;
    expect(draft).not.toBeNull();
    expect(draft?.category).toBe('weather');
    expect(draft?.displayName).toBe('Weather Forecast');

    // Save to repository
    const repo = getWidgetRepository();
    await repo.create(draft!);

    const saved = await repo.get(draft!.id);
    expect(saved).not.toBeNull();
    expect(saved?.id).toBe(draft!.id);
    expect(saved?.displayName).toBe('Weather Forecast');
    expect(saved?.layouts.medium).toBeDefined();
  });

  it('renders weather widget in small, medium, and large layouts with normalized items', () => {
    const tmpl = getTemplate('weather-focus');

    for (const size of ['small', 'medium', 'large'] as const) {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <DeclarativeWidgetRenderer
            definition={tmpl.definition}
            size={size}
            items={mockUniversalItems}
          />
        );
      });

      const tree = renderer!.toJSON();
      expect(tree).toBeDefined();
    }
  });

  it('supports direct 1-tap addition with a unique id', async () => {
    const repo = getWidgetRepository();
    const tmpl = getTemplate('weather-focus');

    const widget1 = JSON.parse(JSON.stringify(tmpl.definition));
    widget1.id = `weather-${Date.now().toString(36)}-1`;
    await repo.create(widget1);

    const widget2 = JSON.parse(JSON.stringify(tmpl.definition));
    widget2.id = `weather-${Date.now().toString(36)}-2`;
    await repo.create(widget2);

    const list = await repo.list();
    expect(list.length).toBe(2);
    expect(list.map((w) => w.id)).toContain(widget1.id);
    expect(list.map((w) => w.id)).toContain(widget2.id);
  });
});
