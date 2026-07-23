import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

import type { SlashCommand } from './types.js';

export interface CommandRegistry {
  find(name: string): SlashCommand | undefined;
  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody[];
}

export function createCommandRegistry(commands: readonly SlashCommand[]): CommandRegistry {
  const commandsByName = new Map<string, SlashCommand>();

  for (const command of commands) {
    if (commandsByName.has(command.data.name)) {
      throw new Error(`Duplicate slash command name: ${command.data.name}`);
    }
    commandsByName.set(command.data.name, command);
  }

  return {
    find: (name) => commandsByName.get(name),
    toJSON: () => [...commandsByName.values()].map((command) => command.data),
  };
}
