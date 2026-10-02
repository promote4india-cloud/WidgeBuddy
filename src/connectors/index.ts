/**
 * src/connectors/index.ts
 *
 * Public API for the connector framework layer.
 */

export * from './base/connector.types';
export * from './base/BaseConnector';
export * from './base/ConnectorRegistry';

export { MockConnector, mockConnector } from './mock/mock.connector';
export { weatherConnector } from './weather/weather.connector';
export { calendarConnector } from './calendar/calendar.connector';
export { tasksConnector } from './tasks/tasks.connector';
export { rssConnector } from './rss/rss.connector';
