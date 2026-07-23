import { Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

export interface CommandRegistrationRest {
  put(
    route: string,
    options: { body: RESTPostAPIChatInputApplicationCommandsJSONBody[] },
  ): Promise<unknown>;
}

export async function registerGuildCommands(
  rest: CommandRegistrationRest,
  clientId: string,
  guildId: string,
  definitions: RESTPostAPIChatInputApplicationCommandsJSONBody[],
): Promise<void> {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: definitions });
}
