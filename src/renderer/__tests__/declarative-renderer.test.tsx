/**
 * src/renderer/__tests__/declarative-renderer.test.tsx
 *
 * Comprehensive tests for the Declarative Widget Renderer:
 * - valid widgets (all 5 sample definitions across sizes)
 * - invalid widgets (missing layouts, missing sizes)
 * - missing data & empty data
 * - unsupported components (graceful fallback)
 * - interactive actions & WidgetPreview component
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  DeclarativeWidgetRenderer,
  ElementRenderer,
  WidgetPreview,
  resolveTemplate,
  formatTime,
  formatDate,
} from '../index';
import {
  weatherForecastWidget,
  calendarAgendaWidget,
  taskManagerWidget,
  newsHeadlinesWidget,
  kpiMetricsWidget,
} from '@/widgets/samples';
import { mockUniversalItems } from '../mockData';
import { Action, WidgetElement } from '@/widgets/schema';

// REASON: Mock Lucide icons in tests to avoid SVG native dependencies in test renderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('lucide-react-native', () => {
  const R = require('react');
  const { View: RNView } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const MockIcon = (props: any) =>
          R.createElement(RNView, { testID: `icon-${String(prop)}`, ...props });
        MockIcon.displayName = `Lucide.${String(prop)}`;
        return MockIcon;
      },
    }
  );
});

describe('DeclarativeWidgetRenderer', () => {
  // =========================================================================
  // 1. Valid Widgets
  // =========================================================================
  describe('Valid Widgets across sizes', () => {
    it('renders weatherForecastWidget in small, medium, and large sizes', () => {
      (['small', 'medium', 'large'] as const).forEach((size) => {
        let tree: renderer.ReactTestRenderer | undefined;
        act(() => {
          tree = renderer.create(
            <DeclarativeWidgetRenderer
              definition={weatherForecastWidget}
              size={size}
              items={mockUniversalItems}
            />
          );
        });
        expect(tree?.toJSON()).toBeDefined();
      });
    });

    it('renders calendarAgendaWidget in small, medium, and large sizes', () => {
      (['small', 'medium', 'large'] as const).forEach((size) => {
        let tree: renderer.ReactTestRenderer | undefined;
        act(() => {
          tree = renderer.create(
            <DeclarativeWidgetRenderer
              definition={calendarAgendaWidget}
              size={size}
              items={mockUniversalItems}
            />
          );
        });
        expect(tree?.toJSON()).toBeDefined();
      });
    });

    it('renders taskManagerWidget in small, medium, and large sizes', () => {
      (['small', 'medium', 'large'] as const).forEach((size) => {
        let tree: renderer.ReactTestRenderer | undefined;
        act(() => {
          tree = renderer.create(
            <DeclarativeWidgetRenderer
              definition={taskManagerWidget}
              size={size}
              items={mockUniversalItems}
            />
          );
        });
        expect(tree?.toJSON()).toBeDefined();
      });
    });

    it('renders newsHeadlinesWidget in small, medium, and large sizes', () => {
      (['small', 'medium', 'large'] as const).forEach((size) => {
        let tree: renderer.ReactTestRenderer | undefined;
        act(() => {
          tree = renderer.create(
            <DeclarativeWidgetRenderer
              definition={newsHeadlinesWidget}
              size={size}
              items={mockUniversalItems}
            />
          );
        });
        expect(tree?.toJSON()).toBeDefined();
      });
    });

    it('renders kpiMetricsWidget in small, medium, and large sizes', () => {
      (['small', 'medium', 'large'] as const).forEach((size) => {
        let tree: renderer.ReactTestRenderer | undefined;
        act(() => {
          tree = renderer.create(
            <DeclarativeWidgetRenderer
              definition={kpiMetricsWidget}
              size={size}
              items={mockUniversalItems}
            />
          );
        });
        expect(tree?.toJSON()).toBeDefined();
      });
    });
  });

  // =========================================================================
  // 2. Invalid Widgets
  // =========================================================================
  describe('Invalid Widgets handling', () => {
    it('renders error card when definition has no layouts', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          // REASON: Testing invalid widget schema
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <DeclarativeWidgetRenderer definition={{ type: 'empty', displayName: 'Empty' } as any} />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Invalid Widget Definition');
      expect(str).toContain('does not define any declarative layouts');
    });

    it('renders error card when requested layout is missing', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          // REASON: Testing definition with missing size layouts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <DeclarativeWidgetRenderer
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            definition={{ type: 'broken', displayName: 'Broken', layouts: {} } as any}
          />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Layout Not Available');
    });
  });

  // =========================================================================
  // 3. Missing and Empty Data
  // =========================================================================
  describe('Missing & Empty Data handling', () => {
    it('renders weather element with fallback when items array has no weather item', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          <ElementRenderer
            element={{ type: 'weather', displayMode: 'current' }}
            items={[]}
          />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Weather data unavailable');
    });

    it('renders task list element with emptyMessage when no tasks exist', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          <ElementRenderer
            element={{
              type: 'taskList',
              emptyMessage: 'Zero tasks on your plate!',
            }}
            items={[]}
          />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Zero tasks on your plate!');
    });

    it('renders article list element with emptyMessage when no articles exist', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          <ElementRenderer
            element={{
              type: 'articleList',
              emptyMessage: 'No news stories available right now.',
            }}
            items={[]}
          />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('No news stories available right now.');
    });
  });

  // =========================================================================
  // 4. Unsupported Components
  // =========================================================================
  describe('Unsupported Components handling', () => {
    it('renders UnsupportedView fallback without crashing for unknown element type', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          // REASON: Testing runtime fallback for unexpected element types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ElementRenderer element={{ type: 'hologram_projector' } as any} />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Unsupported component: hologram_projector');
    });

    it('renders UnsupportedView fallback when element is missing or null', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          // REASON: Testing runtime fallback for undefined element
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ElementRenderer element={undefined as any} />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Unsupported component: missing');
    });
  });

  // =========================================================================
  // 5. Individual Elements & Interactivity
  // =========================================================================
  describe('Individual Elements rendering & actions', () => {
    it('renders divider in horizontal and vertical orientations', () => {
      let treeH: renderer.ReactTestRenderer | undefined;
      let treeV: renderer.ReactTestRenderer | undefined;

      act(() => {
        treeH = renderer.create(
          <ElementRenderer element={{ type: 'divider', orientation: 'horizontal', thickness: 2 }} />
        );
        treeV = renderer.create(
          <ElementRenderer element={{ type: 'divider', orientation: 'vertical', thickness: 1 }} />
        );
      });

      expect(treeH?.toJSON()).toBeDefined();
      expect(treeV?.toJSON()).toBeDefined();
    });

    it('renders text element and invokes onAction when clicked', () => {
      const onAction = jest.fn();
      const action: Action = { type: 'navigate', route: '/home' };

      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          <ElementRenderer
            element={{
              type: 'text',
              content: 'Clickable Title',
              action,
            }}
            onAction={onAction}
          />
        );
      });

      expect(JSON.stringify(tree?.toJSON())).toContain('Clickable Title');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const touchable = tree?.root.findByProps({ activeOpacity: 0.7 });
      act(() => {
        touchable?.props.onPress();
      });
      expect(onAction).toHaveBeenCalledWith(action);
    });

    it('renders action button and triggers onAction callback on press', () => {
      const onAction = jest.fn();
      const action: Action = { type: 'run_connector', actionName: 'sync_feed' };

      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          <ElementRenderer
            element={{
              type: 'action',
              label: 'Sync Feed',
              variant: 'button',
              style: 'primary',
              action,
            }}
            onAction={onAction}
          />
        );
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const touchable = tree?.root.findByProps({ activeOpacity: 0.7 });
      act(() => {
        touchable?.props.onPress();
      });
      expect(onAction).toHaveBeenCalledWith(action);
    });

    it('renders metric element with trend indicator', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          <ElementRenderer
            element={{
              type: 'metric',
              label: 'Active Users',
              value: '14,200',
              trend: 'up',
              change: '+12%',
              unit: 'users',
            }}
          />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Active Users');
      expect(str).toContain('14,200');
      expect(str).toContain('+12%');
    });

    it('renders event element with date and location', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(
          <ElementRenderer
            element={{
              type: 'event',
              title: 'Sprint Demo',
              startAt: '2026-09-19T15:00:00.000Z',
              endAt: '2026-09-19T16:00:00.000Z',
              location: 'Zoom',
            }}
          />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Sprint Demo');
      expect(str).toContain('Zoom');
    });
  });

  // =========================================================================
  // 6. Data Binding Utilities
  // =========================================================================
  describe('dataBinding helpers', () => {
    it('resolveTemplate substitutes userConfig and item tokens', () => {
      const template = 'Hello {{config.city}}, temperature is {{weather.temp}}';
      const resolved = resolveTemplate(
        template,
        [{ id: '1', provider: 'weather', type: 'weather', temp: 24, condition: 'Clear', updatedAt: '2026-01-01T00:00:00Z' }],
        { city: 'London' }
      );
      expect(resolved).toBe('Hello London, temperature is 24');
    });

    it('resolveTemplate resolves nested metadata and shorthand item keys', () => {
      const template = 'Weather in {{weather.cityName}}: {{weather.temp}}°C, wind {{weather.windSpeed}} km/h (meta: {{weather.meta.cityName}}), Next: {{event.title}}';
      const items = [
        {
          id: 'w1',
          provider: 'weather',
          type: 'weather' as const,
          temp: 22,
          condition: 'Partly Cloudy',
          updatedAt: '2026-09-19T10:00:00Z',
          meta: {
            cityName: 'San Francisco',
            windSpeed: 14.5,
          },
        },
        {
          id: 'e1',
          provider: 'google_calendar',
          type: 'calendar_event' as const,
          title: 'Design Review',
          startAt: '2026-09-19T11:00:00Z',
          endAt: '2026-09-19T12:00:00Z',
          isAllDay: false,
          updatedAt: '2026-09-19T10:00:00Z',
        },
      ];

      const resolved = resolveTemplate(template, items);
      expect(resolved).toBe(
        'Weather in San Francisco: 22°C, wind 14.5 km/h (meta: San Francisco), Next: Design Review'
      );
    });

    it('formatTime formats ISO datetime to 12-hour string', () => {
      const timeStr = formatTime('2026-09-19T14:30:00.000Z');
      expect(typeof timeStr).toBe('string');
      expect(timeStr.length).toBeGreaterThan(0);
    });

    it('formatDate formats ISO datetime to readable date', () => {
      const dateStr = formatDate('2026-09-19T14:30:00.000Z');
      expect(typeof dateStr).toBe('string');
      expect(dateStr.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 7. WidgetPreview Component
  // =========================================================================
  describe('WidgetPreview component', () => {
    it('renders WidgetPreview with interactive widget tabs and size toggles', () => {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(<WidgetPreview initialDefinition={weatherForecastWidget} />);
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Widget Preview');
      expect(str).toContain('Weather & Forecast');
      expect(str).toContain('SMALL');
      expect(str).toContain('MEDIUM');
      expect(str).toContain('LARGE');
    });
  });
});
