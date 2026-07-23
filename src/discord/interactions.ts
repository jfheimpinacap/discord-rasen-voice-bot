import type { ChatInputCommandInteraction, Client, Interaction } from 'discord.js';

import type { CommandLogger } from './commands/types.js';
import type { CommandRegistry } from './commands/registry.js';

async function sendSafeError(interaction: ChatInputCommandInteraction): Promise<void> {
  const content = 'No fue posible completar este comando. Inténtalo de nuevo más tarde.';
  if (interaction.deferred) {
    await interaction.editReply({ content });
  } else if (interaction.replied) {
    await interaction.followUp({ content, ephemeral: true });
  } else {
    await interaction.reply({ content, ephemeral: true });
  }
}

export function createInteractionDispatcher(registry: CommandRegistry, logger: CommandLogger) {
  return async (interaction: Interaction): Promise<void> => {
    if (!interaction.isChatInputCommand()) return;

    const command = registry.find(interaction.commandName);
    if (!command) {
      logger.warn(
        { commandName: interaction.commandName, guildId: interaction.guildId },
        'Unknown slash command',
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(
        {
          err: error,
          commandName: interaction.commandName,
          guildId: interaction.guildId,
          userId: interaction.user.id,
        },
        'Slash command failed',
      );
      try {
        await sendSafeError(interaction);
      } catch (responseError) {
        logger.error(
          {
            err: responseError,
            commandName: interaction.commandName,
            guildId: interaction.guildId,
          },
          'Unable to send slash command error response',
        );
      }
    }
  };
}

export function attachInteractionDispatcher(
  client: Client,
  registry: CommandRegistry,
  logger: CommandLogger,
): void {
  client.on('interactionCreate', createInteractionDispatcher(registry, logger));
}
