/**
 * src/normaliser/index.ts
 *
 * Layer 2 — dispatches to the correct connector-specific normalise() function.
 *
 * NOTE: In practice the renderer calls connectorService.fetchNormalisedData(),
 * which calls fetch() + normalise() together. This module is here for cases
 * where you already have raw data and only need to normalise it (e.g. tests).
 */

import { UniversalItem } from '@/widgets/schema';
import { ConnectorDef } from '@/connectors/base/connector.types';

/**
 * Normalise raw connector data into UniversalItem[].
 *
 * @param def    - The ConnectorDef whose normalise() function to use
 * @param raw    - Raw data returned by def.fetch()
 * @param config - Validated connector config
 */
export function normalise<TConfig, TRaw>(
  def: ConnectorDef<TConfig, TRaw>,
  raw: TRaw,
  config: TConfig,
): UniversalItem[] {
  return def.normalise(raw, config);
}
