import { ChannelType, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';

import type { GuildConfiguration } from '../src/database/repositories/guild-configuration-repository.js';
import { createSetupCommand } from '../src/discord/commands/setup-command.js';

type Channel = {
  id: string;
  name: string;
  type: ChannelType;
  parentId: string | null;
  delete: ReturnType<typeof vi.fn>;
};

class ChannelCache extends Map<string, Channel> {
  public filter(predicate: (channel: Channel) => boolean): ChannelCache {
    return new ChannelCache([...this].filter(([, channel]) => predicate(channel)));
  }

  public first(): Channel | undefined {
    return this.values().next().value;
  }
}

function configuration(ids: Partial<GuildConfiguration> = {}): GuildConfiguration {
  return {
    id: 'configuration',
    guildId: '100000000000000001',
    publicCategoryId: null,
    privateCategoryId: null,
    publicGeneratorChannelId: null,
    privateGeneratorChannelId: null,
    emptyChannelDeleteDelaySeconds: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...ids,
  };
}

function channel(
  id: string,
  name: string,
  type: ChannelType,
  parentId: string | null = null,
): Channel {
  return { id, name, type, parentId, delete: vi.fn().mockResolvedValue(undefined) };
}

function setup(existing: Channel[] = [], stored: GuildConfiguration | null = null) {
  const cache = new ChannelCache(existing.map((entry) => [entry.id, entry]));
  const create = vi.fn(async (options: { name: string; type: ChannelType; parent?: string }) => {
    const created = channel(
      `created-${create.mock.calls.length}`,
      options.name,
      options.type,
      options.parent ?? null,
    );
    cache.set(created.id, created);
    return created;
  });
  const guild = {
    channels: { cache, create },
    members: {
      me: {
        permissions: new PermissionsBitField(
          PermissionFlagsBits.ViewChannel |
            PermissionFlagsBits.ManageChannels |
            PermissionFlagsBits.Connect,
        ),
      },
    },
  };
  const repository = {
    findByGuildId: vi.fn().mockResolvedValue(stored),
    upsert: vi.fn().mockResolvedValue(configuration()),
  };
  const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
  const interaction = {
    inGuild: () => true,
    guildId: '100000000000000001',
    guild,
    memberPermissions: new PermissionsBitField(PermissionFlagsBits.ManageGuild),
    reply: vi.fn(),
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
  return {
    cache,
    create,
    guild,
    repository,
    logger,
    interaction,
    command: createSetupCommand({ configurationRepository: repository, logger }),
  };
}

describe('/setup guards', () => {
  it('rejects direct-message execution', async () => {
    const test = setup();
    await test.command.execute({ ...test.interaction, inGuild: () => false, guild: null } as never);
    expect(test.interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    );
  });

  it('rejects members without ManageGuild and bots without required permissions', async () => {
    const member = setup();
    await member.command.execute({
      ...member.interaction,
      memberPermissions: new PermissionsBitField(),
    } as never);
    expect(member.interaction.deferReply).not.toHaveBeenCalled();
    const bot = setup();
    await bot.command.execute({
      ...bot.interaction,
      guild: { ...bot.guild, members: { me: { permissions: new PermissionsBitField() } } },
    } as never);
    expect(bot.interaction.deferReply).not.toHaveBeenCalled();
  });
});

describe('/setup resource resolution', () => {
  it('creates all resources, associates generators, persists strings after creation, and reports them', async () => {
    const test = setup();
    await test.command.execute(test.interaction as never);

    expect(test.create).toHaveBeenCalledTimes(4);
    expect(test.create.mock.calls.map(([options]) => options)).toEqual([
      { name: 'CANALES PÚBLICOS', type: ChannelType.GuildCategory },
      { name: 'CANALES PRIVADOS', type: ChannelType.GuildCategory },
      { name: '➕ Crear canal público', type: ChannelType.GuildVoice, parent: 'created-1' },
      { name: '🔒 Crear canal privado', type: ChannelType.GuildVoice, parent: 'created-2' },
    ]);
    expect(test.repository.upsert).toHaveBeenCalledTimes(1);
    expect(test.repository.upsert).toHaveBeenCalledWith(
      '100000000000000001',
      expect.objectContaining({
        publicCategoryId: 'created-1',
        privateCategoryId: 'created-2',
        publicGeneratorChannelId: 'created-3',
        privateGeneratorChannelId: 'created-4',
      }),
    );
    const persisted = test.repository.upsert.mock.calls[0]?.[1];
    expect(
      Object.values(persisted ?? {}).filter((value) => typeof value === 'string'),
    ).toHaveLength(4);
    expect(test.repository.upsert.mock.invocationCallOrder[0]).toBeGreaterThan(
      test.create.mock.invocationCallOrder[3] ?? 0,
    );
    expect(test.interaction.editReply).toHaveBeenCalledWith(
      expect.stringContaining(
        'Configuración guardada. Creados: publicCategory, privateCategory, publicGenerator, privateGenerator',
      ),
    );
  });

  it('reuses a complete valid configuration without duplicates and reports reuse', async () => {
    const publicCategory = channel(
      'public-category',
      'CANALES PÚBLICOS',
      ChannelType.GuildCategory,
    );
    const privateCategory = channel(
      'private-category',
      'CANALES PRIVADOS',
      ChannelType.GuildCategory,
    );
    const publicGenerator = channel(
      'public-generator',
      '➕ Crear canal público',
      ChannelType.GuildVoice,
      publicCategory.id,
    );
    const privateGenerator = channel(
      'private-generator',
      '🔒 Crear canal privado',
      ChannelType.GuildVoice,
      privateCategory.id,
    );
    const test = setup(
      [publicCategory, privateCategory, publicGenerator, privateGenerator],
      configuration({
        publicCategoryId: publicCategory.id,
        privateCategoryId: privateCategory.id,
        publicGeneratorChannelId: publicGenerator.id,
        privateGeneratorChannelId: privateGenerator.id,
      }),
    );
    await test.command.execute(test.interaction as never);

    expect(test.create).not.toHaveBeenCalled();
    expect(test.repository.upsert).toHaveBeenCalledWith(
      test.interaction.guildId,
      expect.objectContaining({
        publicGeneratorChannelId: publicGenerator.id,
        privateGeneratorChannelId: privateGenerator.id,
      }),
    );
    expect(test.interaction.editReply).toHaveBeenCalledWith(
      expect.stringContaining(
        'Reutilizados: publicCategory, privateCategory, publicGenerator, privateGenerator',
      ),
    );
    expect(
      [publicCategory, privateCategory, publicGenerator, privateGenerator].flatMap(
        (entry) => entry.delete.mock.calls,
      ),
    ).toHaveLength(0);
  });

  it('repairs partial and invalid configurations while preserving the delete delay', async () => {
    const publicCategory = channel(
      'public-category',
      'CANALES PÚBLICOS',
      ChannelType.GuildCategory,
    );
    const publicGenerator = channel(
      'public-generator',
      '➕ Crear canal público',
      ChannelType.GuildVoice,
      publicCategory.id,
    );
    const test = setup(
      [publicCategory, publicGenerator],
      configuration({
        publicCategoryId: publicCategory.id,
        publicGeneratorChannelId: publicGenerator.id,
        privateCategoryId: 'missing-id',
        emptyChannelDeleteDelaySeconds: 12,
      }),
    );
    await test.command.execute(test.interaction as never);

    expect(test.create).toHaveBeenCalledTimes(2);
    expect(test.repository.upsert).toHaveBeenCalledWith(
      test.interaction.guildId,
      expect.objectContaining({
        publicCategoryId: publicCategory.id,
        publicGeneratorChannelId: publicGenerator.id,
        emptyChannelDeleteDelaySeconds: 12,
      }),
    );
    expect(test.interaction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Creados: privateCategory, privateGenerator'),
    );
    expect(test.interaction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Reutilizados: publicCategory, publicGenerator'),
    );
  });

  it('does not adopt wrong types, misplaced generators, or ambiguous name matches', async () => {
    const wrongType = channel('wrong-type', 'CANALES PÚBLICOS', ChannelType.GuildVoice);
    const misplaced = channel(
      'misplaced',
      '➕ Crear canal público',
      ChannelType.GuildVoice,
      'other-category',
    );
    const ambiguousOne = channel('ambiguous-1', 'CANALES PRIVADOS', ChannelType.GuildCategory);
    const ambiguousTwo = channel('ambiguous-2', 'CANALES PRIVADOS', ChannelType.GuildCategory);
    const test = setup(
      [wrongType, misplaced, ambiguousOne, ambiguousTwo],
      configuration({ publicCategoryId: 'wrong-type', publicGeneratorChannelId: misplaced.id }),
    );
    await test.command.execute(test.interaction as never);

    expect(test.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CANALES PÚBLICOS', type: ChannelType.GuildCategory }),
    );
    expect(test.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CANALES PRIVADOS', type: ChannelType.GuildCategory }),
    );
    expect(test.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: '➕ Crear canal público', type: ChannelType.GuildVoice }),
    );
    expect(wrongType.delete).not.toHaveBeenCalled();
    expect(misplaced.delete).not.toHaveBeenCalled();
  });

  it('rolls back only newly created resources in reverse order and keeps failures safe', async () => {
    const reused = channel('public-category', 'CANALES PÚBLICOS', ChannelType.GuildCategory);
    const test = setup([reused], configuration({ publicCategoryId: reused.id }));
    test.create
      .mockImplementationOnce(async (options) => {
        const created = channel('private-category', options.name, options.type);
        test.cache.set(created.id, created);
        return created;
      })
      .mockImplementationOnce(async (options) => {
        const created = channel(
          'public-generator',
          options.name,
          options.type,
          options.parent ?? null,
        );
        test.cache.set(created.id, created);
        return created;
      })
      .mockRejectedValueOnce(new Error('creation failure'));
    await test.command.execute(test.interaction as never);

    expect(test.repository.upsert).not.toHaveBeenCalled();
    expect(reused.delete).not.toHaveBeenCalled();
    const publicGeneratorOrder =
      test.cache.get('public-generator')?.delete.mock.invocationCallOrder[0];
    const privateCategoryOrder =
      test.cache.get('private-category')?.delete.mock.invocationCallOrder[0];
    expect(publicGeneratorOrder).toBeLessThan(privateCategoryOrder ?? Number.POSITIVE_INFINITY);
    expect(test.interaction.editReply).toHaveBeenCalledWith(
      'No fue posible completar la configuración. No se guardaron cambios.',
    );
  });

  it('logs rollback failures without exposing the original failure or secrets to the user', async () => {
    const test = setup();
    test.create
      .mockImplementationOnce(async (options) => {
        const created = channel('private-category', options.name, options.type);
        created.delete.mockRejectedValueOnce(new Error('rollback failure'));
        test.cache.set(created.id, created);
        return created;
      })
      .mockRejectedValueOnce(new Error('creation failure'));
    await test.command.execute(test.interaction as never);

    expect(test.repository.upsert).not.toHaveBeenCalled();
    expect(test.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'private-category' }),
      'Setup rollback failed',
    );
    expect(test.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Setup failed',
    );
    expect(test.interaction.editReply).toHaveBeenCalledWith(
      expect.not.stringMatching(/token|database_url|creation failure/i),
    );
  });
});
