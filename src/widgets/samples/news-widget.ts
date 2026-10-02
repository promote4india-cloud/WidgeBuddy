/**
 * src/widgets/samples/news-widget.ts
 *
 * Sample 4: News & Tech Feed Widget
 * Demonstrates:
 * - news/article metadata & config fields
 * - small / medium / large layouts
 * - articleList element, container, text, icon, divider, action
 */

import { DeclarativeWidgetDefinition } from '../declarative/definition';

export const newsHeadlinesWidget: DeclarativeWidgetDefinition = {
  id: 'news-headlines-widget',
  displayName: 'News & Tech Feed',
  description: 'Top headlines and curated tech articles from your RSS feeds.',
  version: '1.0.0',
  author: 'WidgeBuddy Team',
  category: 'news',
  tags: ['news', 'rss', 'tech', 'feed', 'articles'],
  icon: 'newspaper',
  connectorTypes: ['rss'],
  supportedSizes: ['small', 'medium', 'large'],
  defaultSize: 'medium',
  configFields: [
    {
      key: 'category',
      label: 'Feed Category',
      type: 'select',
      defaultValue: 'technology',
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Business', value: 'business' },
        { label: 'World News', value: 'world' },
      ],
      required: true,
    },
    {
      key: 'showThumbnails',
      label: 'Show Article Images',
      type: 'boolean',
      defaultValue: true,
      required: false,
    },
  ],
  layouts: {
    // -----------------------------------------------------------------------
    // Small (2x2): Top breaking headline
    // -----------------------------------------------------------------------
    small: {
      backgroundColor: '#7c2d12',
      padding: 12,
      root: {
        type: 'container',
        direction: 'column',
        alignment: { vertical: 'space-between' },
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: 'TOP STORY',
                variant: 'caption',
                weight: 'bold',
                color: '#fed7aa',
              },
              {
                type: 'icon',
                name: 'newspaper',
                size: 'small',
                color: '#fdba74',
              },
            ],
          },
          {
            type: 'text',
            content: 'Next-gen AI models transform personal productivity apps',
            variant: 'title',
            size: 'sm',
            weight: 'semibold',
            color: '#ffffff',
            maxLines: 3,
          },
          {
            type: 'text',
            content: 'TechCrunch • 10m ago',
            variant: 'caption',
            color: '#fdba74',
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Medium (4x2): Headlines list
    // -----------------------------------------------------------------------
    medium: {
      backgroundColor: '#431407',
      padding: 14,
      root: {
        type: 'container',
        direction: 'column',
        gap: 8,
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: 'Technology Feed',
                variant: 'title',
                weight: 'bold',
                color: '#ffedd5',
              },
              {
                type: 'action',
                label: 'Refresh',
                variant: 'button',
                style: 'ghost',
                action: {
                  type: 'run_connector',
                  actionName: 'refresh_rss',
                },
              },
            ],
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#7c2d12',
            thickness: 1,
          },
          {
            type: 'articleList',
            maxItems: 2,
            showImage: true,
            showSummary: false,
            showTimestamp: true,
            layout: 'compact',
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Large (6x4): Comprehensive magazine layout
    // -----------------------------------------------------------------------
    large: {
      backgroundColor: '#271008',
      padding: 16,
      root: {
        type: 'container',
        direction: 'column',
        gap: 12,
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'container',
                direction: 'column',
                children: [
                  {
                    type: 'text',
                    content: 'Daily Tech Briefing',
                    variant: 'heading',
                    weight: 'bold',
                    color: '#ffedd5',
                  },
                  {
                    type: 'text',
                    content: 'Curated from top engineering publications',
                    variant: 'caption',
                    color: '#fdba74',
                  },
                ],
              },
              {
                type: 'action',
                label: 'All Feeds',
                variant: 'button',
                style: 'primary',
                action: {
                  type: 'navigate',
                  route: '/feeds',
                },
              },
            ],
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#7c2d12',
            thickness: 1,
          },
          {
            type: 'articleList',
            maxItems: 4,
            showImage: true,
            showSummary: true,
            showAuthor: true,
            showTimestamp: true,
            layout: 'card',
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#7c2d12',
            thickness: 1,
          },
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: 'Updated hourly',
                variant: 'caption',
                color: '#9a3412',
              },
              {
                type: 'action',
                label: 'Open Reader',
                variant: 'link',
                action: {
                  type: 'open_url',
                  url: 'https://news.ycombinator.com',
                },
              },
            ],
          },
        ],
      },
    },
  },
};
