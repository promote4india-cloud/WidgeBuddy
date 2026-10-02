/**
 * src/connectors/base/BaseConnector.ts
 *
 * Abstract base class for all connectors.
 * Manages connection lifecycle state machine, config validation via Zod,
 * health status reporting, and wraps pure normalisers into NormalizedDataResult.
 */

import { z } from 'zod';
import { UniversalItem } from '@/widgets/schema';
import {
  Connector,
  ConnectorMetadata,
  ConnectionStatus,
  ConnectionHealth,
  ConnectorError,
  NormalizedDataResult,
} from './connector.types';

export abstract class BaseConnector<TConfig = unknown, TRaw = unknown>
  implements Connector<TConfig>
{
  abstract readonly metadata: ConnectorMetadata;
  // REASON: Zod schemas have complex internal generic variance across versions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract readonly configSchema: z.ZodType<any, any, any>;

  protected currentStatus: ConnectionStatus = 'disconnected';
  // REASON: Active validated configuration stored dynamically after Zod parse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected activeConfig: any = null;
  protected lastHealthCheck: ConnectionHealth | null = null;

  get status(): ConnectionStatus {
    return this.currentStatus;
  }

  getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  /**
   * Connect with config. Validates config with Zod first, invokes onConnect hook,
   * and transitions status to 'connected' or 'error'.
   */
  async connect(config: TConfig): Promise<ConnectionStatus> {
    this.currentStatus = 'connecting';

    try {
      // Zod-first validation
      const parsedConfig = this.configSchema.parse(config);
      await this.onConnect(parsedConfig);
      this.activeConfig = parsedConfig;
      this.currentStatus = 'connected';
      return 'connected';
    } catch (err) {
      this.currentStatus = 'error';
      if (err instanceof ConnectorError) {
        throw err;
      }
      if (err instanceof z.ZodError) {
        throw new ConnectorError(
          `Invalid configuration: ${err.issues.map((i) => i.message).join(', ')}`,
          'INVALID_CONFIG',
          false,
        );
      }
      throw new ConnectorError(
        err instanceof Error ? err.message : 'Connection failed',
        'AUTH_FAILED',
        false,
      );
    }
  }

  /**
   * Disconnect and clear active configuration.
   */
  async disconnect(): Promise<void> {
    try {
      await this.onDisconnect();
    } finally {
      this.activeConfig = null;
      this.currentStatus = 'disconnected';
    }
  }

  /**
   * Fetch and normalize data.
   * Throws ConnectorError if not connected.
   */
  async fetch(params?: Record<string, unknown>): Promise<NormalizedDataResult> {
    if (this.currentStatus !== 'connected' || !this.activeConfig) {
      throw new ConnectorError(
        `Connector "${this.metadata.name}" is not connected. Call connect() first.`,
        'NOT_CONNECTED',
        false,
      );
    }

    try {
      const raw = await this.fetchRaw(this.activeConfig, params);
      const items = this.normalise(raw, this.activeConfig);

      return {
        items,
        schemaVersion: 1,
        fetchedAt: new Date().toISOString(),
        metadata: {
          source: this.metadata.id,
          itemCount: items.length,
        },
      };
    } catch (err) {
      if (err instanceof ConnectorError) {
        throw err;
      }
      throw new ConnectorError(
        err instanceof Error ? err.message : 'Failed to fetch data',
        'FETCH_FAILED',
        true,
      );
    }
  }

  /**
   * Refresh data by re-fetching. Subclasses can override for cache invalidation.
   */
  async refresh(params?: Record<string, unknown>): Promise<NormalizedDataResult> {
    return this.fetch(params);
  }

  /**
   * Check connection health.
   */
  async health(): Promise<ConnectionHealth> {
    const isHealthy = this.currentStatus === 'connected';
    const healthResult: ConnectionHealth = {
      healthy: isHealthy,
      status: this.currentStatus,
      message: isHealthy
        ? 'Connection is active and healthy.'
        : `Connection is currently ${this.currentStatus}.`,
      lastCheckedAt: new Date().toISOString(),
    };
    this.lastHealthCheck = healthResult;
    return healthResult;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle Hooks & Subclass Contracts
  // ---------------------------------------------------------------------------

  /**
   * Optional hook invoked during connect() after config is validated.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async onConnect(_config: any): Promise<void> {
    // Default no-op
  }

  /**
   * Optional hook invoked during disconnect().
   */
  protected async onDisconnect(): Promise<void> {
    // Default no-op
  }

  /**
   * Fetch raw response from external API/source.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract fetchRaw(config: any, params?: Record<string, unknown>): Promise<TRaw>;

  /**
   * Transform raw data into UniversalItem[].
   * MUST be a pure function (no side-effects, no network).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract normalise(raw: TRaw, config: any): UniversalItem[];
}
