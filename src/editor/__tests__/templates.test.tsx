/**
 * src/editor/__tests__/templates.test.tsx
 *
 * Tests for the Widget Template System (Prompt 17).
 *
 * Requirements:
 * - Initial templates: My Day, Workday, Morning, Evening, Travel, Tasks, Calendar, Weather
 * - Users can: preview, use template, customize, save as their own widget
 * - Do not create a separate template rendering system.
 * - Templates must simply be predefined valid WidgetDefinitions.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { WIDGET_TEMPLATES, WidgetTemplate, getTemplate } from '@/editor/templates';
import { validateWidgetDefinition } from '@/widgets/declarative/validation';
import { DeclarativeWidgetRenderer } from '@/renderer/declarative/DeclarativeWidgetRenderer';
import { mockUniversalItems } from '@/renderer/mockData';
import { useEditorStore } from '@/store/editorStore';
import { getWidgetRepository, resetWidgetRepository } from '@/repositories';
import { ContainerElement } from '@/widgets/declarative/elements';

const REQUIRED_TEMPLATE_NAMES = [
  'My Day',
  'Workday',
  'Morning',
  'Evening',
  'Travel',
  'Tasks',
  'Calendar',
  'Weather',
];

describe('Prompt 17 — Widget Template System', () => {
  beforeEach(() => {
    resetWidgetRepository();
    useEditorStore.getState().reset();
  });

  describe('1. Initial Required Templates', () => {
    it('contains all 8 required templates by name', () => {
      const templateNames = WIDGET_TEMPLATES.map((t) => t.name);
      for (const requiredName of REQUIRED_TEMPLATE_NAMES) {
        expect(templateNames).toContain(requiredName);
      }
    });

    it('each template has valid metadata (id, name, description, icon, definition)', () => {
      expect(WIDGET_TEMPLATES.length).toBeGreaterThanOrEqual(8);
      for (const tmpl of WIDGET_TEMPLATES) {
        expect(tmpl.id).toBeTruthy();
        expect(tmpl.name).toBeTruthy();
        expect(tmpl.description).toBeTruthy();
        expect(tmpl.icon).toBeTruthy();
        expect(tmpl.definition).toBeDefined();
        expect(tmpl.definition.id).toBeTruthy();
        expect(tmpl.definition.displayName).toBeTruthy();
        expect((tmpl.definition.supportedSizes ?? []).length).toBeGreaterThan(0);
      }
    });

    it('templates are valid DeclarativeWidgetDefinitions (no separate rendering engine needed)', () => {
      for (const tmpl of WIDGET_TEMPLATES) {
        const validation = validateWidgetDefinition(tmpl.definition);
        if (!validation.success) {
          console.error(`Validation failed for template "${tmpl.name}":`, validation.errorSummary);
        }
        expect(validation.success).toBe(true);
        expect(validation.data).toBeDefined();
      }
    });

    it('each required template defines small, medium, and large layouts', () => {
      const requiredIds = [
        'my-day',
        'workday',
        'morning',
        'evening',
        'travel',
        'tasks',
        'calendar',
        'weather-focus',
      ];

      for (const id of requiredIds) {
        const tmpl = getTemplate(id);
        expect(tmpl).toBeDefined();
        expect(tmpl.definition.layouts.small).toBeDefined();
        expect(tmpl.definition.layouts.medium).toBeDefined();
        expect(tmpl.definition.layouts.large).toBeDefined();

        // Check roots are container elements
        expect((tmpl.definition.layouts.small?.root as unknown as ContainerElement).type).toBe('container');
        expect((tmpl.definition.layouts.medium?.root as unknown as ContainerElement).type).toBe('container');
        expect((tmpl.definition.layouts.large?.root as unknown as ContainerElement).type).toBe('container');
      }
    });
  });

  describe('2. Template Lookup and Alias Resolution', () => {
    it('resolves templates by their primary ID', () => {
      expect(getTemplate('my-day').name).toBe('My Day');
      expect(getTemplate('workday').name).toBe('Workday');
      expect(getTemplate('morning').name).toBe('Morning');
      expect(getTemplate('evening').name).toBe('Evening');
      expect(getTemplate('travel').name).toBe('Travel');
      expect(getTemplate('tasks').name).toBe('Tasks');
      expect(getTemplate('calendar').name).toBe('Calendar');
      expect(getTemplate('weather-focus').name).toBe('Weather');
    });

    it('resolves aliases seamlessly for weather', () => {
      expect(getTemplate('weather').id).toBe('weather-focus');
      expect(getTemplate('weather-card').id).toBe('weather-focus');
    });

    it('resolves aliases seamlessly for tasks', () => {
      expect(getTemplate('task-list').id).toBe('tasks');
      expect(getTemplate('task').id).toBe('tasks');
    });

    it('resolves aliases seamlessly for calendar', () => {
      expect(getTemplate('calendar-list').id).toBe('calendar');
    });

    it('resolves aliases seamlessly for my-day', () => {
      expect(getTemplate('myday').id).toBe('my-day');
    });

    it('falls back to first template when id is undefined or unknown', () => {
      expect(getTemplate(undefined).id).toBe(WIDGET_TEMPLATES[0].id);
      expect(getTemplate('unknown-template-xyz').id).toBe(WIDGET_TEMPLATES[0].id);
    });
  });

  describe('3. Capability: Preview Templates', () => {
    it('renders all 8 templates directly with DeclarativeWidgetRenderer across sizes', () => {
      const templatesToTest = [
        'my-day',
        'workday',
        'morning',
        'evening',
        'travel',
        'tasks',
        'calendar',
        'weather-focus',
      ];

      for (const tmplId of templatesToTest) {
        const tmpl = getTemplate(tmplId);
        for (const size of tmpl.definition.supportedSizes ?? ['medium']) {
          let testRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
          act(() => {
            testRenderer = ReactTestRenderer.create(
              <DeclarativeWidgetRenderer
                definition={tmpl.definition}
                size={size}
                items={mockUniversalItems}
              />,
            );
          });
          expect(testRenderer).toBeDefined();
          expect(testRenderer!.toJSON()).not.toBeNull();
        }
      }
    });
  });

  describe('4. Capability: Use Template (Direct Add to Dashboard)', () => {
    it('clones a template definition and persists it as a new widget', async () => {
      const repo = getWidgetRepository();
      const initialWidgets = await repo.list();
      const initialCount = initialWidgets.length;

      const template = getTemplate('travel');
      const cloned = JSON.parse(JSON.stringify(template.definition));
      cloned.id = `travel-user-${Date.now()}`;
      cloned.displayName = 'My Japan Trip 2026';

      await repo.create(cloned);

      const saved = await repo.get(cloned.id);
      expect(saved).not.toBeNull();
      expect(saved?.displayName).toBe('My Japan Trip 2026');
      expect(saved?.category).toBe('lifestyle');

      const updatedWidgets = await repo.list();
      expect(updatedWidgets.length).toBe(initialCount + 1);
    });
  });

  describe('5. Capability: Customize Template in Editor', () => {
    it('loads template into editor store, allows modifying elements, and updates draft', () => {
      const store = useEditorStore.getState();
      store.initNewWidget('workday');

      const draft = useEditorStore.getState().draft;
      expect(draft).not.toBeNull();
      expect(draft?.displayName).toBe('Workday');

      // Customize: change display name
      store.setName('My Remote Workday');
      expect(useEditorStore.getState().draft?.displayName).toBe('My Remote Workday');
      expect(useEditorStore.getState().draft?.id).toBe('my-remote-workday');

      // Customize: add an element to layout
      const initialChildren = (
        useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement
      ).children.length;

      store.addElement('icon');
      const afterAddChildren = (
        useEditorStore.getState().draft?.layouts.medium?.root as unknown as ContainerElement
      ).children;
      expect(afterAddChildren.length).toBe(initialChildren + 1);

      // Customize: switch layout size
      store.setActiveSize('large');
      expect(useEditorStore.getState().activeSize).toBe('large');

      // Validation passes after customization
      const validation = validateWidgetDefinition(useEditorStore.getState().draft);
      expect(validation.success).toBe(true);
    });
  });

  describe('6. Capability: Save as Own Widget', () => {
    it('customizes template in editor and saves to repository as user custom widget', async () => {
      const repo = getWidgetRepository();
      const store = useEditorStore.getState();

      // Initialize from Evening template
      store.initNewWidget('evening');
      store.setName('Evening Wind Down');
      store.setDescription('My customized evening routine widget');

      // Get customized draft
      const draft = useEditorStore.getState().draft!;
      expect(draft).toBeDefined();

      const validation = validateWidgetDefinition(draft);
      expect(validation.success).toBe(true);

      // Save to repository
      await repo.create(draft);

      // Retrieve and verify
      const retrieved = await repo.get(draft.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.displayName).toBe('Evening Wind Down');
      expect(retrieved?.description).toBe('My customized evening routine widget');
      expect(retrieved?.layouts.medium).toBeDefined();
    });
  });
});
