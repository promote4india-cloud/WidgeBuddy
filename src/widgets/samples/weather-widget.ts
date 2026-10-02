/**
 * src/widgets/samples/weather-widget.ts
 *
 * Sample 1: Weather & Forecast Widget
 * Demonstrates:
 * - weather metadata & config fields
 * - small / medium / large layouts
 * - weather element, container, text, icon, divider, action
 */

import { DeclarativeWidgetDefinition } from '../declarative/definition';

export const weatherForecastWidget: DeclarativeWidgetDefinition = {
  id: 'weather-forecast-widget',
  displayName: 'Weather & Forecast',
  description: 'Current weather conditions and multi-day forecast.',
  version: '1.0.0',
  author: 'WidgeBuddy Team',
  category: 'weather',
  tags: ['weather', 'forecast', 'temperature', 'climate'],
  icon: 'cloud-sun',
  connectorTypes: ['openweather'],
  supportedSizes: ['small', 'medium', 'large'],
  defaultSize: 'medium',
  configFields: [
    {
      key: 'unit',
      label: 'Temperature Unit',
      type: 'select',
      defaultValue: 'celsius',
      options: [
        { label: 'Celsius (°C)', value: 'celsius' },
        { label: 'Fahrenheit (°F)', value: 'fahrenheit' },
      ],
      required: true,
    },
    {
      key: 'showFeelsLike',
      label: 'Show Feels Like Temperature',
      type: 'boolean',
      defaultValue: true,
      required: false,
    },
  ],
  layouts: {
    // -----------------------------------------------------------------------
    // Small (2x2): Compact glanceable weather card
    // -----------------------------------------------------------------------
    small: {
      backgroundColor: '#0284c7',
      padding: 12,
      root: {
        type: 'container',
        direction: 'column',
        alignment: { vertical: 'space-between', horizontal: 'left' },
        children: [
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between', vertical: 'center' },
            children: [
              {
                type: 'text',
                content: 'San Francisco',
                variant: 'caption',
                color: '#bae6fd',
                weight: 'medium',
              },
              {
                type: 'icon',
                name: 'sun',
                size: 'small',
                color: '#fef08a',
              },
            ],
          },
          {
            type: 'text',
            content: '21°',
            variant: 'heading',
            size: '2xl',
            color: '#ffffff',
            weight: 'bold',
          },
          {
            type: 'text',
            content: 'Mostly Sunny',
            variant: 'caption',
            color: '#e0f2fe',
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Medium (4x2): Current weather + 3-day forecast split
    // -----------------------------------------------------------------------
    medium: {
      backgroundColor: '#0369a1',
      padding: 14,
      root: {
        type: 'container',
        direction: 'row',
        gap: 12,
        alignment: { vertical: 'center' },
        children: [
          // Left column: Current conditions
          {
            type: 'container',
            direction: 'column',
            flex: 1,
            gap: 4,
            children: [
              {
                type: 'text',
                content: 'San Francisco',
                variant: 'caption',
                color: '#bae6fd',
                weight: 'semibold',
              },
              {
                type: 'container',
                direction: 'row',
                gap: 8,
                alignment: { vertical: 'center' },
                children: [
                  {
                    type: 'icon',
                    name: 'sun',
                    size: 'medium',
                    color: '#fde047',
                  },
                  {
                    type: 'text',
                    content: '21°C',
                    variant: 'heading',
                    size: 'xl',
                    color: '#ffffff',
                    weight: 'bold',
                  },
                ],
              },
              {
                type: 'text',
                content: 'Feels like 20° • Wind 12 km/h',
                variant: 'caption',
                color: '#e0f2fe',
              },
            ],
          },
          // Vertical divider
          {
            type: 'divider',
            orientation: 'vertical',
            color: '#0284c7',
            thickness: 1,
          },
          // Right column: Multi-day forecast block
          {
            type: 'container',
            direction: 'column',
            flex: 1,
            children: [
              {
                type: 'weather',
                displayMode: 'forecast',
                forecastDays: 3,
                showConditionIcon: true,
                tempUnit: 'celsius',
              },
            ],
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Large (6x4): Comprehensive weather dashboard
    // -----------------------------------------------------------------------
    large: {
      backgroundColor: '#075985',
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
                    content: 'San Francisco, CA',
                    variant: 'title',
                    color: '#ffffff',
                    weight: 'bold',
                  },
                  {
                    type: 'text',
                    content: 'Updated 5m ago',
                    variant: 'caption',
                    color: '#bae6fd',
                  },
                ],
              },
              {
                type: 'action',
                label: 'View Radar',
                variant: 'button',
                style: 'secondary',
                action: {
                  type: 'open_url',
                  url: 'https://weather.com/radar',
                },
              },
            ],
          },
          // Divider
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#0369a1',
            thickness: 1,
          },
          // Metrics Row
          {
            type: 'container',
            direction: 'row',
            alignment: { horizontal: 'space-between' },
            gap: 8,
            children: [
              {
                type: 'metric',
                label: 'Humidity',
                value: '64%',
                icon: 'droplet',
                size: 'small',
              },
              {
                type: 'metric',
                label: 'Wind Speed',
                value: '14 km/h',
                icon: 'wind',
                size: 'small',
              },
              {
                type: 'metric',
                label: 'UV Index',
                value: '5 Moderate',
                icon: 'sun',
                size: 'small',
              },
            ],
          },
          // Divider
          {
            type: 'divider',
            orientation: 'horizontal',
            color: '#0369a1',
            thickness: 1,
          },
          // 5-day Forecast Block
          {
            type: 'weather',
            displayMode: 'forecast',
            forecastDays: 5,
            showConditionIcon: true,
            showHumidity: true,
            showWind: true,
            tempUnit: 'celsius',
          },
        ],
      },
    },
  },
};
