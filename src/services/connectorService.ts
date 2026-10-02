/**
 * src/services/connectorService.ts
 *
 * Runtime connector dispatch — the single entry-point for fetching normalised data.
 * Backed by ConnectorRegistry to discover, connect, and fetch from all data sources.
 *
 * Layer Rule:
 * The widget engine only consumes normalized data (NormalizedDataResult or UniversalItem[]).
 */

import {
  Connector,
  ConnectorMetadata,
  ConnectorMeta,
  ConnectorDef,
  ConnectionStatus,
  ConnectionHealth,
  ConnectorError,
  NormalizedDataResult,
} from '@/connectors/base/connector.types';
import { UniversalItem } from '@/widgets/schema';
import { connectorRegistry, ConnectorRegistry } from '@/connectors/base/ConnectorRegistry';
import { mockConnector } from '@/connectors/mock/mock.connector';
import { weatherConnector } from '@/connectors/weather/weather.connector';
import { calendarConnector } from '@/connectors/calendar/calendar.connector';
import { tasksConnector } from '@/connectors/tasks/tasks.connector';
import { rssConnector } from '@/connectors/rss/rss.connector';

// ---------------------------------------------------------------------------
// Adapter: Wrap legacy ConnectorDef into the new Connector interface
// ---------------------------------------------------------------------------

class ConnectorDefAdapter implements Connector<unknown> {
  readonly metadata: ConnectorMetadata;
  private currentStatus: ConnectionStatus = 'disconnected';
  private config: unknown = null;

  constructor(public readonly def: ConnectorDef<unknown, unknown>) {
    this.metadata = {
      id: def.meta.type,
      name: def.meta.displayName,
      description: def.meta.description,
      iconUrl: def.meta.iconUrl,
      authType: def.meta.authType,
      staleTimeMs: def.staleTimeMs,
      type: def.meta.type,
      displayName: def.meta.displayName,
    };
  }

  get status(): ConnectionStatus {
    return this.currentStatus;
  }

  getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  async connect(config: unknown): Promise<ConnectionStatus> {
    this.currentStatus = 'connecting';
    try {
      const parsed = this.def.configSchema.parse(config);
      this.config = parsed;
      this.currentStatus = 'connected';
      return 'connected';
    } catch (err) {
      this.currentStatus = 'error';
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.config = null;
    this.currentStatus = 'disconnected';
  }

  async fetch(params?: Record<string, unknown>): Promise<NormalizedDataResult> {
    if (this.currentStatus !== 'connected' || !this.config) {
      throw new ConnectorError(
        `Connector "${this.metadata.name}" is not connected. Call connect() first.`,
        'NOT_CONNECTED',
        false,
      );
    }

    const raw = await this.def.fetch(this.config, params);
    const items = this.def.normalise(raw, this.config);

    return {
      items,
      schemaVersion: 1,
      fetchedAt: new Date().toISOString(),
      metadata: {
        source: this.metadata.id,
        itemCount: items.length,
      },
    };
  }

  async refresh(params?: Record<string, unknown>): Promise<NormalizedDataResult> {
    return this.fetch(params);
  }

  async health(): Promise<ConnectionHealth> {
    const isHealthy = this.currentStatus === 'connected';
    return {
      healthy: isHealthy,
      status: this.currentStatus,
      message: isHealthy
        ? 'Connection is active and healthy.'
        : `Connection is ${this.currentStatus}.`,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Default Registration
// ---------------------------------------------------------------------------

function initRegistry(): void {
  if (!connectorRegistry.has('mock')) {
    connectorRegistry.register(mockConnector);
  }
  if (!connectorRegistry.has('weather')) {
    connectorRegistry.register(weatherConnector as any);
  }
  if (!connectorRegistry.has('openweather')) {
    // REASON: Alias openweather to WeatherConnector for legacy widget definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openweatherAlias: any = {
      ...weatherConnector,
      metadata: {
        ...weatherConnector.metadata,
        id: 'openweather',
        type: 'openweather',
        name: 'OpenWeather',
        displayName: 'OpenWeather',
      },
      connect: (config: any) => weatherConnector.connect(config),
      disconnect: () => weatherConnector.disconnect(),
      fetch: (params: any) => weatherConnector.fetch(params),
      refresh: (params: any) => weatherConnector.refresh(params),
      health: () => weatherConnector.health(),
      getStatus: () => weatherConnector.getStatus(),
    };
    connectorRegistry.register(openweatherAlias);
  }
  if (!connectorRegistry.has('google_calendar')) {
    connectorRegistry.register(calendarConnector as any);
  }
  if (!connectorRegistry.has('calendar')) {
    // REASON: Alias calendar to google_calendar for widget definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calendarAlias: any = {
      ...calendarConnector,
      metadata: {
        ...calendarConnector.metadata,
        id: 'calendar',
        type: 'calendar',
        name: 'Google Calendar',
        displayName: 'Google Calendar',
      },
      connect: (config: any) => calendarConnector.connect(config),
      disconnect: () => calendarConnector.disconnect(),
      fetch: (params: any) => calendarConnector.fetch(params),
      refresh: (params: any) => calendarConnector.refresh(params),
      health: () => calendarConnector.health(),
      getStatus: () => calendarConnector.getStatus(),
    };
    connectorRegistry.register(calendarAlias);
  }
  if (!connectorRegistry.has('todoist')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectorRegistry.register(new ConnectorDefAdapter(tasksConnector as any));
  }
  if (!connectorRegistry.has('rss')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectorRegistry.register(new ConnectorDefAdapter(rssConnector as any));
  }
}

initRegistry();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a full NormalizedDataResult container for a given connector type.
 * Guarantees that the widget engine only consumes normalized data.
 */
export async function fetchNormalizedResult(
  connectorType: string,
  config: unknown,
  params?: Record<string, unknown>,
): Promise<NormalizedDataResult> {
  const connector = connectorRegistry.get(connectorType);
  if (!connector) {
    throw new ConnectorError(
      `Unknown connector type: "${connectorType}". Register it in connectorService.ts.`,
      'NOT_FOUND',
      false,
    );
  }

  // Connect / authenticate with validated config
  await connector.connect(config);
  return connector.fetch(params);
}

/**
 * Fetch and normalise data for a given connector type.
 * Backward-compatible function returning UniversalItem[] for existing hooks.
 */
export async function fetchNormalisedData(
  connectorType: string,
  config: unknown,
  params?: Record<string, unknown>,
): Promise<UniversalItem[]> {
  const result = await fetchNormalizedResult(connectorType, config, params);
  return result.items;
}

/** Returns the staleTime for a connector type. */
export function getConnectorStaleTime(connectorType: string): number | undefined {
  return connectorRegistry.get(connectorType)?.metadata.staleTimeMs;
}

/** Returns all registered connector metadata formatted as ConnectorMeta for UI consumers. */
export function getAllConnectorMetas(): ConnectorMeta[] {
  return connectorRegistry.discover().map((meta) => ({
    type: meta.type ?? meta.id,
    displayName: meta.displayName ?? meta.name,
    description: meta.description,
    authType: meta.authType,
    iconUrl: meta.iconUrl,
    id: meta.id,
    name: meta.name,
    version: meta.version,
    supportedDataTypes: meta.supportedDataTypes,
    staleTimeMs: meta.staleTimeMs,
  }));
}

/** Exposes the active ConnectorRegistry instance. */
export function getConnectorRegistry(): ConnectorRegistry {
  return connectorRegistry;
}
