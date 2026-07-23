import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type CategoryChannel,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildBasedChannel,
  type VoiceChannel,
} from 'discord.js';

import type { GuildConfiguration } from '../../database/repositories/guild-configuration-repository.js';
import type { CommandDependencies, SlashCommand } from './types.js';

const names = {
  publicCategory: 'CANALES PÚBLICOS',
  privateCategory: 'CANALES PRIVADOS',
  publicGenerator: '➕ Crear canal público',
  privateGenerator: '🔒 Crear canal privado',
} as const;

type ResourceKind = 'publicCategory' | 'privateCategory' | 'publicGenerator' | 'privateGenerator';
type ResolvedResource = {
  channel: CategoryChannel | VoiceChannel;
  created: boolean;
  kind: ResourceKind;
};

function isCategory(channel: GuildBasedChannel | undefined): channel is CategoryChannel {
  return channel?.type === ChannelType.GuildCategory;
}

function isVoice(channel: GuildBasedChannel | undefined): channel is VoiceChannel {
  return channel?.type === ChannelType.GuildVoice;
}

function findUniqueCategory(guild: Guild, name: string): CategoryChannel | undefined {
  const matches = guild.channels.cache.filter(
    (channel): channel is CategoryChannel => isCategory(channel) && channel.name === name,
  );
  return matches.size === 1 ? matches.first() : undefined;
}

function findUniqueVoice(guild: Guild, name: string, parentId: string): VoiceChannel | undefined {
  const matches = guild.channels.cache.filter(
    (channel): channel is VoiceChannel =>
      isVoice(channel) && channel.name === name && channel.parentId === parentId,
  );
  return matches.size === 1 ? matches.first() : undefined;
}

async function resolveCategory(
  guild: Guild,
  id: string | null | undefined,
  name: string,
  kind: ResourceKind,
): Promise<ResolvedResource> {
  const configured = id ? guild.channels.cache.get(id) : undefined;
  const reused = isCategory(configured) ? configured : findUniqueCategory(guild, name);
  if (reused) return { channel: reused, created: false, kind };
  const channel = await guild.channels.create({ name, type: ChannelType.GuildCategory });
  if (!isCategory(channel)) throw new Error('Discord did not create a category channel');
  return { channel, created: true, kind };
}

async function resolveGenerator(
  guild: Guild,
  id: string | null | undefined,
  name: string,
  parentId: string,
  kind: ResourceKind,
): Promise<ResolvedResource> {
  const configured = id ? guild.channels.cache.get(id) : undefined;
  const reused =
    isVoice(configured) && configured.parentId === parentId
      ? configured
      : findUniqueVoice(guild, name, parentId);
  if (reused) return { channel: reused, created: false, kind };
  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: parentId,
  });
  if (!isVoice(channel)) throw new Error('Discord did not create a voice channel');
  return { channel, created: true, kind };
}

async function rollback(
  resources: readonly ResolvedResource[],
  dependencies: CommandDependencies,
  guildId: string,
): Promise<boolean> {
  let failed = false;
  for (const resource of [...resources].reverse()) {
    if (!resource.created) continue;
    try {
      await resource.channel.delete('Rolling back failed /setup');
    } catch (error) {
      failed = true;
      dependencies.logger.error(
        { err: error, guildId, channelId: resource.channel.id },
        'Setup rollback failed',
      );
    }
  }
  return failed;
}

function formatResult(resources: readonly ResolvedResource[]): string {
  const created = resources.filter((resource) => resource.created).map((resource) => resource.kind);
  const reused = resources.filter((resource) => !resource.created).map((resource) => resource.kind);
  return `Configuración guardada. Creados: ${created.length ? created.join(', ') : 'ninguno'}. Reutilizados: ${reused.length ? reused.join(', ') : 'ninguno'}.`;
}

function canManageSetup(interaction: ChatInputCommandInteraction): boolean {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
}

export function createSetupCommand(dependencies: CommandDependencies): SlashCommand {
  return {
    data: new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Configura los canales base del bot.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .toJSON(),
    async execute(interaction): Promise<void> {
      if (!interaction.inGuild() || !interaction.guild) {
        await interaction.reply({
          content: 'Este comando solo se puede usar dentro de un servidor.',
          ephemeral: true,
        });
        return;
      }
      if (!canManageSetup(interaction)) {
        await interaction.reply({
          content: 'Necesitas el permiso Gestionar servidor para usar este comando.',
          ephemeral: true,
        });
        return;
      }
      const botPermissions = interaction.guild.members.me?.permissions;
      const required =
        PermissionFlagsBits.ViewChannel |
        PermissionFlagsBits.ManageChannels |
        PermissionFlagsBits.Connect;
      if (!botPermissions?.has(required)) {
        dependencies.logger.warn(
          { commandName: 'setup', guildId: interaction.guildId },
          'Bot lacks setup permissions',
        );
        await interaction.reply({
          content: 'No tengo los permisos necesarios para ver, gestionar y conectarme a canales.',
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const created: ResolvedResource[] = [];
      let persisted = false;
      try {
        const configuration: GuildConfiguration | null =
          await dependencies.configurationRepository.findByGuildId(interaction.guildId);
        const publicCategory = await resolveCategory(
          interaction.guild,
          configuration?.publicCategoryId,
          names.publicCategory,
          'publicCategory',
        );
        created.push(publicCategory);
        const privateCategory = await resolveCategory(
          interaction.guild,
          configuration?.privateCategoryId,
          names.privateCategory,
          'privateCategory',
        );
        created.push(privateCategory);
        const publicGenerator = await resolveGenerator(
          interaction.guild,
          configuration?.publicGeneratorChannelId,
          names.publicGenerator,
          publicCategory.channel.id,
          'publicGenerator',
        );
        created.push(publicGenerator);
        const privateGenerator = await resolveGenerator(
          interaction.guild,
          configuration?.privateGeneratorChannelId,
          names.privateGenerator,
          privateCategory.channel.id,
          'privateGenerator',
        );
        created.push(privateGenerator);
        await dependencies.configurationRepository.upsert(interaction.guildId, {
          publicCategoryId: publicCategory.channel.id,
          privateCategoryId: privateCategory.channel.id,
          publicGeneratorChannelId: publicGenerator.channel.id,
          privateGeneratorChannelId: privateGenerator.channel.id,
          ...(configuration
            ? { emptyChannelDeleteDelaySeconds: configuration.emptyChannelDeleteDelaySeconds }
            : {}),
        });
        persisted = true;
        dependencies.logger.info(
          { commandName: 'setup', guildId: interaction.guildId },
          'Setup completed',
        );
        await interaction.editReply(formatResult(created));
      } catch (error) {
        const rollbackFailed = persisted
          ? false
          : await rollback(created, dependencies, interaction.guildId);
        dependencies.logger.error(
          { err: error, commandName: 'setup', guildId: interaction.guildId },
          'Setup failed',
        );
        await interaction.editReply(
          rollbackFailed
            ? 'No fue posible completar la configuración y algunos recursos pueden requerir revisión manual.'
            : 'No fue posible completar la configuración. No se guardaron cambios.',
        );
      }
    },
  };
}
