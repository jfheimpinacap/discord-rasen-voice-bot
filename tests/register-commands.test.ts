import { Routes } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';

import { createCommands } from '../src/discord/commands/index.js';
import { registerGuildCommands } from '../src/discord/register-commands.js';

describe('guild command registration', () => {
  it('uses the guild-scoped route and central command definitions without HTTP', async () => {
    const put = vi.fn().mockResolvedValue(undefined);
    const definitions = createCommands({
      configurationRepository: { findByGuildId: vi.fn(), upsert: vi.fn() },
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    }).toJSON();
    await registerGuildCommands({ put }, '100000000000000001', '100000000000000002', definitions);

    expect(put).toHaveBeenCalledWith(
      Routes.applicationGuildCommands('100000000000000001', '100000000000000002'),
      { body: definitions },
    );
    expect(put.mock.calls[0]?.[0]).not.toBe(Routes.applicationCommands('100000000000000001'));
  });
});
