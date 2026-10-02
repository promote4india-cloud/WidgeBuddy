/**
 * src/widgets/built-in/weather-card.ts
 *
 * Weather card widget — shows current conditions from a weather connector.
 */

import { WidgetDefinition } from '../schema';

export const weatherCardDef: WidgetDefinition = {
  type: 'weather-card',
  displayName: 'Weather Card',
  description: 'Current conditions and today\'s forecast.',
  version: '1.0.0',
  connectorTypes: ['openweather'],
  configFields: [
    {
      key: 'unit',
      label: 'Temperature unit',
      type: 'select',
      defaultValue: 'celsius',
      options: [
        { label: 'Celsius', value: 'celsius' },
        { label: 'Fahrenheit', value: 'fahrenheit' },
      ],
      required: true,
    },
    {
      key: 'showForecast',
      label: 'Show 3-day forecast',
      type: 'boolean',
      defaultValue: true,
      required: false,
    },
  ],
  minW: 2,
  minH: 2,
};
