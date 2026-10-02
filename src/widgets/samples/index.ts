/**
 * src/widgets/samples/index.ts
 *
 * Exports 5 production-grade sample declarative widget definitions:
 * 1. weatherForecastWidget
 * 2. calendarAgendaWidget
 * 3. taskManagerWidget
 * 4. newsHeadlinesWidget
 * 5. kpiMetricsWidget
 */

import { weatherForecastWidget } from './weather-widget';
import { calendarAgendaWidget } from './calendar-widget';
import { taskManagerWidget } from './task-widget';
import { newsHeadlinesWidget } from './news-widget';
import { kpiMetricsWidget } from './metric-widget';

export {
  weatherForecastWidget,
  calendarAgendaWidget,
  taskManagerWidget,
  newsHeadlinesWidget,
  kpiMetricsWidget,
};

export const sampleWidgetDefinitions = [
  weatherForecastWidget,
  calendarAgendaWidget,
  taskManagerWidget,
  newsHeadlinesWidget,
  kpiMetricsWidget,
];
