/**
 * src/widgets/built-in/rss-feed.ts
 */

import { WidgetDefinition } from '../schema';

export const rssFeedDef: WidgetDefinition = {
  type: 'rss-feed',
  displayName: 'RSS Feed',
  description: 'Latest articles from an RSS feed.',
  version: '1.0.0',
  connectorTypes: ['rss'],
  configFields: [
    {
      key: 'maxItems',
      label: 'Max items to show',
      type: 'number',
      defaultValue: 5,
      required: false,
    },
    {
      key: 'showImages',
      label: 'Show article images',
      type: 'boolean',
      defaultValue: true,
      required: false,
    },
  ],
  minW: 2,
  minH: 2,
  maxW: 6,
};
