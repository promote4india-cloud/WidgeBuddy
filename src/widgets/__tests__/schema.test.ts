/**
 * src/widgets/__tests__/schema.test.ts
 *
 * Tests for all Zod schemas in src/widgets/schema.ts.
 * Tests: valid parse, invalid parse, default values.
 */

import {
  ConfigFieldSchema,
  WidgetDefinitionSchema,
  WidgetLayoutSchema,
  WidgetInstanceSchema,
  UniversalItemSchema,
} from '../schema';

// ---------------------------------------------------------------------------
// ConfigFieldSchema
// ---------------------------------------------------------------------------

describe('ConfigFieldSchema', () => {
  it('parses a valid text field', () => {
    const result = ConfigFieldSchema.parse({
      key: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    });
    expect(result.key).toBe('title');
    expect(result.required).toBe(true);
  });

  it('applies default required=false', () => {
    const result = ConfigFieldSchema.parse({
      key: 'k',
      label: 'L',
      type: 'boolean',
    });
    expect(result.required).toBe(false);
  });

  it('parses a select field with options', () => {
    const result = ConfigFieldSchema.parse({
      key: 'unit',
      label: 'Unit',
      type: 'select',
      options: [{ label: 'Celsius', value: 'celsius' }],
      required: false,
    });
    expect(result.options).toHaveLength(1);
  });

  it('rejects unknown type', () => {
    expect(() =>
      ConfigFieldSchema.parse({ key: 'k', label: 'L', type: 'datetime' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// WidgetDefinitionSchema
// ---------------------------------------------------------------------------

describe('WidgetDefinitionSchema', () => {
  const base = {
    type: 'clock',
    displayName: 'Clock',
    connectorTypes: [],
  };

  it('parses a minimal valid definition', () => {
    const result = WidgetDefinitionSchema.parse(base);
    expect(result.type).toBe('clock');
    expect(result.version).toBe('1.0.0');
    expect(result.minW).toBe(2);
    expect(result.configFields).toEqual([]);
  });

  it('accepts optional description', () => {
    const result = WidgetDefinitionSchema.parse({ ...base, description: 'A clock widget' });
    expect(result.description).toBe('A clock widget');
  });

  it('rejects if displayName is missing', () => {
    expect(() => WidgetDefinitionSchema.parse({ ...base, displayName: undefined })).toThrow();
  });

  it('rejects minW less than 1', () => {
    expect(() => WidgetDefinitionSchema.parse({ ...base, minW: 0 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// WidgetLayoutSchema
// ---------------------------------------------------------------------------

describe('WidgetLayoutSchema', () => {
  it('parses a valid layout', () => {
    const result = WidgetLayoutSchema.parse({ x: 0, y: 0, w: 2, h: 2 });
    expect(result.page).toBe(0); // default
  });

  it('rejects w < 1', () => {
    expect(() => WidgetLayoutSchema.parse({ x: 0, y: 0, w: 0, h: 2 })).toThrow();
  });

  it('rejects negative x', () => {
    expect(() => WidgetLayoutSchema.parse({ x: -1, y: 0, w: 2, h: 2 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// WidgetInstanceSchema
// ---------------------------------------------------------------------------

describe('WidgetInstanceSchema', () => {
  const validInstance = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    definitionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    connectorId: null,
    layout: { x: 0, y: 0, w: 2, h: 2 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('parses a valid instance with null connectorId', () => {
    const result = WidgetInstanceSchema.parse(validInstance);
    expect(result.connectorId).toBeNull();
    expect(result.userConfig).toEqual({});
  });

  it('parses with a connector UUID', () => {
    const result = WidgetInstanceSchema.parse({
      ...validInstance,
      connectorId: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    });
    expect(result.connectorId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d482');
  });

  it('rejects invalid UUID for id', () => {
    expect(() =>
      WidgetInstanceSchema.parse({ ...validInstance, id: 'not-a-uuid' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// UniversalItemSchema
// ---------------------------------------------------------------------------

describe('UniversalItemSchema', () => {
  const baseItem = {
    id: 'item-123',
    provider: 'test-provider',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('parses a valid weather item', () => {
    const result = UniversalItemSchema.parse({
      ...baseItem,
      type: 'weather',
      temp: 22.5,
      condition: 'Sunny',
    });
    expect(result.type).toBe('weather');
    if (result.type === 'weather') {
      expect(result.temp).toBe(22.5);
    }
  });

  it('parses a valid calendar event item', () => {
    const result = UniversalItemSchema.parse({
      ...baseItem,
      type: 'calendar_event',
      title: 'Meeting',
      startAt: '2026-01-01T10:00:00.000Z',
      endAt: '2026-01-01T11:00:00.000Z',
    });
    expect(result.type).toBe('calendar_event');
    if (result.type === 'calendar_event') {
      expect(result.isAllDay).toBe(false);
    }
  });

  it('parses a valid task item', () => {
    const result = UniversalItemSchema.parse({
      ...baseItem,
      type: 'task',
      title: 'Buy groceries',
      status: 'pending',
    });
    expect(result.type).toBe('task');
  });

  it('rejects an unknown type', () => {
    expect(() =>
      UniversalItemSchema.parse({
        ...baseItem,
        type: 'unknown',
      }),
    ).toThrow();
  });

  it('rejects a valid type with missing required fields', () => {
    expect(() =>
      UniversalItemSchema.parse({
        ...baseItem,
        type: 'weather',
        temp: 22,
        // missing condition
      }),
    ).toThrow();
  });
});

