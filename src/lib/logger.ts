/**
 * src/lib/logger.ts
 *
 * Lightweight logger utility.
 * Use this instead of console.log in production code paths.
 *
 * In development: logs to console with level prefixes.
 * In production: no-ops for debug/info; errors still log to console.error.
 *                Swap the implementation here to send to Sentry, Datadog, etc.
 */

const isDev = process.env['NODE_ENV'] !== 'production';

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.info('[INFO]', ...args);
    }
  },

  warn: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', ...args);
  },

  error: (message: string, error?: unknown): void => {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', message, error);
  },
};
