import pino, { type Logger } from 'pino';

import type { Environment } from '../config/env.js';

export function createLogger(environment: Pick<Environment, 'LOG_LEVEL' | 'NODE_ENV'>): Logger {
  const transport =
    environment.NODE_ENV === 'production'
      ? undefined
      : pino.transport({
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        });

  return pino({ level: environment.LOG_LEVEL }, transport);
}
