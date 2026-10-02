/**
 * src/connectors/rss/__tests__/rss.connector.test.ts
 *
 * Unit and integration tests for RSS Connector.
 * Verifies:
 * - XML parsing & extraction of RSS items
 * - Normalization to ArticleItem & UniversalItem schemas (id, title, url, provider, publishedAt, summary)
 * - Provider-specific data isolation
 * - Support for latest articles helper
 * - Error handling for invalid configurations
 */

import { rssConnector, getLatestArticles } from '../rss.connector';
import { UniversalItemSchema, ArticleItemSchema } from '@/widgets/schema';
import { ConnectorError } from '@/connectors/base/connector.types';

const MOCK_RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech Chronicle</title>
    <link>https://techchronicle.example.com</link>
    <description>Daily tech and engineering news</description>
    <item>
      <title><![CDATA[Antigravity 2.0 Released: Next-Gen AI Coding Engine]]></title>
      <link>https://techchronicle.example.com/antigravity-2</link>
      <description><![CDATA[Deep agentic code synthesis with autonomous tool orchestration.]]></description>
      <pubDate>Fri, 02 Oct 2026 12:00:00 GMT</pubDate>
      <author>Dr. Jane Doe</author>
    </item>
    <item>
      <title>React Native 0.85 Brings Instant TurboModules</title>
      <link>https://techchronicle.example.com/rn-85</link>
      <description>Zero-bridge native calls and enhanced memory ergonomics.</description>
      <pubDate>Thu, 01 Oct 2026 09:30:00 GMT</pubDate>
      <author>Alex Tech</author>
    </item>
  </channel>
</rss>`;

describe('RSS Connector', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Validation & Configuration', () => {
    it('throws INVALID_CONFIG if feedUrl is invalid', async () => {
      await expect(
        rssConnector.fetch({ feedUrl: 'invalid_url_string' } as any),
      ).rejects.toThrow();
    });

    it('successfully returns sample feed entries when simulated', async () => {
      const entries = await rssConnector.fetch({ feedUrl: 'https://example.com/mock-feed.xml' });
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].title).toBeDefined();
    });

    it('parses live XML RSS feed from upstream server', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(MOCK_RSS_XML),
        }),
      ) as jest.Mock;

      const entries = await rssConnector.fetch({ feedUrl: 'https://techchronicle.example.com/rss' });
      expect(global.fetch).toHaveBeenCalledWith('https://techchronicle.example.com/rss', expect.any(Object));
      expect(entries).toHaveLength(2);
      expect(entries[0].title).toBe('Antigravity 2.0 Released: Next-Gen AI Coding Engine');
      expect(entries[0].link).toBe('https://techchronicle.example.com/antigravity-2');
      expect(entries[0].author).toBe('Dr. Jane Doe');
    });
  });

  describe('Normalization & Universal Data Model', () => {
    const sampleEntries = [
      {
        id: 'rss-1',
        title: 'Antigravity 2.0 Released',
        link: 'https://techchronicle.example.com/antigravity-2',
        summary: 'Deep agentic code synthesis.',
        author: 'Dr. Jane Doe',
        publishedAt: '2026-10-02T12:00:00.000Z',
      },
      {
        id: 'rss-2',
        title: 'React Native 0.85',
        link: 'https://techchronicle.example.com/rn-85',
        summary: 'Zero-bridge native calls.',
        author: 'Alex Tech',
        publishedAt: '2026-10-01T09:30:00.000Z',
      },
    ];

    it('normalizes RSS entries to UniversalItem and ArticleItem', () => {
      const items = rssConnector.normalise(sampleEntries, {
        feedUrl: 'https://techchronicle.example.com/rss',
      });

      expect(items).toHaveLength(2);

      items.forEach((item) => {
        expect(() => UniversalItemSchema.parse(item)).not.toThrow();
        const article = ArticleItemSchema.parse(item);
        expect(article.provider).toBe('rss');
        expect(article.type).toBe('article');
        expect(article.url).toBeDefined();
        expect(article.title).toBeDefined();
        expect(article.publishedAt).toBeDefined();
      });

      const first = items[0];
      if (first.type === 'article') {
        expect(first.title).toBe('Antigravity 2.0 Released');
        expect(first.url).toBe('https://techchronicle.example.com/antigravity-2');
        expect(first.summary).toBe('Deep agentic code synthesis.');
        expect(first.author).toBe('Dr. Jane Doe');
      }
    });

    it('isolates upstream properties and stores feedUrl inside metadata', () => {
      const items = rssConnector.normalise(sampleEntries, {
        feedUrl: 'https://techchronicle.example.com/rss',
      });

      expect(items[0].meta?.['feedUrl']).toBe('https://techchronicle.example.com/rss');
    });
  });

  describe('Latest Articles Query Helper', () => {
    it('sorts articles chronologically descending and applies limit', () => {
      const items = rssConnector.normalise(
        [
          {
            id: 'rss-older',
            title: 'Older Article',
            link: 'https://example.com/1',
            publishedAt: '2026-10-01T08:00:00.000Z',
          },
          {
            id: 'rss-newer',
            title: 'Newer Article',
            link: 'https://example.com/2',
            publishedAt: '2026-10-02T14:00:00.000Z',
          },
          {
            id: 'rss-middle',
            title: 'Middle Article',
            link: 'https://example.com/3',
            publishedAt: '2026-10-02T09:00:00.000Z',
          },
        ],
        { feedUrl: 'https://example.com/feed' },
      );

      const latestAll = getLatestArticles(items);
      expect(latestAll.map((a) => a.id)).toEqual(['rss-newer', 'rss-middle', 'rss-older']);

      const latestTop2 = getLatestArticles(items, 2);
      expect(latestTop2).toHaveLength(2);
      expect(latestTop2[0].id).toBe('rss-newer');
      expect(latestTop2[1].id).toBe('rss-middle');
    });
  });
});
