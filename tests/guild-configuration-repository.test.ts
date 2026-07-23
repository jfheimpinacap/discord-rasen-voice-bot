import { describe, expect, it, vi } from 'vitest';

import {
  GuildConfigurationRepository,
  isGuildConfigurationComplete,
  type GuildConfiguration,
  type GuildConfigurationDelegate,
} from '../src/database/repositories/guild-configuration-repository.js';

const completeConfiguration: GuildConfiguration = {
  id: 'configuration-1',
  guildId: '123456789012345678',
  publicCategoryId: '123456789012345679',
  privateCategoryId: '123456789012345680',
  publicGeneratorChannelId: '123456789012345681',
  privateGeneratorChannelId: '123456789012345682',
  emptyChannelDeleteDelaySeconds: 5,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createDelegate(): GuildConfigurationDelegate {
  return {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  };
}

describe('GuildConfigurationRepository', () => {
  it('identifies a configuration with every required channel ID as complete', () => {
    expect(isGuildConfigurationComplete(completeConfiguration)).toBe(true);
  });

  it('identifies a configuration missing a required ID as incomplete', () => {
    expect(
      isGuildConfigurationComplete({ ...completeConfiguration, privateCategoryId: null }),
    ).toBe(false);
  });

  it('upserts a configuration while preserving guildId as a string', async () => {
    const delegate = createDelegate();
    const repository = new GuildConfigurationRepository(delegate);
    vi.mocked(delegate.upsert).mockResolvedValue(completeConfiguration);

    await repository.upsert(completeConfiguration.guildId, {
      publicCategoryId: '123456789012345679',
    });

    expect(delegate.upsert).toHaveBeenCalledWith({
      where: { guildId: '123456789012345678' },
      create: { guildId: '123456789012345678', publicCategoryId: '123456789012345679' },
      update: { publicCategoryId: '123456789012345679' },
    });
  });

  it('returns null when a guild configuration does not exist', async () => {
    const delegate = createDelegate();
    const repository = new GuildConfigurationRepository(delegate);
    vi.mocked(delegate.findUnique).mockResolvedValue(null);

    await expect(repository.findByGuildId('123456789012345678')).resolves.toBeNull();
  });
});
