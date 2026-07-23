import { describe, expect, it, vi } from 'vitest';

import {
  TemporaryVoiceChannelRepository,
  TemporaryVoiceChannelType,
  type TemporaryVoiceChannel,
  type TemporaryVoiceChannelDelegate,
} from '../src/database/repositories/temporary-voice-channel-repository.js';

const timestamp = new Date('2026-01-01T00:00:00.000Z');

function createDelegate(): TemporaryVoiceChannelDelegate {
  return {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe('TemporaryVoiceChannelRepository', () => {
  it('upserts a public channel with a null owner', async () => {
    const delegate = createDelegate();
    const repository = new TemporaryVoiceChannelRepository(delegate);
    const channel: TemporaryVoiceChannel = {
      id: 'channel-1',
      guildId: '123456789012345678',
      channelId: '123456789012345679',
      ownerId: null,
      channelType: TemporaryVoiceChannelType.PUBLIC,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    vi.mocked(delegate.upsert).mockResolvedValue(channel);

    await expect(repository.upsert(channel)).resolves.toEqual(channel);
  });

  it('upserts a private channel with its owner', async () => {
    const delegate = createDelegate();
    const repository = new TemporaryVoiceChannelRepository(delegate);
    const channel: TemporaryVoiceChannel = {
      id: 'channel-2',
      guildId: '123456789012345678',
      channelId: '123456789012345680',
      ownerId: '123456789012345681',
      channelType: TemporaryVoiceChannelType.PRIVATE,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    vi.mocked(delegate.upsert).mockResolvedValue(channel);

    await expect(repository.upsert(channel)).resolves.toEqual(channel);
  });

  it('updates a channel owner', async () => {
    const delegate = createDelegate();
    const repository = new TemporaryVoiceChannelRepository(delegate);
    const updated = {
      id: 'channel-2', guildId: '123456789012345678', channelId: '123456789012345680',
      ownerId: '123456789012345682', channelType: TemporaryVoiceChannelType.PRIVATE,
      createdAt: timestamp, updatedAt: timestamp,
    } satisfies TemporaryVoiceChannel;
    vi.mocked(delegate.update).mockResolvedValue(updated);

    await expect(repository.updateOwner(updated.channelId, updated.ownerId)).resolves.toEqual(updated);
  });

  it('deletes a channel record by channelId', async () => {
    const delegate = createDelegate();
    const repository = new TemporaryVoiceChannelRepository(delegate);
    const deleted = {
      id: 'channel-1', guildId: '123456789012345678', channelId: '123456789012345679',
      ownerId: null, channelType: TemporaryVoiceChannelType.PUBLIC,
      createdAt: timestamp, updatedAt: timestamp,
    } satisfies TemporaryVoiceChannel;
    vi.mocked(delegate.delete).mockResolvedValue(deleted);

    await expect(repository.deleteByChannelId(deleted.channelId)).resolves.toEqual(deleted);
  });
});
