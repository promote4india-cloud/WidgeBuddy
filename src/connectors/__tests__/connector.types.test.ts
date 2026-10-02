/**
 * src/connectors/__tests__/connector.types.test.ts
 *
 * Tests for ConnectorError and connector stub shapes.
 */

import { ConnectorError } from '../base/connector.types';
import { weatherConnector } from '../weather/weather.connector';
import { calendarConnector } from '../calendar/calendar.connector';
import { tasksConnector } from '../tasks/tasks.connector';
import { rssConnector } from '../rss/rss.connector';

// ---------------------------------------------------------------------------
// ConnectorError
// ---------------------------------------------------------------------------

describe('ConnectorError', () => {
  it('is an instance of Error', () => {
    const err = new ConnectorError('test error');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ConnectorError);
  });

  it('sets name to ConnectorError', () => {
    const err = new ConnectorError('msg');
    expect(err.name).toBe('ConnectorError');
  });

  it('carries code and retryable flag', () => {
    const err = new ConnectorError('msg', 'NOT_IMPLEMENTED', false);
    expect(err.code).toBe('NOT_IMPLEMENTED');
    expect(err.retryable).toBe(false);
  });

  it('defaults retryable to true', () => {
    const err = new ConnectorError('msg');
    expect(err.retryable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Connector stubs — structural checks
// ---------------------------------------------------------------------------

const allConnectors = [
  { name: 'weatherConnector', connector: weatherConnector },
  { name: 'calendarConnector', connector: calendarConnector },
  { name: 'tasksConnector', connector: tasksConnector },
  { name: 'rssConnector', connector: rssConnector },
];

describe.each(allConnectors)('$name connector shape', ({ connector }) => {
  it('has a meta object with required fields', () => {
    expect(connector.meta.type).toBeTruthy();
    expect(connector.meta.displayName).toBeTruthy();
    expect(connector.meta.description).toBeTruthy();
    expect(['none', 'apiKey', 'oauth2']).toContain(connector.meta.authType);
  });

  it('has a Zod configSchema', () => {
    expect(typeof connector.configSchema.parse).toBe('function');
  });

  it('fetch() rejects with ConnectorError (stub)', async () => {
    await expect(
      // REASON: stubs throw without a valid config — ConnectorError expected
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connector.fetch({} as any),
    ).rejects.toBeInstanceOf(ConnectorError);
  });
});

// ---------------------------------------------------------------------------
// Weather connector normalise() (pure function — safe to test directly)
// ---------------------------------------------------------------------------

describe('weatherConnector.normalise()', () => {
  const fakeRaw = {
    weather: [{ description: 'clear sky', icon: '01d' }],
    main: { temp: 22, feels_like: 20, humidity: 55 },
    dt: 1_700_000_000,
    name: 'London',
  };

  const fakeConfig = { apiKey: 'key', city: 'London', country: 'GB' };

  it('returns a UniversalItem array', () => {
    const items = weatherConnector.normalise(fakeRaw, fakeConfig);
    expect(items).toHaveLength(1);
    expect(items[0]?.type).toBe('weather');
  });

  it('sets temp directly', () => {
    const items = weatherConnector.normalise(fakeRaw, fakeConfig);
    const item = items[0];
    if (item?.type === 'weather') {
      expect(item.temp).toBe(22);
    }
  });
});
