/**
 * src/widgets/built-in/clock.ts
 *
 * Clock widget — no connector needed, uses device time.
 */

import { WidgetDefinition } from '../schema';

export const clockDef: WidgetDefinition = {
  type: 'clock',
  displayName: 'Clock',
  description: 'Displays the current time and date.',
  version: '1.0.0',
  connectorTypes: [],
  configFields: [
    {
      key: 'format',
      label: 'Time format',
      type: 'select',
      defaultValue: '12h',
      options: [
        { label: '12-hour', value: '12h' },
        { label: '24-hour', value: '24h' },
      ],
      required: false,
    },
    {
      key: 'showSeconds',
      label: 'Show seconds',
      type: 'boolean',
      defaultValue: false,
      required: false,
    },
    {
      key: 'showDate',
      label: 'Show date',
      type: 'boolean',
      defaultValue: true,
      required: false,
    },
  ],
  minW: 2,
  minH: 1,
};
