import type {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type {
  GuildConfiguration,
  GuildConfigurationInput,
} from '../../database/repositories/guild-configuration-repository.js';

export interface CommandDependencies {
  readonly configurationRepository: GuildConfigurationStore;
  readonly logger: CommandLogger;
}

export interface GuildConfigurationStore {
  findByGuildId(guildId: string): Promise<GuildConfiguration | null>;
  upsert(guildId: string, input: GuildConfigurationInput): Promise<GuildConfiguration>;
}

export interface CommandLogger {
  error(bindings: object, message: string): void;
  info(bindings: object, message: string): void;
  warn(bindings: object, message: string): void;
}

export interface SlashCommand {
  readonly data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
