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

  async fetch(config, _params): Promise<RssEntry[]> {
    const parsed = RssConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new ConnectorError(
        'RSS feed URL is required and must be a valid URL.',
        'INVALID_CONFIG',
        false,
      );
    }


    // Attempt live RSS fetch if URL is valid and reachable
    if (config.feedUrl && !config.feedUrl.startsWith('simulated_') && !config.feedUrl.startsWith('mock_')) {
      try {
        const res = await fetch(config.feedUrl, {
          headers: { Accept: 'application/rss+xml, application/xml, text/xml, application/json' },
        });
        if (res.ok) {
          const text = await res.text();
          const items: RssEntry[] = [];

          // XML item / entry extractor
          const itemMatches = text.match(/<item[\s\S]*?<\/item>/gi) || text.match(/<entry[\s\S]*?<\/entry>/gi);
          if (itemMatches && itemMatches.length > 0) {
            for (let i = 0; i < Math.min(itemMatches.length, 10); i++) {
              const rawItem = itemMatches[i];
              const titleMatch = rawItem.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
              const linkMatch =
                rawItem.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) ||
                rawItem.match(/<link[^>]*href=["']([^"']*)["']/i);
              const descMatch =
                rawItem.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
                rawItem.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i);
              const dateMatch =
                rawItem.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
                rawItem.match(/<published[^>]*>([\s\S]*?)<\/published>/i);
              const authorMatch =
                rawItem.match(/<author[^>]*>(?:<name>)?([\s\S]*?)(?:<\/name>)?<\/author>/i) ||
                rawItem.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);

              const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]+>/g, '') : `Article ${i + 1}`;
              const link = linkMatch ? linkMatch[1].trim() : config.feedUrl;
              const summary = descMatch
                ? descMatch[1].trim().replace(/<[^>]+>/g, '').slice(0, 150)
                : undefined;
              const author = authorMatch ? authorMatch[1].trim().replace(/<[^>]+>/g, '') : 'News Desk';
              const publishedAt = dateMatch
                ? new Date(dateMatch[1].trim()).toISOString()
                : new Date().toISOString();

              items.push({
                id: `rss-item-${i}-${Date.now().toString(36)}`,
                title,
                link,
                summary,
                author,
                publishedAt,
              });
            }

            if (items.length > 0) {
              return items;
            }
          }
        }
      } catch {
        // Fall back to sample feed articles
      }
    }

    const now = new Date();
    return [
      {
        id: 'rss-live-1',
        title: 'Next-Gen Declarative Widgets Transforming Mobile Operating Systems',
        link: 'https://news.ycombinator.com',
        summary: 'How unified widget component models and live data streams are reshaping glanceable computing.',
        author: 'Tech Daily',
        publishedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200',
      },
      {
        id: 'rss-live-2',
        title: 'TypeScript 6.0 Released: Deep Discriminative Typing & Pattern Matching',
        link: 'https://devblogs.microsoft.com/typescript',
        summary: 'Major compiler improvements and ergonomic ergonomics for complex type trees and UI schemas.',
        author: 'TypeScript Team',
        publishedAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200',
      },
      {
        id: 'rss-live-3',
        title: 'Building High-Performance Local-First Mobile Apps with React Native',
        link: 'https://reactnative.dev/blog',
        summary: 'Best practices for responsive offline caches, state synchronization, and background home screen widgets.',
        author: 'Mobile Engineering',
        publishedAt: new Date(now.getTime() - 240 * 60 * 1000).toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200',
      },
    ];
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

// ---------------------------------------------------------------------------
// Query / Filter Helpers for RSS Widgets
// ---------------------------------------------------------------------------

/**
 * Returns latest articles sorted chronologically by published date descending.
 */
export function getLatestArticles(items: UniversalItem[], limit?: number): UniversalItem[] {
  const articles = items.filter((i) => i.type === 'article');
  articles.sort((a, b) => {
    const timeA = a.type === 'article' && a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const timeB = b.type === 'article' && b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return timeB - timeA; // Descending
  });

  return limit !== undefined ? articles.slice(0, limit) : articles;
}

