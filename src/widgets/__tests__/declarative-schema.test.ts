/**
 * src/widgets/__tests__/declarative-schema.test.ts
 *
 * Comprehensive unit tests for declarative widget schemas,
 * UI elements, layouts, validation helpers, error messaging,
 * and sample definitions.
 */

import {
  // Elements
  ActionSchema,
  ActionElementSchema,
  TextElementSchema,
  IconElementSchema,
  WeatherElementSchema,
  EventElementSchema,
  TaskListElementSchema,
  ArticleListElementSchema,
  MetricElementSchema,
  DividerElementSchema,
  ContainerElementSchema,
  WidgetElementSchema,

  // Layout & Sizes
  WidgetSizeSchema,
  WIDGET_SIZE_DIMENSIONS,
  WidgetLayoutDefinitionSchema,
  SizeLayoutsSchema,

  // Definition
  DeclarativeWidgetDefinitionSchema,

  // Validation Helpers
  validateWidgetDefinition,
  validateWidgetLayout,
  validateWidgetElement,
  assertValidWidgetDefinition,
  formatPath,
  formatZodError,
  formatErrorSummary,
  WidgetValidationError,
} from '../declarative';

import {
  weatherForecastWidget,
  calendarAgendaWidget,
  taskManagerWidget,
  newsHeadlinesWidget,
  kpiMetricsWidget,
  sampleWidgetDefinitions,
} from '../samples';

// ===========================================================================
// 1. UI Elements
// ===========================================================================

describe('Declarative UI Elements', () => {
  describe('ActionSchema & ActionElementSchema', () => {
    it('parses valid open_url action', () => {
      const action = ActionSchema.parse({
        type: 'open_url',
        url: 'https://example.com',
      });
      expect(action.type).toBe('open_url');
      expect(action.url).toBe('https://example.com');
    });

    it('rejects invalid URL in open_url', () => {
      expect(() =>
        ActionSchema.parse({
          type: 'open_url',
          url: 'not-a-valid-url',
        })
      ).toThrow();
    });

    it('parses standalone ActionElement', () => {
      const elem = ActionElementSchema.parse({
        type: 'action',
        label: 'Submit',
        variant: 'button',
        style: 'primary',
        action: {
          type: 'run_connector',
          actionName: 'sync_data',
        },
      });
      expect(elem.type).toBe('action');
      expect(elem.label).toBe('Submit');
      expect(elem.disabled).toBe(false); // default
    });

    it('rejects invalid action variant', () => {
      expect(() =>
        ActionElementSchema.parse({
          type: 'action',
          variant: 'floating-bubble',
          action: { type: 'custom' },
        })
      ).toThrow();
    });
  });

  describe('TextElementSchema', () => {
    it('parses valid text element with defaults', () => {
      const elem = TextElementSchema.parse({
        type: 'text',
        content: 'Hello World',
      });
      expect(elem.content).toBe('Hello World');
      expect(elem.variant).toBe('body');
      expect(elem.weight).toBe('regular');
      expect(elem.align).toBe('left');
    });

    it('parses text element with custom typography and size', () => {
      const elem = TextElementSchema.parse({
        type: 'text',
        content: 'Header Title',
        variant: 'heading',
        size: '2xl',
        weight: 'bold',
        align: 'center',
        maxLines: 2,
        color: '#3b82f6',
      });
      expect(elem.variant).toBe('heading');
      expect(elem.size).toBe('2xl');
      expect(elem.weight).toBe('bold');
      expect(elem.align).toBe('center');
      expect(elem.maxLines).toBe(2);
    });

    it('rejects non-positive maxLines', () => {
      expect(() =>
        TextElementSchema.parse({
          type: 'text',
          content: 'Title',
          maxLines: 0,
        })
      ).toThrow();
    });
  });

  describe('IconElementSchema', () => {
    it('parses valid icon with default size', () => {
      const elem = IconElementSchema.parse({
        type: 'icon',
        name: 'sun',
        color: '#f59e0b',
      });
      expect(elem.name).toBe('sun');
      expect(elem.size).toBe('medium');
    });

    it('parses icon with numeric pixel size', () => {
      const elem = IconElementSchema.parse({
        type: 'icon',
        name: 'cloud',
        size: 32,
      });
      expect(elem.size).toBe(32);
    });

    it('rejects empty icon name', () => {
      expect(() =>
        IconElementSchema.parse({
          type: 'icon',
          name: '',
        })
      ).toThrow();
    });
  });

  describe('WeatherElementSchema', () => {
    it('parses valid weather element with defaults', () => {
      const elem = WeatherElementSchema.parse({
        type: 'weather',
      });
      expect(elem.displayMode).toBe('current');
      expect(elem.showConditionIcon).toBe(true);
      expect(elem.tempUnit).toBe('auto');
      expect(elem.forecastDays).toBe(3);
    });

    it('parses multi-day forecast weather element', () => {
      const elem = WeatherElementSchema.parse({
        type: 'weather',
        displayMode: 'forecast',
        forecastDays: 7,
        showHumidity: true,
        showWind: true,
        tempUnit: 'celsius',
      });
      expect(elem.displayMode).toBe('forecast');
      expect(elem.forecastDays).toBe(7);
      expect(elem.showHumidity).toBe(true);
      expect(elem.showWind).toBe(true);
    });

    it('rejects forecastDays exceeding 7', () => {
      expect(() =>
        WeatherElementSchema.parse({
          type: 'weather',
          forecastDays: 14,
        })
      ).toThrow();
    });
  });

  describe('EventElementSchema', () => {
    it('parses valid event element', () => {
      const elem = EventElementSchema.parse({
        type: 'event',
        title: 'Quarterly Review',
        startAt: '2026-09-19T10:00:00.000Z',
        endAt: '2026-09-19T11:00:00.000Z',
        location: 'Main Auditorium',
        calendarColor: '#8b5cf6',
      });
      expect(elem.title).toBe('Quarterly Review');
      expect(elem.isAllDay).toBe(false);
      expect(elem.showTime).toBe(true);
      expect(elem.showLocation).toBe(true);
    });

    it('rejects event with empty title', () => {
      expect(() =>
        EventElementSchema.parse({
          type: 'event',
          title: '',
          startAt: '2026-09-19T10:00:00.000Z',
        })
      ).toThrow();
    });
  });

  describe('TaskListElementSchema', () => {
    it('parses valid task list with defaults', () => {
      const elem = TaskListElementSchema.parse({
        type: 'taskList',
      });
      expect(elem.maxItems).toBe(5);
      expect(elem.showCheckbox).toBe(true);
      expect(elem.showDueDate).toBe(true);
      expect(elem.filterStatus).toBe('pending');
      expect(elem.allowToggle).toBe(true);
    });

    it('rejects non-positive maxItems', () => {
      expect(() =>
        TaskListElementSchema.parse({
          type: 'taskList',
          maxItems: -1,
        })
      ).toThrow();
    });
  });

  describe('ArticleListElementSchema', () => {
    it('parses valid article list with defaults', () => {
      const elem = ArticleListElementSchema.parse({
        type: 'articleList',
      });
      expect(elem.maxItems).toBe(3);
      expect(elem.showImage).toBe(true);
      expect(elem.layout).toBe('compact');
    });

    it('parses card layout article list', () => {
      const elem = ArticleListElementSchema.parse({
        type: 'articleList',
        maxItems: 4,
        layout: 'card',
        showAuthor: true,
        showSummary: true,
      });
      expect(elem.layout).toBe('card');
      expect(elem.showAuthor).toBe(true);
    });
  });

  describe('MetricElementSchema', () => {
    it('parses valid metric with string value and trend', () => {
      const elem = MetricElementSchema.parse({
        type: 'metric',
        label: 'MRR',
        value: '$12,400',
        trend: 'up',
        change: '+8.2%',
        unit: 'USD',
      });
      expect(elem.label).toBe('MRR');
      expect(elem.value).toBe('$12,400');
      expect(elem.trend).toBe('up');
      expect(elem.size).toBe('medium');
    });

    it('parses numeric value metric', () => {
      const elem = MetricElementSchema.parse({
        type: 'metric',
        label: 'Response Time',
        value: 120,
        unit: 'ms',
        trend: 'down',
      });
      expect(elem.value).toBe(120);
    });

    it('rejects metric with empty label', () => {
      expect(() =>
        MetricElementSchema.parse({
          type: 'metric',
          label: '',
          value: 100,
        })
      ).toThrow();
    });
  });

  describe('DividerElementSchema', () => {
    it('parses horizontal divider with defaults', () => {
      const elem = DividerElementSchema.parse({
        type: 'divider',
      });
      expect(elem.orientation).toBe('horizontal');
      expect(elem.thickness).toBe(1);
      expect(elem.spacing).toBe(8);
      expect(elem.color).toBe('#e5e7eb');
    });

    it('parses vertical divider with custom color and thickness', () => {
      const elem = DividerElementSchema.parse({
        type: 'divider',
        orientation: 'vertical',
        thickness: 2,
        color: '#94a3b8',
        spacing: 12,
      });
      expect(elem.orientation).toBe('vertical');
      expect(elem.thickness).toBe(2);
    });
  });

  describe('ContainerElementSchema (Recursive)', () => {
    it('parses empty container with default direction', () => {
      const elem = ContainerElementSchema.parse({
        type: 'container',
      });
      expect(elem.direction).toBe('column');
      expect(elem.gap).toBe(0);
      expect(elem.children).toEqual([]);
    });

    it('parses nested containers to arbitrary depth', () => {
      const tree = {
        type: 'container',
        direction: 'column',
        gap: 12,
        padding: 16,
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: 'Dashboard Card',
                variant: 'title',
              },
              {
                type: 'icon',
                name: 'bell',
                size: 'small',
              },
            ],
          },
          {
            type: 'divider',
            orientation: 'horizontal',
          },
          {
            type: 'container',
            direction: 'row',
            children: [
              {
                type: 'metric',
                label: 'Active',
                value: 42,
              },
            ],
          },
        ],
      };

      const result = ContainerElementSchema.parse(tree);
      expect(result.children).toHaveLength(3);
      expect(result.children[0].type).toBe('container');
      expect((result.children[0] as typeof result).children).toHaveLength(2);
    });

    it('validates through the WidgetElementSchema discriminated union', () => {
      const text = WidgetElementSchema.parse({
        type: 'text',
        content: 'Sample text',
      });
      expect(text.type).toBe('text');

      const container = WidgetElementSchema.parse({
        type: 'container',
        children: [{ type: 'text', content: 'Child text' }],
      });
      expect(container.type).toBe('container');
    });
  });
});

// ===========================================================================
// 2. Layouts and Sizing
// ===========================================================================

describe('Widget Sizing & Layouts', () => {
  it('parses valid sizes', () => {
    expect(WidgetSizeSchema.parse('small')).toBe('small');
    expect(WidgetSizeSchema.parse('medium')).toBe('medium');
    expect(WidgetSizeSchema.parse('large')).toBe('large');
  });

  it('rejects invalid size', () => {
    expect(() => WidgetSizeSchema.parse('extra-large')).toThrow();
  });

  it('provides correct grid dimensions for small, medium, large', () => {
    expect(WIDGET_SIZE_DIMENSIONS.small).toEqual({ w: 2, h: 2 });
    expect(WIDGET_SIZE_DIMENSIONS.medium).toEqual({ w: 4, h: 2 });
    expect(WIDGET_SIZE_DIMENSIONS.large).toEqual({ w: 6, h: 4 });
  });

  it('parses a valid WidgetLayoutDefinition', () => {
    const layout = WidgetLayoutDefinitionSchema.parse({
      backgroundColor: '#ffffff',
      padding: 12,
      root: {
        type: 'container',
        children: [{ type: 'text', content: 'Layout test' }],
      },
    });
    expect(layout.backgroundColor).toBe('#ffffff');
    expect(layout.root.children).toHaveLength(1);
  });

  it('SizeLayoutsSchema enforces at least one layout size', () => {
    expect(() =>
      SizeLayoutsSchema.parse({
        small: undefined,
        medium: undefined,
        large: undefined,
      })
    ).toThrow(/must provide at least one size layout/);
  });

  it('SizeLayoutsSchema accepts definition with only small layout', () => {
    const result = SizeLayoutsSchema.parse({
      small: {
        root: { type: 'container', children: [] },
      },
    });
    expect(result.small).toBeDefined();
    expect(result.medium).toBeUndefined();
  });
});

// ===========================================================================
// 3. DeclarativeWidgetDefinition Schema
// ===========================================================================

describe('DeclarativeWidgetDefinitionSchema', () => {
  const minimalValid = {
    id: 'minimal-widget',
    displayName: 'Minimal Widget',
    version: '1.0.0',
    supportedSizes: ['small'] as const,
    defaultSize: 'small' as const,
    layouts: {
      small: {
        root: {
          type: 'container' as const,
          children: [{ type: 'text' as const, content: 'Hi' }],
        },
      },
    },
  };

  it('parses a minimal valid declarative widget definition', () => {
    const result = DeclarativeWidgetDefinitionSchema.parse(minimalValid);
    expect(result.id).toBe('minimal-widget');
    expect(result.displayName).toBe('Minimal Widget');
    expect(result.version).toBe('1.0.0');
    expect(result.defaultSize).toBe('small');
  });

  it('rejects uppercase or invalid characters in widget id', () => {
    expect(() =>
      DeclarativeWidgetDefinitionSchema.parse({
        ...minimalValid,
        id: 'My Invalid Widget!',
      })
    ).toThrow(/Widget id must be lowercase/);
  });

  it('rejects invalid semantic version', () => {
    expect(() =>
      DeclarativeWidgetDefinitionSchema.parse({
        ...minimalValid,
        version: 'v1.0',
      })
    ).toThrow(/valid semver string/);
  });

  it('rejects when defaultSize is missing from layouts', () => {
    expect(() =>
      DeclarativeWidgetDefinitionSchema.parse({
        ...minimalValid,
        defaultSize: 'medium',
        layouts: {
          small: { root: { type: 'container', children: [] } },
        },
      })
    ).toThrow(/Default size .* must have a corresponding layout/);
  });

  it('rejects when a size in supportedSizes is missing from layouts', () => {
    expect(() =>
      DeclarativeWidgetDefinitionSchema.parse({
        ...minimalValid,
        supportedSizes: ['small', 'large'],
        layouts: {
          small: { root: { type: 'container', children: [] } },
        },
      })
    ).toThrow(/The following supported sizes are missing a layout definition: large/);
  });
});

// ===========================================================================
// 4. Validation Helpers & Error Messages
// ===========================================================================

describe('Validation Helpers & Error Formatting', () => {
  it('formatPath produces clear bracket and dot notation', () => {
    expect(formatPath([])).toBe('(root)');
    expect(formatPath(['layouts', 'small', 'root', 'children', 0, 'content'])).toBe(
      'layouts.small.root.children[0].content'
    );
  });

  it('validateWidgetDefinition returns success: true for valid definition', () => {
    const res = validateWidgetDefinition({
      id: 'valid-widget',
      displayName: 'Valid Widget',
      version: '1.0.0',
      supportedSizes: ['medium'],
      defaultSize: 'medium',
      layouts: {
        medium: {
          root: { type: 'container', children: [] },
        },
      },
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.id).toBe('valid-widget');
    }
  });

  it('validateWidgetDefinition returns structured errors with hints on failure', () => {
    const res = validateWidgetDefinition({
      id: 'INVALID ID',
      displayName: '',
      version: 'beta-1',
      defaultSize: 'large',
      layouts: {
        small: {
          root: {
            type: 'container',
            children: [
              {
                type: 'action',
                action: { type: 'open_url', url: 'not-url' },
              },
            ],
          },
        },
      },
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errorSummary).toContain('validation failed with');

      // Check URL hint
      const urlError = res.errors.find((e) => e.path.includes('url'));
      expect(urlError).toBeDefined();
      expect(urlError?.suggestion).toContain('http:// or https://');

      // Check ID hint
      const idError = res.errors.find((e) => e.path === 'id');
      expect(idError).toBeDefined();
      expect(idError?.suggestion).toContain('lowercase letters');
    }
  });

  it('assertValidWidgetDefinition throws WidgetValidationError with summary', () => {
    expect(() =>
      assertValidWidgetDefinition({ id: '' })
    ).toThrow(WidgetValidationError);
  });

  it('validateWidgetLayout validates standalone layout tree', () => {
    const res = validateWidgetLayout({
      root: {
        type: 'container',
        children: [{ type: 'divider' }],
      },
    });
    expect(res.success).toBe(true);
  });

  it('validateWidgetElement validates standalone UI element', () => {
    const res = validateWidgetElement({
      type: 'metric',
      label: 'Steps',
      value: 8420,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.type).toBe('metric');
    }
  });

  it('formatErrorSummary formats multi-error messages readably', () => {
    const summary = formatErrorSummary('TestWidget', [
      { path: 'id', message: 'Too short', code: 'too_small', suggestion: 'Add more chars' },
      { path: 'version', message: 'Invalid semver', code: 'custom' },
    ]);
    expect(summary).toContain('TestWidget validation failed with 2 error(s):');
    expect(summary).toContain('• [id] Too short (Hint: Add more chars)');
    expect(summary).toContain('• [version] Invalid semver');
  });
});

// ===========================================================================
// 5. Valid Sample Widget Definitions
// ===========================================================================

describe('Sample Widget Definitions', () => {
  it('contains at least 5 sample widget definitions', () => {
    expect(sampleWidgetDefinitions.length).toBeGreaterThanOrEqual(5);
  });

  it('validates weatherForecastWidget across all sizes', () => {
    const result = DeclarativeWidgetDefinitionSchema.parse(weatherForecastWidget);
    expect(result.id).toBe('weather-forecast-widget');
    expect(result.layouts.small).toBeDefined();
    expect(result.layouts.medium).toBeDefined();
    expect(result.layouts.large).toBeDefined();
    expect(result.connectorTypes).toContain('openweather');
  });

  it('validates calendarAgendaWidget across all sizes', () => {
    const result = DeclarativeWidgetDefinitionSchema.parse(calendarAgendaWidget);
    expect(result.id).toBe('calendar-agenda-widget');
    expect(result.layouts.small).toBeDefined();
    expect(result.layouts.medium).toBeDefined();
    expect(result.layouts.large).toBeDefined();
    expect(result.connectorTypes).toContain('google_calendar');
  });

  it('validates taskManagerWidget across all sizes', () => {
    const result = DeclarativeWidgetDefinitionSchema.parse(taskManagerWidget);
    expect(result.id).toBe('task-manager-widget');
    expect(result.layouts.small).toBeDefined();
    expect(result.layouts.medium).toBeDefined();
    expect(result.layouts.large).toBeDefined();
    expect(result.connectorTypes).toContain('todoist');
  });

  it('validates newsHeadlinesWidget across all sizes', () => {
    const result = DeclarativeWidgetDefinitionSchema.parse(newsHeadlinesWidget);
    expect(result.id).toBe('news-headlines-widget');
    expect(result.layouts.small).toBeDefined();
    expect(result.layouts.medium).toBeDefined();
    expect(result.layouts.large).toBeDefined();
    expect(result.connectorTypes).toContain('rss');
  });

  it('validates kpiMetricsWidget across all sizes', () => {
    const result = DeclarativeWidgetDefinitionSchema.parse(kpiMetricsWidget);
    expect(result.id).toBe('kpi-metrics-widget');
    expect(result.layouts.small).toBeDefined();
    expect(result.layouts.medium).toBeDefined();
    expect(result.layouts.large).toBeDefined();
    expect(result.category).toBe('finance');
  });

  it('serializes and deserializes sample definitions without data loss', () => {
    for (const sample of sampleWidgetDefinitions) {
      const json = JSON.stringify(sample);
      const deserialized = JSON.parse(json);
      const validated = DeclarativeWidgetDefinitionSchema.parse(deserialized);
      expect(validated.id).toBe(sample.id);
      expect(validated.displayName).toBe(sample.displayName);
    }
  });
});
