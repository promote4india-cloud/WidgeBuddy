/**
 * src/connectors/__tests__/connector-framework.test.ts
 *
 * Unit tests for Connector Framework core types, ConnectorRegistry,
 * ConnectorError, and NormalizedDataResult validation.
 */

import {
  ConnectorError,
  NormalizedDataResult,
  NormalizedDataResultSchema,
  Connector,
  ConnectionHealth,
  ConnectionStatus,
  ConnectorMetadata,
} from '../base/connector.types';
import { ConnectorRegistry } from '../base/ConnectorRegistry';
import {
  fetchNormalisedData,
  fetchNormalizedResult,
  getAllConnectorMetas,
  getConnectorRegistry,
} from '@/services/connectorService';

// ---------------------------------------------------------------------------
// Test Connector Stub
// ---------------------------------------------------------------------------

function createTestConnector(
  id: string,
  name: string = 'Test Connector',
): Connector {
  let status: ConnectionStatus = 'disconnected';

  const metadata: ConnectorMetadata = {
    id,
    name,
    description: `Description for ${name}`,
    authType: 'none',
    staleTimeMs: 1234,
    supportedDataTypes: ['text'],
  };

  return {
    metadata,
    get status() {
      return status;
    },
    getStatus() {
      return status;
    },
    async connect() {
      status = 'connected';
      return status;
    },
    async disconnect() {
      status = 'disconnected';
    },
    async fetch() {
      if (status !== 'connected') {
        throw new ConnectorError('Not connected', 'NOT_CONNECTED', false);
      }
      return {
        items: [
          {
            id: 'item-1',
            provider: id,
            type: 'text',
            body: 'Hello World',
            format: 'plaintext',
            updatedAt: new Date().toISOString(),
          },
        ],
        schemaVersion: 1,
        fetchedAt: new Date().toISOString(),
        metadata: { source: id, itemCount: 1 },
      };
    },
    async refresh() {
      return this.fetch();
    },
    async health(): Promise<ConnectionHealth> {
      return {
        healthy: status === 'connected',
        status,
        lastCheckedAt: new Date().toISOString(),
      };
    },
  };
}

// ---------------------------------------------------------------------------
// ConnectorError Tests
// ---------------------------------------------------------------------------

describe('ConnectorError', () => {
  it('instantiates with defaults', () => {
    const error = new ConnectorError('Something failed');
    expect(error.name).toBe('ConnectorError');
    expect(error.message).toBe('Something failed');
    expect(error.code).toBe('CONNECTOR_ERROR');
    expect(error.retryable).toBe(true);
  });

  it('instantiates with custom code and retryable flag', () => {
    const error = new ConnectorError('Auth failed', 'AUTH_FAILED', false);
    expect(error.code).toBe('AUTH_FAILED');
    expect(error.retryable).toBe(false);
  });

  it('instantiates with options object', () => {
    const error = new ConnectorError('Rate limit exceeded', {
      code: 'RATE_LIMITED',
      retryable: true,
      details: { resetInSeconds: 60 },
    });
    expect(error.code).toBe('RATE_LIMITED');
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({ resetInSeconds: 60 });
  });
});

// ---------------------------------------------------------------------------
// NormalizedDataResultSchema Tests
// ---------------------------------------------------------------------------

describe('NormalizedDataResultSchema', () => {
  it('validates a valid NormalizedDataResult', () => {
    const validResult: NormalizedDataResult = {
      items: [
        {
          id: 'test-1',
          provider: 'test',
          type: 'text',
          body: 'Content',
          format: 'plaintext',
          updatedAt: new Date().toISOString(),
        },
      ],
      schemaVersion: 1,
      fetchedAt: new Date().toISOString(),
      metadata: {
        source: 'test',
        itemCount: 1,
        cached: false,
      },
    };

    const parsed = NormalizedDataResultSchema.parse(validResult);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.items).toHaveLength(1);
  });

  it('rejects an invalid NormalizedDataResult missing fetchedAt', () => {
    const invalid = {
      items: [],
      schemaVersion: 1,
    };
    expect(() => NormalizedDataResultSchema.parse(invalid)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ConnectorRegistry Tests
// ---------------------------------------------------------------------------

describe('ConnectorRegistry', () => {
  let registry: ConnectorRegistry;

  beforeEach(() => {
    registry = new ConnectorRegistry();
  });

  it('registers and retrieves a connector', () => {
    const connector = createTestConnector('custom-source', 'Custom Source');
    registry.register(connector);

    expect(registry.has('custom-source')).toBe(true);
    expect(registry.get('custom-source')).toBe(connector);
    expect(registry.getOrThrow('custom-source')).toBe(connector);
  });

  it('throws when registering a connector without an id', () => {
    const invalidConnector = createTestConnector('');
    expect(() => registry.register(invalidConnector)).toThrow(ConnectorError);
  });

  it('throws on duplicate connector registration', () => {
    const connector1 = createTestConnector('dupe-test');
    const connector2 = createTestConnector('dupe-test');

    registry.register(connector1);
    expect(() => registry.register(connector2)).toThrow(ConnectorError);
  });

  it('throws NOT_FOUND from getOrThrow for unknown connectors', () => {
    expect(() => registry.getOrThrow('non-existent')).toThrow(ConnectorError);
  });

  it('lists and discovers all registered connector metadata', () => {
    registry.register(createTestConnector('source-a', 'Source A'));
    registry.register(createTestConnector('source-b', 'Source B'));

    const list = registry.list();
    expect(list).toHaveLength(2);

    const metadataList = registry.discover();
    expect(metadataList).toHaveLength(2);
    expect(metadataList.map((m) => m.id)).toEqual(['source-a', 'source-b']);
  });

  it('unregisters a connector successfully', () => {
    registry.register(createTestConnector('removable'));
    expect(registry.has('removable')).toBe(true);

    const removed = registry.unregister('removable');
    expect(removed).toBe(true);
    expect(registry.has('removable')).toBe(false);
  });

  it('clears all connectors', () => {
    registry.register(createTestConnector('a'));
    registry.register(createTestConnector('b'));
    expect(registry.list()).toHaveLength(2);

    registry.clear();
    expect(registry.list()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ConnectorService & Normalized Data Guarantee Tests
// ---------------------------------------------------------------------------

describe('ConnectorService Runtime Integration', () => {
  it('discovers all registered connectors including mock and built-ins', () => {
    const metas = getAllConnectorMetas();
    const ids = metas.map((m) => m.id);

    expect(ids).toContain('mock');
    expect(ids).toContain('openweather');
    expect(ids).toContain('google_calendar');
    expect(ids).toContain('todoist');
    expect(ids).toContain('rss');
  });

  it('fetches a NormalizedDataResult from registered MockConnector', async () => {
    const result = await fetchNormalizedResult('mock', {
      apiKey: 'test-api-key',
      mockType: 'weather',
    });

    expect(result.schemaVersion).toBe(1);
    expect(result.fetchedAt).toBeDefined();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe('weather');
  });

  it('guarantees fetchNormalisedData only returns normalized items for widgets', async () => {
    const items = await fetchNormalisedData('mock', {
      apiKey: 'test-key',
      mockType: 'tasks',
      itemCount: 2,
    });

    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(2);
    expect(items[0]?.type).toBe('task');
  });

  it('throws ConnectorError when requesting unknown connector type', async () => {
    await expect(
      fetchNormalizedResult('invalid-connector-slug', {}),
    ).rejects.toBeInstanceOf(ConnectorError);
  });

  it('provides access to the active ConnectorRegistry instance', () => {
    const reg = getConnectorRegistry();
    expect(reg).toBeInstanceOf(ConnectorRegistry);
    expect(reg.has('mock')).toBe(true);
  });
});
