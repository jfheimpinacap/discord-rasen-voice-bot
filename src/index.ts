import type { Client } from 'discord.js';

import { getEnvironment } from './config/env.js';
import { createDiscordClient } from './discord/client.js';
import { createLogger } from './logging/logger.js';

async function start(): Promise<void> {
  const environment = getEnvironment();
  const logger = createLogger(environment);
  const client = createDiscordClient();
  let shuttingDown = false;

  const shutdown = async (reason: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ reason }, 'Shutting down Discord client');
    client.destroy();
    process.exitCode = exitCode;
  };

  const handleFatalError = (error: unknown, source: string): void => {
    logger.fatal({ err: error, source }, 'Fatal process error');
    void shutdown(source, 1);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('unhandledRejection', (reason) => handleFatalError(reason, 'unhandledRejection'));
  process.once('uncaughtException', (error) => handleFatalError(error, 'uncaughtException'));

  client.once('ready', (readyClient: Client<true>) => {
    logger.info({ user: readyClient.user.tag }, 'Discord client connected');
  });

  try {
    logger.info('Starting Discord client');
    await client.login(environment.DISCORD_TOKEN);
  } catch (error) {
    logger.error({ err: error }, 'Unable to start Discord client');
    await shutdown('startup failure', 1);
  }
}

void start();
