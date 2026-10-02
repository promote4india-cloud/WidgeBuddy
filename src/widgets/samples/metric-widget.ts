/**
 * src/widgets/samples/metric-widget.ts
 *
 * Sample 5: KPI & Performance Metrics Widget
 * Demonstrates:
 * - metric metadata & config fields
 * - small / medium / large layouts
 * - metric element, container, text, icon, divider, action
 */

import { DeclarativeWidgetDefinition } from '../declarative/definition';

export const kpiMetricsWidget: DeclarativeWidgetDefinition = {
  id: 'kpi-metrics-widget',
  displayName: 'Business & Health KPIs',
  description: 'Monitor key metrics, trends, and growth indicators.',
  version: '1.0.0',
  author: 'WidgeBuddy Team',
  category: 'finance',
  tags: ['kpi', 'metrics', 'analytics', 'finance', 'stats'],
  icon: 'trending-up',
  connectorTypes: [],
  supportedSizes: ['small', 'medium', 'large'],
  defaultSize: 'medium',
  configFields: [
    {
      key: 'currency',
      label: 'Currency Symbol',
      type: 'text',
      defaultValue: '$',
      required: true,
    },
    {
      key: 'showPercentage',
      label: 'Show Percentage Change',
      type: 'boolean',
      defaultValue: true,
      required: false,
    },
  ],
  layouts: {
    // -----------------------------------------------------------------------
    // Small (2x2): Single Hero KPI with trend badge
    // -----------------------------------------------------------------------
    small: {
      backgroundColor: '#064e3b',
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
                content: 'MONTHLY REVENUE',
                variant: 'caption',
                weight: 'bold',
                color: '#6ee7b7',
              },
              {
                type: 'icon',
                name: 'dollar-sign',
                size: 'small',
                color: '#34d399',
              },
            ],
          },
          {
            type: 'metric',
            label: 'MRR',
            value: '$48,250',
            trend: 'up',
            change: '+14.2%',
            trendColor: '#10b981',
            size: 'large',
          },
          {
            type: 'text',
            content: 'vs $42,200 last month',
            variant: 'caption',
            color: '#a7f3d0',
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Medium (4x2): Dual KPI row comparison
    // -----------------------------------------------------------------------
    medium: {
      backgroundColor: '#022c22',
      padding: 14,
      root: {
        type: 'container',
        direction: 'row',
        gap: 12,
        alignment: { vertical: 'center' },
        children: [
          // Left KPI
          {
            type: 'container',
            direction: 'column',
            flex: 1,
            gap: 4,
            children: [
              {
                type: 'metric',
                label: 'Active Users',
                value: '12,480',
                unit: 'users',
                trend: 'up',
                change: '+5.8%',
                trendColor: '#34d399',
                icon: 'users',
                size: 'medium',
              },
              {
                type: 'text',
                content: 'Top active region: US/EU',
                variant: 'caption',
                color: '#6ee7b7',
              },
            ],
          },
          // Vertical divider
          {
            type: 'divider',
            orientation: 'vertical',
            color: '#064e3b',
            thickness: 1,
          },
          // Right KPI
          {
            type: 'container',
            direction: 'column',
            flex: 1,
            gap: 4,
            children: [
              {
                type: 'metric',
                label: 'Avg Response Time',
                value: 185,
                unit: 'ms',
                trend: 'down',
                change: '-24ms',
                trendColor: '#34d399',
                icon: 'zap',
                size: 'medium',
              },
              {
                type: 'text',
                content: '99.98% uptime SLA',
                variant: 'caption',
                color: '#6ee7b7',
              },
            ],
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Large (6x4): 4-Quadrant KPI Executive Dashboard
    // -----------------------------------------------------------------------
    large: {
      backgroundColor: '#022c22',
      padding: 16,
      root: {
        type: 'container',
        direction: 'column',
        gap: 12,
        children: [
          // Header
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
                    content: 'Executive KPI Dashboard',
                    variant: 'heading',
                    weight: 'bold',
                    color: '#ffffff',
                  },
                  {
                    type: 'text',
                    content: 'Q3 Financial & Operational Health',
                    variant: 'caption',
                    color: '#6ee7b7',
                  },
                ],
              },
              {
                type: 'action',
                label: 'Analytics',
                variant: 'button',
                style: 'secondary',
                action: {
                  type: 'open_url',
                  url: 'https://analytics.example.com',
                },
              },
            ],
          },
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#064e3b',
            thickness: 1,
          },
          // Top Row: 2 KPIs
          {
            type: 'container',
            direction: 'row',
            gap: 12,
            children: [
              {
                type: 'container',
                direction: 'column',
                flex: 1,
                padding: 8,
                backgroundColor: '#064e3b',
                borderRadius: 8,
                children: [
                  {
                    type: 'metric',
                    label: 'Net Revenue',
                    value: '$142,500',
                    trend: 'up',
                    change: '+18.4%',
                    icon: 'trending-up',
                  },
                ],
              },
              {
                type: 'container',
                direction: 'column',
                flex: 1,
                padding: 8,
                backgroundColor: '#064e3b',
                borderRadius: 8,
                children: [
                  {
                    type: 'metric',
                    label: 'Customer Churn',
                    value: '1.2%',
                    trend: 'down',
                    change: '-0.4%',
                    icon: 'user-minus',
                  },
                ],
              },
            ],
          },
          // Bottom Row: 2 KPIs
          {
            type: 'container',
            direction: 'row',
            gap: 12,
            children: [
              {
                type: 'container',
                direction: 'column',
                flex: 1,
                padding: 8,
                backgroundColor: '#064e3b',
                borderRadius: 8,
                children: [
                  {
                    type: 'metric',
                    label: 'Customer NPS',
                    value: 72,
                    trend: 'up',
                    change: '+4 pts',
                    icon: 'heart',
                  },
                ],
              },
              {
                type: 'container',
                direction: 'column',
                flex: 1,
                padding: 8,
                backgroundColor: '#064e3b',
                borderRadius: 8,
                children: [
                  {
                    type: 'metric',
                    label: 'Server Costs',
                    value: '$3,820',
                    trend: 'flat',
                    change: '0.0%',
                    icon: 'server',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
};
