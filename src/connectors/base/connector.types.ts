/**
 * src/connectors/base/connector.types.ts
 *
 * Core interfaces, types, and error classes for the Connector Framework.
 * Every connector conforms to Connector or ConnectorDef.
 *
 * Requirements (Prompt 10):
 * - Connector
 * - ConnectorMetadata
 * - ConnectionStatus
 * - ConnectorError
 * - NormalizedDataResult
 */

import { z } from 'zod';
import { UniversalItem } from '@/widgets/schema';

// ---------------------------------------------------------------------------
// ConnectionStatus & Health
// ---------------------------------------------------------------------------

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'expired';

export interface ConnectionHealth {
  healthy: boolean;
  status: ConnectionStatus;
  message?: string;
  lastCheckedAt: string;
}

// ---------------------------------------------------------------------------
// ConnectorMetadata & Legacy ConnectorMeta
// ---------------------------------------------------------------------------

export interface ConnectorMetadata {
  /** Unique slug identifying this connector type, e.g. 'mock', 'openweather' */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Short description of what this connector provides */
  description: string;
  /** Version string for this connector implementation */
  version?: string;
  /** Optional icon asset or URL */
  iconUrl?: string;
  /** How the connector authenticates with its data source */
  authType: 'none' | 'apiKey' | 'oauth2';
  /** Supported UniversalItem types (e.g. ['weather', 'tasks']) */
  supportedDataTypes?: string[];
  /** Default stale time in milliseconds for TanStack Query */
  staleTimeMs?: number;

  // Compatibility aliases
  type?: string;
  displayName?: string;
}

/** Legacy ConnectorMeta shape preserved for existing connectors */
export interface ConnectorMeta {
  type: string;
  displayName: string;
  description: string;
  iconUrl?: string;
  authType: 'none' | 'apiKey' | 'oauth2';
  id?: string;
  name?: string;
  version?: string;
  supportedDataTypes?: string[];
  staleTimeMs?: number;
}

// ---------------------------------------------------------------------------
// NormalizedDataResult — The canonical data shape consumed by the widget engine
// ---------------------------------------------------------------------------

export interface NormalizedDataResult<T = UniversalItem> {
  /** Array of normalized items consumed by widgets */
  items: T[];
  /** Integer schema version for future evolution of data shapes */
  schemaVersion: number;
  /** ISO timestamp when data was fetched/normalized */
  fetchedAt: string;
  /** Metadata describing the fetch result */
  metadata?: {
    source: string;
    itemCount: number;
    cached?: boolean;
    [key: string]: unknown;
  };
}

export const NormalizedDataResultSchema = z.object({
  items: z.array(z.unknown()),
  schemaVersion: z.number().int().default(1),
  fetchedAt: z.string(),
  metadata: z
    .object({
      source: z.string(),
      itemCount: z.number().int(),
      cached: z.boolean().optional(),
    })
    .catchall(z.unknown())
    .optional(),
});

// ---------------------------------------------------------------------------
// ConnectorError — Typed error thrown by connector operations
// ---------------------------------------------------------------------------

export class ConnectorError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    codeOrOptions?:
      | string
      | { code?: string; retryable?: boolean; details?: unknown },
    retryable: boolean = true,
  ) {
    super(message);
    this.name = 'ConnectorError';

    if (typeof codeOrOptions === 'string') {
      this.code = codeOrOptions;
      this.retryable = retryable;
    } else if (codeOrOptions && typeof codeOrOptions === 'object') {
      this.code = codeOrOptions.code ?? 'CONNECTOR_ERROR';
      this.retryable = codeOrOptions.retryable ?? true;
      this.details = codeOrOptions.details;
    } else {
      this.code = 'CONNECTOR_ERROR';
      this.retryable = retryable;
    }
  }
}

// ---------------------------------------------------------------------------
// Connector Interface — Prompt 10 Contract
// ---------------------------------------------------------------------------

export interface Connector<TConfig = unknown> {
  /** Static metadata describing this connector */
  readonly metadata: ConnectorMetadata;

  /** Current connection/authentication status */
  readonly status: ConnectionStatus;

  /**
   * Connect and authenticate using the supplied configuration.
   * Validates config with Zod before establishing connection.
   */
  connect(config: TConfig): Promise<ConnectionStatus>;

  /**
   * Disconnect and clear any active credentials/state.
   */
  disconnect(): Promise<void>;

  /**
   * Fetch normalized data for widgets.
   * Throws ConnectorError if not connected.
   */
  fetch(params?: Record<string, unknown>): Promise<NormalizedDataResult>;

  /**
   * Force refresh data bypassing local caches.
   */
  refresh(params?: Record<string, unknown>): Promise<NormalizedDataResult>;

  /**
   * Check connection health and authentication status.
   */
  health(): Promise<ConnectionHealth>;

  /**
   * Get current connection status.
   */
  getStatus(): ConnectionStatus;
}

// ---------------------------------------------------------------------------
// Legacy ConnectorDef Interface — preserved for existing connectors
// ---------------------------------------------------------------------------

export interface ConnectorDef<TConfig = unknown, TRaw = unknown> {
  meta: ConnectorMeta;
  configSchema: z.ZodType<TConfig>;
  fetch(config: TConfig, params?: Record<string, unknown>): Promise<TRaw>;
  normalise(raw: TRaw, config: TConfig): UniversalItem[];
  staleTimeMs?: number;
}
