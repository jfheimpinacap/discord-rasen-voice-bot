import { REST } from 'discord.js';

import { getEnvironment } from '../config/env.js';
import { createCommands } from '../discord/commands/index.js';
import { registerGuildCommands } from '../discord/register-commands.js';

async function registerCommands(): Promise<void> {
  const environment = getEnvironment();
  const registry = createCommands({
    configurationRepository: {
      findByGuildId: async () => null,
      upsert: async () => {
        throw new Error('Not used during registration');
      },
    },
    logger: console,
  });
  const rest = new REST({ version: '10' }).setToken(environment.DISCORD_TOKEN);
  await registerGuildCommands(
    rest,
    environment.DISCORD_CLIENT_ID,
    environment.DISCORD_GUILD_ID,
    registry.toJSON(),
  );
  console.info({ commandCount: registry.toJSON().length, guildId: environment.DISCORD_GUILD_ID }, 'Guild slash commands registered');
}

void registerCommands().catch((error: unknown) => { console.error({ err: error }, 'Unable to register guild slash commands'); process.exitCode = 1; });
