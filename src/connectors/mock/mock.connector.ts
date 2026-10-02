/**
 * src/connectors/mock/mock.connector.ts
 *
 * MockConnector implementation proving the connector architecture.
 * Implements Connector lifecycle via BaseConnector.
 *
 * Features:
 * - Configurable auth & simulation parameters
 * - Supports generating normalized items for weather, task, calendar_event, and article types
 * - Strict validation against UniversalItemSchema
 * - Error testing (simulated failures, auth rejections, disconnected fetch attempts)
 */

import { z } from 'zod';
import { UniversalItem } from '@/widgets/schema';
import { BaseConnector } from '../base/BaseConnector';
import { ConnectorMetadata, ConnectorError } from '../base/connector.types';

// ---------------------------------------------------------------------------
// Config Schema & Types
// ---------------------------------------------------------------------------

export const MockConnectorConfigSchema = z.object({
  /** Simulated API key. Values like 'invalid' will trigger auth failure */
  apiKey: z.string().min(1),
  /** Which type of mock data to generate */
  mockType: z
    .enum(['weather', 'tasks', 'calendar', 'rss', 'metric', 'text'])
    .default('weather'),
  /** Number of items to generate (for collections) */
  itemCount: z.number().int().min(1).max(50).default(3),
  /** If true, the next fetch() call will reject with an error */
  failNext: z.boolean().optional(),
  /** If true, connect() will fail */
  failAuth: z.boolean().optional(),
  /** Artificial latency in milliseconds for async simulation */
  latencyMs: z.number().min(0).default(0),
});

export type MockConnectorConfig = {
  apiKey: string;
  mockType?: 'weather' | 'tasks' | 'calendar' | 'rss' | 'metric' | 'text';
  itemCount?: number;
  failNext?: boolean;
  failAuth?: boolean;
  latencyMs?: number;
};

// ---------------------------------------------------------------------------
// Raw Response Type
// ---------------------------------------------------------------------------

export interface MockRawResponse {
  type: string;
  count: number;
  records: Array<Record<string, unknown>>;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// MockConnector Class
// ---------------------------------------------------------------------------

export class MockConnector extends BaseConnector<
  MockConnectorConfig,
  MockRawResponse
> {
  readonly metadata: ConnectorMetadata = {
    id: 'mock',
    name: 'Mock Data Connector',
    description: 'Mock data provider for architecture verification and unit testing.',
    version: '1.0.0',
    authType: 'apiKey',
    supportedDataTypes: [
      'weather',
      'task',
      'calendar_event',
      'article',
      'metric',
      'text',
    ],
    staleTimeMs: 10_000,
    type: 'mock',
    displayName: 'Mock Data Connector',
  };

  readonly configSchema = MockConnectorConfigSchema;

  /**
   * Hook executed during connect(). Validates credentials.
   */
  protected override async onConnect(config: MockConnectorConfig): Promise<void> {
    if (config.failAuth || config.apiKey === 'invalid') {
      throw new ConnectorError(
        'Authentication failed: invalid mock API key.',
        'AUTH_FAILED',
        false,
      );
    }
  }

  /**
   * Simulates fetching raw data from an external provider.
   */
  protected override async fetchRaw(
    config: Required<MockConnectorConfig>,
    _params?: Record<string, unknown>,
  ): Promise<MockRawResponse> {
    if (config.failNext) {
      throw new ConnectorError(
        'Simulated mock connector fetch failure.',
        'SIMULATED_FAILURE',
        true,
      );
    }

    if (config.latencyMs && config.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.latencyMs));
    }

    const now = new Date().toISOString();
    const records: Array<Record<string, unknown>> = [];
    const mockType = config.mockType ?? 'weather';
    const itemCount = config.itemCount ?? 3;

    switch (mockType) {
      case 'weather': {
        records.push({
          id: 'mock-weather-1',
          temp: 21.5,
          condition: 'Partly Cloudy',
          feelsLike: 20.0,
          humidity: 62,
          iconUrl: 'https://example.com/icons/partly-cloudy.png',
        });
        break;
      }

      case 'tasks': {
        for (let i = 1; i <= itemCount; i++) {
          records.push({
            id: `mock-task-${i}`,
            title: `Mock Task #${i}`,
            status: i % 2 === 0 ? 'completed' : 'pending',
            priority: i === 1 ? 'high' : 'normal',
            project: 'WidgeBuddy',
          });
        }
        break;
      }

      case 'calendar': {
        for (let i = 1; i <= itemCount; i++) {
          const start = new Date(Date.now() + i * 3600 * 1000).toISOString();
          const end = new Date(Date.now() + (i + 1) * 3600 * 1000).toISOString();
          records.push({
            id: `mock-event-${i}`,
            title: `Team Standup #${i}`,
            startAt: start,
            endAt: end,
            isAllDay: false,
            location: 'Meeting Room Alpha',
          });
        }
        break;
      }

      case 'rss': {
        for (let i = 1; i <= itemCount; i++) {
          records.push({
            id: `mock-article-${i}`,
            title: `Antigravity Tech News #${i}`,
            url: `https://example.com/news/${i}`,
            summary: `Summary of simulated article #${i}`,
            author: 'Tech Reporter',
            publishedAt: now,
          });
        }
        break;
      }

      case 'metric': {
        records.push({
          id: 'mock-metric-1',
          label: 'System Load',
          value: 42,
          unit: '%',
          trend: 'up',
          change: 2.5,
        });
        break;
      }

      case 'text':
      default: {
        records.push({
          id: 'mock-text-1',
          title: 'Daily Inspiration',
          body: 'Simplicity is the soul of efficiency.',
          format: 'plaintext',
        });
        break;
      }
    }

    return {
      type: mockType,
      count: records.length,
      records,
      generatedAt: now,
    };
  }

  /**
   * Pure transformation from raw mock response to UniversalItem[].
   */
  protected override normalise(
    raw: MockRawResponse,
    _config: MockConnectorConfig,
  ): UniversalItem[] {
    const updatedAt = new Date().toISOString();

    switch (raw.type) {
      case 'weather': {
        const item = raw.records[0];
        if (!item) return [];
        return [
          {
            id: String(item['id'] ?? 'mock-weather-1'),
            provider: 'mock',
            type: 'weather',
            temp: Number(item['temp'] ?? 20),
            condition: String(item['condition'] ?? 'Clear'),
            feelsLike: item['feelsLike'] ? Number(item['feelsLike']) : undefined,
            humidity: item['humidity'] ? Number(item['humidity']) : undefined,
            iconUrl: item['iconUrl'] ? String(item['iconUrl']) : undefined,
            updatedAt,
          },
        ];
      }

      case 'tasks': {
        return raw.records.map((r, index) => ({
          id: String(r['id'] ?? `mock-task-${index + 1}`),
          provider: 'mock',
          type: 'task',
          title: String(r['title'] ?? `Task ${index + 1}`),
          status: (r['status'] === 'completed' ? 'completed' : 'pending') as
            | 'pending'
            | 'completed',
          priority: r['priority'] ? String(r['priority']) : undefined,
          project: r['project'] ? String(r['project']) : undefined,
          updatedAt,
        }));
      }

      case 'calendar': {
        return raw.records.map((r, index) => ({
          id: String(r['id'] ?? `mock-event-${index + 1}`),
          provider: 'mock',
          type: 'calendar_event',
          title: String(r['title'] ?? `Event ${index + 1}`),
          startAt: String(
            r['startAt'] ?? new Date(Date.now() + 3600_000).toISOString(),
          ),
          endAt: String(
            r['endAt'] ?? new Date(Date.now() + 7200_000).toISOString(),
          ),
          isAllDay: Boolean(r['isAllDay'] ?? false),
          location: r['location'] ? String(r['location']) : undefined,
          updatedAt,
        }));
      }

      case 'rss': {
        return raw.records.map((r, index) => ({
          id: String(r['id'] ?? `mock-article-${index + 1}`),
          provider: 'mock',
          type: 'article',
          title: String(r['title'] ?? `Article ${index + 1}`),
          url: String(r['url'] ?? 'https://example.com/article'),
          summary: r['summary'] ? String(r['summary']) : undefined,
          author: r['author'] ? String(r['author']) : undefined,
          publishedAt: r['publishedAt'] ? String(r['publishedAt']) : undefined,
          updatedAt,
        }));
      }

      case 'metric': {
        const item = raw.records[0];
        if (!item) return [];
        return [
          {
            id: String(item['id'] ?? 'mock-metric-1'),
            provider: 'mock',
            type: 'metric',
            label: String(item['label'] ?? 'Metric'),
            value: Number(item['value'] ?? 0),
            unit: item['unit'] ? String(item['unit']) : undefined,
            trend: item['trend'] as 'up' | 'down' | 'flat' | undefined,
            change: item['change'] ? Number(item['change']) : undefined,
            updatedAt,
          },
        ];
      }

      case 'text':
      default: {
        const item = raw.records[0];
        if (!item) return [];
        return [
          {
            id: String(item['id'] ?? 'mock-text-1'),
            provider: 'mock',
            type: 'text',
            title: item['title'] ? String(item['title']) : undefined,
            body: String(item['body'] ?? 'Mock content'),
            format: 'plaintext',
            updatedAt,
          },
        ];
      }
    }
  }
}

/** Singleton instance for general use */
export const mockConnector = new MockConnector();
