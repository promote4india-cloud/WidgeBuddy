/**
 * src/connectors/rss/rss.connector.ts
 *
 * RSS feed connector — STUB.
 * fetch() throws ConnectorError until real integration is implemented.
 */

import { z } from 'zod';
import { ConnectorDef, ConnectorError } from '../base/connector.types';
import { UniversalItem } from '@/widgets/schema';

const RssConfigSchema = z.object({
  /** Full URL of the RSS/Atom feed */
  feedUrl: z.string().url(),
});

type RssConfig = z.infer<typeof RssConfigSchema>;

/** Minimal normalised RSS entry shape (parsed from XML by the connector) */
interface RssEntry {
  id: string;
  title: string;
  link: string;
  summary?: string;
  author?: string;
  publishedAt: string;
  imageUrl?: string;
}

export const rssConnector: ConnectorDef<RssConfig, RssEntry[]> = {
  meta: {
    type: 'rss',
    displayName: 'RSS Feed',
    description: 'Articles from any public RSS or Atom feed.',
    authType: 'none',
  },

  configSchema: RssConfigSchema,

  async fetch(_config, _params): Promise<RssEntry[]> {
    // TODO: fetch and parse RSS XML (use a Supabase Edge Function to avoid CORS)
    throw new ConnectorError(
      'RSS connector not yet implemented.',
      'NOT_IMPLEMENTED',
      false,
    );
  },

  normalise(raw, config): UniversalItem[] {
    return raw.map((entry) => ({
      id: entry.id,
      provider: 'rss',
      type: 'article',
      title: entry.title,
      url: entry.link,
      summary: entry.summary,
      author: entry.author,
      publishedAt: entry.publishedAt,
      imageUrl: entry.imageUrl,
      updatedAt: entry.publishedAt,
      meta: {
        feedUrl: config.feedUrl,
      },
    }));
  },

  staleTimeMs: 15 * 60 * 1000, // 15 minutes
};
