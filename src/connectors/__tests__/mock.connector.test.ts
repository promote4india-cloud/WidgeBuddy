/**
 * src/connectors/__tests__/mock.connector.test.ts
 *
 * Unit tests for MockConnector demonstrating full Connector lifecycle:
 * metadata, auth status, connect, disconnect, refresh, fetch, health/status.
 */

import { MockConnector } from '../mock/mock.connector';
import { ConnectorError, NormalizedDataResultSchema } from '../base/connector.types';
import { UniversalItemSchema } from '@/widgets/schema';

describe('MockConnector Lifecycle & Architecture', () => {
  let connector: MockConnector;

  beforeEach(() => {
    connector = new MockConnector();
  });

  describe('metadata', () => {
    it('provides rich connector metadata', () => {
      const meta = connector.metadata;
      expect(meta.id).toBe('mock');
      expect(meta.name).toBe('Mock Data Connector');
      expect(meta.description).toBeTruthy();
      expect(meta.authType).toBe('apiKey');
      expect(meta.supportedDataTypes).toContain('weather');
      expect(meta.supportedDataTypes).toContain('task');
      expect(meta.supportedDataTypes).toContain('calendar_event');
      expect(meta.supportedDataTypes).toContain('article');
      expect(meta.staleTimeMs).toBeGreaterThan(0);
    });
  });

  describe('authentication & connection status', () => {
    it('starts in disconnected status', () => {
      expect(connector.status).toBe('disconnected');
      expect(connector.getStatus()).toBe('disconnected');
    });

    it('rejects fetch() when disconnected with NOT_CONNECTED error', async () => {
      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
      try {
        await connector.fetch();
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectorError);
        expect((err as ConnectorError).code).toBe('NOT_CONNECTED');
      }
    });

    it('rejects connect() when config fails Zod validation', async () => {
      // Missing apiKey
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(connector.connect({} as any)).rejects.toThrow(ConnectorError);
      expect(connector.status).toBe('error');
    });

    it('rejects connect() when authentication fails', async () => {
      await expect(
        connector.connect({
          apiKey: 'invalid',
          mockType: 'weather',
        }),
      ).rejects.toThrow(ConnectorError);

      try {
        await connector.connect({ apiKey: 'invalid', mockType: 'weather' });
      } catch (err) {
        expect((err as ConnectorError).code).toBe('AUTH_FAILED');
      }
      expect(connector.status).toBe('error');
    });

    it('transitions to connected status on valid connect()', async () => {
      const status = await connector.connect({
        apiKey: 'valid-test-key',
        mockType: 'weather',
      });

      expect(status).toBe('connected');
      expect(connector.status).toBe('connected');
      expect(connector.getStatus()).toBe('connected');
    });

    it('transitions back to disconnected on disconnect()', async () => {
      await connector.connect({
        apiKey: 'valid-test-key',
        mockType: 'weather',
      });
      expect(connector.status).toBe('connected');

      await connector.disconnect();
      expect(connector.status).toBe('disconnected');
      expect(connector.getStatus()).toBe('disconnected');

      // Subsequent fetch should fail
      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
    });
  });

  describe('health and status reporting', () => {
    it('reports unhealthy when disconnected', async () => {
      const health = await connector.health();
      expect(health.healthy).toBe(false);
      expect(health.status).toBe('disconnected');
      expect(health.lastCheckedAt).toBeDefined();
    });

    it('reports healthy when connected', async () => {
      await connector.connect({
        apiKey: 'valid-test-key',
        mockType: 'weather',
      });

      const health = await connector.health();
      expect(health.healthy).toBe(true);
      expect(health.status).toBe('connected');
      expect(health.message).toContain('active');
    });
  });

  describe('data fetching and normalization', () => {
    it('fetches and returns a valid NormalizedDataResult for weather', async () => {
      await connector.connect({
        apiKey: 'valid-key',
        mockType: 'weather',
      });

      const result = await connector.fetch();

      // Validate against NormalizedDataResultSchema
      const validated = NormalizedDataResultSchema.parse(result);
      expect(validated.schemaVersion).toBe(1);
      expect(validated.items).toHaveLength(1);
      expect(validated.metadata?.source).toBe('mock');

      // Validate item against UniversalItemSchema
      const item = UniversalItemSchema.parse(result.items[0]);
      expect(item.type).toBe('weather');
      if (item.type === 'weather') {
        expect(item.temp).toBe(21.5);
        expect(item.condition).toBe('Partly Cloudy');
      }
    });

    it('fetches normalized task items', async () => {
      await connector.connect({
        apiKey: 'valid-key',
        mockType: 'tasks',
        itemCount: 4,
      });

      const result = await connector.fetch();
      expect(result.items).toHaveLength(4);

      for (const item of result.items) {
        const parsed = UniversalItemSchema.parse(item);
        expect(parsed.type).toBe('task');
      }
    });

    it('fetches normalized calendar items', async () => {
      await connector.connect({
        apiKey: 'valid-key',
        mockType: 'calendar',
        itemCount: 2,
      });

      const result = await connector.fetch();
      expect(result.items).toHaveLength(2);

      for (const item of result.items) {
        const parsed = UniversalItemSchema.parse(item);
        expect(parsed.type).toBe('calendar_event');
      }
    });

    it('fetches normalized rss / article items', async () => {
      await connector.connect({
        apiKey: 'valid-key',
        mockType: 'rss',
        itemCount: 3,
      });

      const result = await connector.fetch();
      expect(result.items).toHaveLength(3);

      for (const item of result.items) {
        const parsed = UniversalItemSchema.parse(item);
        expect(parsed.type).toBe('article');
      }
    });

    it('fetches normalized metric and text items', async () => {
      // Metric
      await connector.connect({
        apiKey: 'valid-key',
        mockType: 'metric',
      });
      let result = await connector.fetch();
      expect(result.items[0]?.type).toBe('metric');

      // Text
      await connector.connect({
        apiKey: 'valid-key',
        mockType: 'text',
      });
      result = await connector.fetch();
      expect(result.items[0]?.type).toBe('text');
    });

    it('refresh() returns fresh NormalizedDataResult', async () => {
      await connector.connect({
        apiKey: 'valid-key',
        mockType: 'weather',
      });

      const res1 = await connector.fetch();
      const res2 = await connector.refresh();

      expect(res1.items).toBeDefined();
      expect(res2.items).toBeDefined();
      expect(res2.fetchedAt).toBeDefined();
    });

    it('simulates fetch failure when failNext is configured', async () => {
      await connector.connect({
        apiKey: 'valid-key',
        mockType: 'weather',
        failNext: true,
      });

      await expect(connector.fetch()).rejects.toThrow(ConnectorError);
      try {
        await connector.fetch();
      } catch (err) {
        expect((err as ConnectorError).code).toBe('SIMULATED_FAILURE');
      }
    });
  });
});
