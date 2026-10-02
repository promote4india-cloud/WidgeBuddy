/**
 * src/connectors/base/ConnectorRegistry.ts
 *
 * Connector registry for discovery, lifecycle lookup, and registration.
 * Allows runtime discovery of available connectors for widgets.
 */

import { Connector, ConnectorMetadata, ConnectorError } from './connector.types';

export class ConnectorRegistry {
  private connectors: Map<string, Connector> = new Map();

  /**
   * Register a new connector instance.
   * Throws ConnectorError if a connector with the same ID is already registered.
   */
  register(connector: Connector): void {
    const id = connector.metadata.id;
    if (!id) {
      throw new ConnectorError(
        'Cannot register connector without a valid metadata.id',
        'INVALID_METADATA',
        false,
      );
    }

    if (this.connectors.has(id)) {
      throw new ConnectorError(
        `Connector with id "${id}" is already registered in ConnectorRegistry.`,
        'DUPLICATE_CONNECTOR',
        false,
      );
    }

    this.connectors.set(id, connector);
  }

  /**
   * Unregister a connector by ID.
   * Returns true if a connector was removed.
   */
  unregister(id: string): boolean {
    return this.connectors.delete(id);
  }

  /**
   * Look up a connector by ID.
   */
  get(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  /**
   * Look up a connector by ID or throw a typed ConnectorError.
   */
  getOrThrow(id: string): Connector {
    const connector = this.connectors.get(id);
    if (!connector) {
      throw new ConnectorError(
        `Unknown connector "${id}". Register it before use.`,
        'NOT_FOUND',
        false,
      );
    }
    return connector;
  }

  /**
   * Check if a connector ID is registered.
   */
  has(id: string): boolean {
    return this.connectors.has(id);
  }

  /**
   * Return all registered connector instances.
   */
  list(): Connector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Discover metadata for all registered connectors.
   * Used by UI picker and widget catalog.
   */
  discover(): ConnectorMetadata[] {
    return this.list().map((connector) => connector.metadata);
  }

  /**
   * Alias for discover() to match legacy convention.
   */
  getAllMetadata(): ConnectorMetadata[] {
    return this.discover();
  }

  /**
   * Clear all registered connectors (useful in test teardown).
   */
  clear(): void {
    this.connectors.clear();
  }
}

/** Global default connector registry singleton */
export const connectorRegistry = new ConnectorRegistry();
