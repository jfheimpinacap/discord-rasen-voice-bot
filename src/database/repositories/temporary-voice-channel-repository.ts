export const TemporaryVoiceChannelType = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;

export type TemporaryVoiceChannelType =
  (typeof TemporaryVoiceChannelType)[keyof typeof TemporaryVoiceChannelType];

export interface TemporaryVoiceChannel {
  id: string;
  guildId: string;
  channelId: string;
  ownerId: string | null;
  channelType: TemporaryVoiceChannelType;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemporaryVoiceChannelInput {
  guildId: string;
  channelId: string;
  ownerId: string | null;
  channelType: TemporaryVoiceChannelType;
}

export interface TemporaryVoiceChannelDelegate {
  findUnique(args: { where: { channelId: string } }): Promise<TemporaryVoiceChannel | null>;
  findMany(args: { where: { guildId: string } }): Promise<TemporaryVoiceChannel[]>;
  upsert(args: {
    where: { channelId: string };
    create: TemporaryVoiceChannelInput;
    update: Omit<TemporaryVoiceChannelInput, 'channelId'>;
  }): Promise<TemporaryVoiceChannel>;
  update(args: {
    where: { channelId: string };
    data: { ownerId: string | null };
  }): Promise<TemporaryVoiceChannel>;
  delete(args: { where: { channelId: string } }): Promise<TemporaryVoiceChannel>;
}

export class TemporaryVoiceChannelRepository {
  public constructor(private readonly channels: TemporaryVoiceChannelDelegate) {}

  public findByChannelId(channelId: string): Promise<TemporaryVoiceChannel | null> {
    return this.channels.findUnique({ where: { channelId } });
  }

  public listByGuildId(guildId: string): Promise<TemporaryVoiceChannel[]> {
    return this.channels.findMany({ where: { guildId } });
  }

  public upsert(input: TemporaryVoiceChannelInput): Promise<TemporaryVoiceChannel> {
    const { channelId, ...update } = input;
    return this.channels.upsert({ where: { channelId }, create: input, update });
  }

  public updateOwner(channelId: string, ownerId: string | null): Promise<TemporaryVoiceChannel> {
    return this.channels.update({ where: { channelId }, data: { ownerId } });
  }

  public deleteByChannelId(channelId: string): Promise<TemporaryVoiceChannel> {
    return this.channels.delete({ where: { channelId } });
  }
}
