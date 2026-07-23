export interface GuildConfiguration {
  id: string;
  guildId: string;
  publicCategoryId: string | null;
  privateCategoryId: string | null;
  publicGeneratorChannelId: string | null;
  privateGeneratorChannelId: string | null;
  emptyChannelDeleteDelaySeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuildConfigurationInput {
  publicCategoryId?: string | null;
  privateCategoryId?: string | null;
  publicGeneratorChannelId?: string | null;
  privateGeneratorChannelId?: string | null;
  emptyChannelDeleteDelaySeconds?: number;
}

export interface GuildConfigurationDelegate {
  findUnique(args: { where: { guildId: string } }): Promise<GuildConfiguration | null>;
  upsert(args: {
    where: { guildId: string };
    create: { guildId: string } & GuildConfigurationInput;
    update: GuildConfigurationInput;
  }): Promise<GuildConfiguration>;
  delete(args: { where: { guildId: string } }): Promise<GuildConfiguration>;
}

export function isGuildConfigurationComplete(configuration: GuildConfiguration | null): boolean {
  return Boolean(
    configuration?.publicCategoryId &&
    configuration.privateCategoryId &&
    configuration.publicGeneratorChannelId &&
    configuration.privateGeneratorChannelId,
  );
}

export class GuildConfigurationRepository {
  public constructor(private readonly configurations: GuildConfigurationDelegate) {}

  public findByGuildId(guildId: string): Promise<GuildConfiguration | null> {
    return this.configurations.findUnique({ where: { guildId } });
  }

  public upsert(guildId: string, input: GuildConfigurationInput): Promise<GuildConfiguration> {
    return this.configurations.upsert({
      where: { guildId },
      create: { guildId, ...input },
      update: input,
    });
  }

  public deleteByGuildId(guildId: string): Promise<GuildConfiguration> {
    return this.configurations.delete({ where: { guildId } });
  }

  public async isComplete(guildId: string): Promise<boolean> {
    return isGuildConfigurationComplete(await this.findByGuildId(guildId));
  }
}
